import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Container, Row, Col, Card, Form, Button, Alert } from "react-bootstrap";

function Login() {
    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [otp, setOtp] = useState("");
    const [message, setMessage] = useState("");
    const [requires2fa, setRequires2fa] = useState(false);
    const [userId, setUserId] = useState("");

    const handleLogin = async (e) => {
        e.preventDefault();
        
        try {
            const res = await fetch('http://localhost:5000/api/auth/login', {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password })
            });

            const data = await res.json();

            if (data.requires2fa) {
                setRequires2fa(true);
                setUserId(data.userId);
                setMessage("OTP sent to your email. Check your inbox.");
            } else if (data.success) {
                localStorage.setItem('accessToken', data.accessToken);
                localStorage.setItem('refreshToken', data.refreshToken);
                setMessage("Login successful! Redirecting...");
                setTimeout(() => navigate("/dashboard"), 1500);
            } else {
                setMessage(data.error || "Login failed");
            }
        } catch (error) {
            console.error("Login error:", error);
            setMessage("Cannot connect to server");
        }
    };

    const handleVerifyOTP = async (e) => {
        e.preventDefault();

        try {
            const res = await fetch('http://localhost:5000/api/auth/verify-otp', {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId, otp })
            });

            const data = await res.json();

            if (data.success) {
                localStorage.setItem('accessToken', data.accessToken);
                localStorage.setItem('refreshToken', data.refreshToken);
                setMessage("OTP verified! Redirecting...");
                setTimeout(() => navigate("/dashboard"), 1500);
            } else {
                setMessage(data.error || "Invalid OTP");
            }
        } catch (error) {
            console.error("OTP verify error:", error);
            setMessage("Cannot connect to server");
        }
    };

    return (
        <Container className="mt-5">
            <Row className="justify-content-center">
                <Col md={6}>
                    <Card className="shadow p-4">
                        <Card.Body>
                            <Card.Title className="text-center mb-4">
                                {requires2fa ? "Enter OTP" : "Login"}
                            </Card.Title>

                            {!requires2fa ? (
                                <Form onSubmit={handleLogin}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Email</Form.Label>
                                        <Form.Control
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                        />
                                    </Form.Group>

                                    <Form.Group className="mb-3">
                                        <Form.Label>Password</Form.Label>
                                        <Form.Control
                                            type="password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            required
                                        />
                                    </Form.Group>

                                    <div className="text-end mb-3">
                                        <small>
                                            <a href="/forgot-password">Forgot Password?</a>
                                        </small>
                                    </div>

                                    <Button variant="primary" type="submit" className="w-100">
                                        Login
                                    </Button>
                                </Form>
                            ) : (
                                <Form onSubmit={handleVerifyOTP}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Enter OTP</Form.Label>
                                        <Form.Control
                                            type="text"
                                            value={otp}
                                            onChange={(e) => setOtp(e.target.value)}
                                            placeholder="123456"
                                            maxLength="6"
                                            required
                                        />
                                        <Form.Text className="text-muted">
                                            Check your email for the OTP code
                                        </Form.Text>
                                    </Form.Group>

                                    <Button variant="primary" type="submit" className="w-100">
                                        Verify OTP
                                    </Button>
                                </Form>
                            )}

                            {message && (
                                <Alert
                                    className="mt-4 text-center"
                                    variant={message.includes("successful") || message.includes("sent") ? "success" : "danger"}
                                >
                                    {message}
                                </Alert>
                            )}

                            <div className="text-center mt-3">
                                <small>
                                    Don't have an account? <a href="/">Register here</a>
                                </small>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
}

export default Login;