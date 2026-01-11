require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

mongoose.set('strictQuery', false);
mongoose.connect(process.env.MONGODB_URI || 'mongodb://mongo:27017/task')
    .then(() => console.log('MongoDB connected'))
    .catch(err => {
        console.error('DB error:', err);
        process.exit(1);
    });

const userSchema = new mongoose.Schema({
    name: String,
    email: { type: String, unique: true },
    phone: String,
    password_hash: String,
    is_2fa_enabled: { type: Boolean, default: false }
}, { timestamps: true });

const otpSchema = new mongoose.Schema({
    user_id: mongoose.Schema.Types.ObjectId,
    otp_code: String,
    expires_at: Date,
    is_used: { type: Boolean, default: false }
}, { timestamps: true });

const refreshTokenSchema = new mongoose.Schema({
    user_id: mongoose.Schema.Types.ObjectId,
    token: String,
    expires_at: Date,
    is_revoked: { type: Boolean, default: false }
});

const resetTokenSchema = new mongoose.Schema({
    user_id: mongoose.Schema.Types.ObjectId,
    token: String,
    expires_at: Date,
    is_used: { type: Boolean, default: false }
});

otpSchema.index({ expires_at: 1 }, { expireAfterSeconds: 0 });
refreshTokenSchema.index({ expires_at: 1 }, { expireAfterSeconds: 0 });
resetTokenSchema.index({ expires_at: 1 }, { expireAfterSeconds: 0 });

const User = mongoose.model('User', userSchema);
const OtpCode = mongoose.model('OtpCode', otpSchema);
const RefreshToken = mongoose.model('RefreshToken', refreshTokenSchema);
const PasswordResetToken = mongoose.model('PasswordResetToken', resetTokenSchema);

let emailTransporter = null;

if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    emailTransporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: Number(process.env.SMTP_PORT || 587),
        secure: false,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        }
    });
    console.log('Email configured');
} else {
    console.log('Email not configured - OTPs will be logged to console');
}

async function sendEmail(to, subject, html) {
    if (!emailTransporter) {
        console.log('=== EMAIL NOT CONFIGURED - OTP LOGGED BELOW ===');
        console.log(`To: ${to}`);
        console.log(`Subject: ${subject}`);
        // Extract OTP from HTML
        const otpMatch = html.match(/OTP:\s*(\d{6})/);
        if (otpMatch) {
            console.log(`***** OTP: ${otpMatch[1]} *****`);
        }
        return;
    }
    try {
        await emailTransporter.sendMail({
            from: `"Auth System" <${process.env.SMTP_USER}>`,
            to,
            subject,
            html
        });
        console.log(`Email sent to ${to}`);
    } catch (err) {
        console.error('Email error:', err.message);
    }
}

function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

function authenticateToken(req, res, next) {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    try {
        req.user = jwt.verify(token, process.env.JWT_ACCESS_SECRET || 'default-access-secret');
        next();
    } catch {
        res.status(403).json({ error: 'Invalid token' });
    }
}

app.post('/api/auth/register', async (req, res) => {
    try {
        const { name, email, phone, password } = req.body;

        const existing = await User.findOne({ email });
        if (existing) {
            return res.status(400).json({ error: 'Email already exists' });
        }

        const hashed = await bcrypt.hash(password, 10);
        const user = await User.create({
            name,
            email,
            phone,
            password_hash: hashed,
            is_2fa_enabled: true  // 2FA enabled by default
        });

        console.log(`User registered: ${email}`);
        res.json({ success: true, userId: user._id });
    } catch (err) {
        console.error('Register error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });

        if (!user || !(await bcrypt.compare(password, user.password_hash))) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        if (user.is_2fa_enabled) {
            const otp = generateOTP();

            await OtpCode.create({
                user_id: user._id,
                otp_code: otp,
                expires_at: new Date(Date.now() + 5 * 60 * 1000)
            });

            // Send email without waiting (fire and forget)
            sendEmail(
                user.email,
                'Your OTP Code',
                `<h2>Your OTP: ${otp}</h2><p>Valid for 5 minutes</p>`
            ).catch(err => console.error('Email send failed:', err));

            console.log(`=== LOGIN OTP for ${email}: ${otp} ===`);

            return res.json({ requires2fa: true, userId: user._id });
        }

        const accessToken = jwt.sign(
            { userId: user._id },
            process.env.JWT_ACCESS_SECRET || 'default-access-secret',
            { expiresIn: '15m' }
        );

        const refreshToken = jwt.sign(
            { userId: user._id },
            process.env.JWT_REFRESH_SECRET || 'default-refresh-secret',
            { expiresIn: '7d' }
        );

        await RefreshToken.create({
            user_id: user._id,
            token: refreshToken,
            expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        });

        res.json({ success: true, accessToken, refreshToken });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/api/auth/verify-otp', async (req, res) => {
    try {
        const { userId, otp } = req.body;

        const record = await OtpCode.findOne({
            user_id: userId,
            otp_code: otp,
            is_used: false,
            expires_at: { $gt: new Date() }
        });

        if (!record) return res.status(401).json({ error: 'Invalid OTP' });

        record.is_used = true;
        await record.save();

        const accessToken = jwt.sign(
            { userId },
            process.env.JWT_ACCESS_SECRET || 'default-access-secret',
            { expiresIn: '15m' }
        );

        const refreshToken = jwt.sign(
            { userId },
            process.env.JWT_REFRESH_SECRET || 'default-refresh-secret',
            { expiresIn: '7d' }
        );

        await RefreshToken.create({
            user_id: userId,
            token: refreshToken,
            expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        });

        console.log(`OTP verified successfully for user ${userId}`);
        res.json({ success: true, accessToken, refreshToken });
    } catch (err) {
        console.error('Verify OTP error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/api/auth/enable-2fa', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);

        const otp = generateOTP();
        await OtpCode.create({
            user_id: user._id,
            otp_code: otp,
            expires_at: new Date(Date.now() + 5 * 60 * 1000)
        });

        // Send email without waiting
        sendEmail(
            user.email,
            'Enable 2FA OTP',
            `<h2>Your OTP: ${otp}</h2>`
        ).catch(err => console.error('Email send failed:', err));

        console.log(`=== 2FA ENABLE OTP for ${user.email}: ${otp} ===`);

        res.json({ success: true, message: 'OTP sent' });
    } catch (err) {
        console.error('Enable 2FA error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/api/auth/verify-2fa-setup', authenticateToken, async (req, res) => {
    try {
        const { otp } = req.body;

        const record = await OtpCode.findOne({
            user_id: req.user.userId,
            otp_code: otp,
            is_used: false,
            expires_at: { $gt: new Date() }
        });

        if (!record) return res.status(401).json({ error: 'Invalid OTP' });

        record.is_used = true;
        await record.save();

        await User.findByIdAndUpdate(req.user.userId, { is_2fa_enabled: true });
        console.log(`2FA enabled for user ${req.user.userId}`);
        res.json({ success: true });
    } catch (err) {
        console.error('Verify 2FA setup error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

app.get('/api/user/profile', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId).select('-password_hash');
        if (!user) return res.status(404).json({ error: 'User not found' });

        res.json({
            success: true,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                is2faEnabled: user.is_2fa_enabled
            }
        });
    } catch (err) {
        console.error('Get profile error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/api/auth/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            return res.json({ success: true, message: 'If email exists, reset link sent' });
        }

        const resetToken = crypto.randomBytes(32).toString('hex');
        await PasswordResetToken.create({
            user_id: user._id,
            token: resetToken,
            expires_at: new Date(Date.now() + 60 * 60 * 1000)
        });

        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        const resetLink = `${frontendUrl}/reset-password?token=${resetToken}`;
        
        if (emailTransporter) {
            // Send email without waiting
            emailTransporter.sendMail({
                from: `"Auth System" <${process.env.SMTP_USER}>`,
                to: user.email,
                subject: 'Password Reset Request',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2>Password Reset</h2>
                        <p>Hi ${user.name || 'there'},</p>
                        <p>You requested to reset your password. Click the button below:</p>
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${resetLink}" style="background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a>
                        </div>
                        <p>Or copy and paste this link in your browser:</p>
                        <p style="background-color: #f5f5f5; padding: 10px; word-break: break-all;">${resetLink}</p>
                        <p><strong>This link expires in 1 hour.</strong></p>
                        <p style="color: #666; font-size: 14px;">If you didn't request this, please ignore this email.</p>
                    </div>
                `
            }).catch(err => console.error('Email send failed:', err));
            console.log('Password reset email sent to:', email);
        } else {
            console.log(`=== PASSWORD RESET TOKEN for ${email}: ${resetToken} ===`);
            console.log(`Reset link: ${resetLink}`);
        }

        res.json({ success: true, message: 'Reset link sent to your email' });
    } catch (err) {
        console.error('Forgot password error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/api/auth/reset-password', async (req, res) => {
    try {
        const { token, password } = req.body;

        const resetToken = await PasswordResetToken.findOne({
            token,
            is_used: false,
            expires_at: { $gt: new Date() }
        });

        if (!resetToken) {
            return res.status(400).json({ error: 'Invalid or expired token' });
        }

        const hashed = await bcrypt.hash(password, 10);
        await User.findByIdAndUpdate(resetToken.user_id, { password_hash: hashed });

        resetToken.is_used = true;
        await resetToken.save();

        await RefreshToken.updateMany(
            { user_id: resetToken.user_id },
            { is_revoked: true }
        );

        console.log(`Password reset successful for user ${resetToken.user_id}`);
        res.json({ success: true, message: 'Password reset successful' });
    } catch (err) {
        console.error('Reset password error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;