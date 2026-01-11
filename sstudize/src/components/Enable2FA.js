import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Container, Row, Col, Card, Form, Button, Alert } from "react-bootstrap";

function Enable2FA() {
    let history = useNavigate();

    const [step, setStep] = useState(1);
    const [otp, setOtp] = useState("");
    const [result, setResult] = useState("");

    const handleSendOtp = async () => {
        const token = localStorage.getItem("accessToken");

        const res = await fetch("/api/auth/enable-2fa", {
            method: "post",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            credentials: "include"
        });

        const result = await res.json();

        if (result.status === "success") {
            setStep(2);
            setResult("OTP sent to your phone.");
        } else {
            setResult(result.message || "Failed to send OTP.");
        }
    };

    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem("accessToken");

        const res = await fetch("/api/auth/verify-2fa-setup", {
            method: "post",
            body: JSON.stringify({ otp }),
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            credentials: "include"
        });

        const result = await res.json();

        if (result.status === "success") {
            setResult("2FA enabled successfully! Redirecting...");
            setTimeout(() => history("/dashboard"), 1500);
        } else {
            setResult(result.message || "Verification failed.");
        }
    };

    return (
        <>
            <Container className="mt-5">
                <Row className="justify-content-center">
                    <Col md={6}>
                        <Card className="shadow p-4">
                            <Card.Body>
                                <Card.Title className="text-center mb-4">
                                    Enable Two-Factor Authentication
                                </Card.Title>

                                {step === 1 && (
                                    <>
                                        <p className="text-center mb-4">
                                            Add an extra layer of security to your account
                                        </p>
                                        <div className="text-center">
                                            <Button variant="primary" onClick={handleSendOtp} className="w-100">
                                                Send OTP
                                            </Button>
                                        </div>
                                    </>
                                )}

                                {step === 2 && (
                                    <Form onSubmit={handleVerifyOtp}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Enter OTP</Form.Label>
                                            <Form.Control
                                                type="text"
                                                value={otp}
                                                onChange={(e) => setOtp(e.target.value)}
                                                maxLength="6"
                                                required
                                            />
                                        </Form.Group>

                                        <div className="text-center mt-4">
                                            <Button variant="primary" type="submit" className="w-100">
                                                Verify & Enable
                                            </Button>
                                        </div>
                                    </Form>
                                )}

                                {result && (
                                    <Alert
                                        className="mt-4 text-center"
                                        variant={result.includes("success") ? "success" : "danger"}
                                    >
                                        {result}
                                    </Alert>
                                )}
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            </Container>
        </>
    );
}

export default Enable2FA;