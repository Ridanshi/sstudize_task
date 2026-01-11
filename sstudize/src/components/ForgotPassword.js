import React, { useState } from "react";
import { Container, Row, Col, Card, Form, Button, Alert } from "react-bootstrap";

function ForgotPassword() {
    const [email, setEmail] = useState("");
    const [message, setMessage] = useState("");

    const handleOnSubmit = async (e) => {
        e.preventDefault();

        try {
            const res = await fetch("http://localhost:5000/api/auth/forgot-password", {
                method: "POST",
                body: JSON.stringify({ email }),
                headers: {
                    "Content-Type": "application/json",
                }
            });

            const data = await res.json();

            if (data.success) {
                setMessage("Password reset link sent to your email.");
            } else {
                setMessage(data.error || "Failed to send reset link.");
            }
        } catch (error) {
            console.error("Forgot password error:", error);
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
                                Forgot Password
                            </Card.Title>
                            <p className="text-center text-muted mb-4">
                                Enter your email to receive a password reset link
                            </p>
                            <Form onSubmit={handleOnSubmit}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Email</Form.Label>
                                    <Form.Control
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />
                                </Form.Group>

                                <div className="text-center mt-4">
                                    <Button variant="primary" type="submit" className="w-100">
                                        Send Reset Link
                                    </Button>
                                </div>
                            </Form>

                            {message && (
                                <Alert
                                    className="mt-4 text-center"
                                    variant={message.includes("sent") ? "success" : "danger"}
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

export default ForgotPassword;