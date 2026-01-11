import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Container, Row, Col, Card, Button, Form, Alert, Badge } from "react-bootstrap";

function Dashboard() {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [message, setMessage] = useState("");
    const [showOtpInput, setShowOtpInput] = useState(false);
    const [otp, setOtp] = useState("");

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        const token = localStorage.getItem('accessToken');
        if (!token) {
            navigate('/login');
            return;
        }

        try {
            const res = await fetch('http://localhost:5000/api/user/profile', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await res.json();

            if (data.success) {
                setUser(data.user);
            } else {
                navigate('/login');
            }
        } catch (error) {
            console.error("Fetch profile error:", error);
            navigate('/login');
        }
    };

    const handleEnable2FA = async () => {
        const token = localStorage.getItem('accessToken');

        try {
            const res = await fetch('http://localhost:5000/api/auth/enable-2fa', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            const data = await res.json();

            if (data.success) {
                setMessage("OTP sent to your email. Enter it below to enable 2FA.");
                setShowOtpInput(true);
            } else {
                setMessage(data.error || "Failed to send OTP");
            }
        } catch (error) {
            console.error("Enable 2FA error:", error);
            setMessage("Cannot connect to server");
        }
    };

    const handleVerify2FASetup = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('accessToken');

        try {
            const res = await fetch('http://localhost:5000/api/auth/verify-2fa-setup', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ otp })
            });

            const data = await res.json();

            if (data.success) {
                setMessage("2FA enabled successfully!");
                setShowOtpInput(false);
                setOtp("");
                fetchProfile(); // Refresh user data
            } else {
                setMessage(data.error || "Invalid OTP");
            }
        } catch (error) {
            console.error("Verify 2FA error:", error);
            setMessage("Cannot connect to server");
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        navigate('/login');
    };

    if (!user) {
        return (
            <Container className="mt-5 text-center">
                <p>Loading...</p>
            </Container>
        );
    }

    return (
        <Container className="mt-5">
            <Row className="justify-content-center">
                <Col md={8}>
                    <Card className="shadow p-4">
                        <Card.Body>
                            <div className="d-flex justify-content-between align-items-center mb-4">
                                <Card.Title>Dashboard</Card.Title>
                                <Button variant="outline-danger" size="sm" onClick={handleLogout}>
                                    Logout
                                </Button>
                            </div>

                            <Card className="mb-4 bg-light">
                                <Card.Body>
                                    <h5>Profile Information</h5>
                                    <p><strong>Name:</strong> {user.name}</p>
                                    <p><strong>Email:</strong> {user.email}</p>
                                    <p><strong>Phone:</strong> {user.phone}</p>
                                    <p>
                                        <strong>2FA Status:</strong>{' '}
                                        {user.is2faEnabled ? (
                                            <Badge bg="success">Enabled</Badge>
                                        ) : (
                                            <Badge bg="warning">Disabled</Badge>
                                        )}
                                    </p>
                                </Card.Body>
                            </Card>

                            <Card className="mb-4">
                                <Card.Body>
                                    <h5>Security Settings</h5>
                                    {!user.is2faEnabled ? (
                                        <div>
                                            <p className="text-muted">
                                                Enable two-factor authentication for extra security.
                                                You'll need to enter an OTP sent to your email when logging in.
                                            </p>
                                            <Button variant="primary" onClick={handleEnable2FA}>
                                                Enable 2FA
                                            </Button>
                                        </div>
                                    ) : (
                                        <div>
                                            <p className="text-success">
                                                ✓ Two-factor authentication is enabled
                                            </p>
                                            <p className="text-muted small">
                                                You'll receive an OTP via email when logging in
                                            </p>
                                        </div>
                                    )}

                                    {showOtpInput && (
                                        <Form onSubmit={handleVerify2FASetup} className="mt-3">
                                            <Form.Group className="mb-3">
                                                <Form.Label>Enter OTP from Email</Form.Label>
                                                <Form.Control
                                                    type="text"
                                                    value={otp}
                                                    onChange={(e) => setOtp(e.target.value)}
                                                    placeholder="123456"
                                                    maxLength="6"
                                                    required
                                                />
                                            </Form.Group>
                                            <Button variant="success" type="submit">
                                                Verify & Enable 2FA
                                            </Button>
                                        </Form>
                                    )}
                                </Card.Body>
                            </Card>

                            {message && (
                                <Alert
                                    variant={message.includes("success") || message.includes("sent") ? "success" : "danger"}
                                >
                                    {message}
                                </Alert>
                            )}
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
}

export default Dashboard;