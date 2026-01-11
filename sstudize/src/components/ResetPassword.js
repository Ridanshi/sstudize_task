import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Container, Row, Col, Card, Form, Button, Alert } from "react-bootstrap";

function ResetPassword() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [message, setMessage] = useState("");
    const [token, setToken] = useState("");

    useEffect(() => {
        const tokenFromUrl = searchParams.get('token');
        if (!tokenFromUrl) {
            setMessage("Invalid reset link");
        } else {
            setToken(tokenFromUrl);
        }
    }, [searchParams]);

    const handleOnSubmit = async (e) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            setMessage("Passwords do not match");
            return;
        }

        if (password.length < 8) {
            setMessage("Password must be at least 8 characters");
            return;
        }

        try {
            const res = await fetch("http://localhost:5000/api/auth/reset-password", {
                method: "POST",
                body: JSON.stringify({ token, password }),
                headers: {
                    "Content-Type": "application/json",
                }
            });

            const data = await res.json();

            if (data.success) {
                setMessage("Password reset successful! Redirecting to login...");
                setTimeout(() => navigate("/login"), 2000);
            } else {
                setMessage(data.error || "Failed to reset password");
            }
        } catch (error) {
            console.error("Reset password error:", error);
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
                                Reset Password
                            </Card.Title>
                            <p className="text-center text-muted mb-4">
                                Enter your new password
                            </p>

                            {!token ? (
                                <Alert variant="danger" className="text-center">
                                    Invalid or missing reset token
                                </Alert>
                            ) : (
                                <Form onSubmit={handleOnSubmit}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>New Password</Form.Label>
                                        <Form.Control
                                            type="password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="Min 8 characters"
                                            required
                                        />
                                    </Form.Group>

                                    <Form.Group className="mb-3">
                                        <Form.Label>Confirm Password</Form.Label>
                                        <Form.Control
                                            type="password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            required
                                        />
                                    </Form.Group>

                                    <div className="text-center mt-4">
                                        <Button variant="primary" type="submit" className="w-100">
                                            Reset Password
                                        </Button>
                                    </div>
                                </Form>
                            )}

                            {message && (
                                <Alert
                                    className="mt-4 text-center"
                                    variant={message.includes("successful") ? "success" : "danger"}
                                >
                                    {message}
                                </Alert>
                            )}

                            <div className="text-center mt-3">
                                <small>
                                    <a href="/login">Back to Login</a>
                                </small>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
}

export default ResetPassword;