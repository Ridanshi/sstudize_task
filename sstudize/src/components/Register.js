import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Container, Row, Col, Card, Form, Button, Alert } from "react-bootstrap";

function Register() {
    let history = useNavigate();

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [message, setMessage] = useState("");

    const handleOnSubmit = async (e) => {
        e.preventDefault();
        
        if (password !== confirmPassword) {
            setMessage("Passwords do not match.");
            return;
        }

        try {
            const res = await fetch('http://localhost:5000/api/auth/register', {
                method: "POST",
                body: JSON.stringify({ name, email, phone, password }),
                headers: {
                    "Content-Type": "application/json",
                }
            });

            const data = await res.json();

            if (data.success) {
                setMessage("Registration successful! Redirecting...");
                setTimeout(() => history("/login"), 1500);
            } else {
                setMessage(data.error || "Registration failed");
            }
        } catch (error) {
            console.error("ERROR", error);
            setMessage("Cannot connect to server. Make sure backend is running on port 5000.");
        }
    };

    return (
        <Container className="mt-5">
            <Row className="justify-content-center">
                <Col md={6}>
                    <Card className="shadow p-4">
                        <Card.Body>
                            <Card.Title className="text-center mb-4">
                                Create Account
                            </Card.Title>
                            <Form onSubmit={handleOnSubmit}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Full Name</Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        required
                                    />
                                </Form.Group>

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
                                    <Form.Label>Phone Number</Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        placeholder="+1234567890"
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
                                        Register
                                    </Button>
                                </div>
                            </Form>

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
                                    Already have an account? <a href="/login">Login here</a>
                                </small>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
}

export default Register;