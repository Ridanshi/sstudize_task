import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Container, Row, Col, Card, Form, Button, Alert } from "react-bootstrap";

function VerifyOtp() {
    let history = useNavigate();

    const [otp, setOtp] = useState("");
    const [result, setResult] = useState("");

    const handleOnSubmit = async (e) => {
        e.preventDefault();

        const userId = localStorage.getItem("tempUserId");

        if (!userId) {
            setResult("Session expired. Please login again.");
            setTimeout(() => history("/login"), 1500);
            return;
        }

        const res = await fetch("/api/auth/verify-otp", {
            method: "post",
            body: JSON.stringify({ userId, otp }),
            headers: {
                "Content-Type": "application/json",
            },
            credentials: "include"
        });

        const result = await res.json();

        if (result.status === "success") {
            localStorage.removeItem("tempUserId");
            localStorage.setItem("accessToken", result.accessToken);
            localStorage.setItem("refreshToken", result.refreshToken);
            setResult("Verification successful! Redirecting...");
            setTimeout(() => history("/dashboard"), 1000);
        } else {
            setResult(result.message || "Verification failed.");
        }
    };

    const handleResendOtp = async () => {
        const userId = localStorage.getItem("tempUserId");

        const res = await fetch("/api/auth/resend-otp", {
            method: "post",
            body: JSON.stringify({ userId }),
            headers: {
                "Content-Type": "application/json",
            },
            credentials: "include"
        });

        const result = await res.json();

        if (result.status === "success") {
            setResult("OTP resent successfully!");
        } else {
            setResult(result.message || "Failed to resend OTP.");
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
                                    Verify OTP
                                </Card.Title>
                                <p className="text-center text-muted mb-4">
                                    Enter the 6-digit code sent to your phone
                                </p>
                                <Form onSubmit={handleOnSubmit}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>OTP Code</Form.Label>
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
                                            Verify
                                        </Button>
                                    </div>
                                </Form>

                                {result && (
                                    <Alert
                                        className="mt-4 text-center"
                                        variant={result.includes("successful") ? "success" : "danger"}
                                    >
                                        {result}
                                    </Alert>
                                )}

                                <div className="text-center mt-3">
                                    <small>
                                        Didn't receive code? <a href="#" onClick={handleResendOtp}>Resend OTP</a>
                                    </small>
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            </Container>
        </>
    );
}

export default VerifyOtp;