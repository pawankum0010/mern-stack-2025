import { useState } from 'react';
import { Alert, Button, Card, Col, Container, Form, Row } from 'react-bootstrap';
import { useNavigate, Link } from 'react-router-dom';
import { FiArrowLeft } from 'react-icons/fi';

import api from '../api/client';

const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);
    setSuccess(false);
    setLoading(true);

    try {
      await api.post('/auth/forgot-password', { email });
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container fluid className="bg-light min-vh-100 d-flex align-items-center">
      <Row className="justify-content-center w-100">
        <Col xs={11} sm={8} md={6} lg={4}>
          <Card className="shadow-sm">
            <Card.Body>
              <div className="mb-3">
                <Button
                  variant="link"
                  className="p-0 mb-2"
                  onClick={() => navigate('/login')}
                >
                  <FiArrowLeft className="me-2" />
                  Back to Login
                </Button>
              </div>

              <h3 className="mb-3 text-center">Forgot Password</h3>
              <p className="text-muted text-center mb-4">
                Enter your email address and we'll send you a link to reset your password.
              </p>

              {error && <Alert variant="danger">{error}</Alert>}
              
              {success ? (
                <Alert variant="success">
                  <strong>Email sent!</strong> Please check your email for password reset instructions.
                  The link will expire in 1 hour.
                </Alert>
              ) : (
                <Form onSubmit={handleSubmit}>
                  <Form.Group controlId="email" className="mb-3">
                    <Form.Label>Email Address</Form.Label>
                    <Form.Control
                      type="email"
                      name="email"
                      value={email}
                      placeholder="Enter your email"
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={loading}
                    />
                  </Form.Group>

                  <div className="d-grid">
                    <Button type="submit" variant="primary" disabled={loading}>
                      {loading ? 'Sending...' : 'Send Reset Link'}
                    </Button>
                  </div>
                </Form>
              )}
            </Card.Body>
            <Card.Footer className="text-muted small text-center">
              <div>
                Remember your password? <Link to="/login">Sign in</Link>
              </div>
            </Card.Footer>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default ForgotPasswordPage;

