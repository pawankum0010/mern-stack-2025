import { useState, useEffect } from 'react';
import { Alert, Button, Card, Col, Container, Form, Row, InputGroup } from 'react-bootstrap';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { FiEye, FiEyeOff, FiArrowLeft } from 'react-icons/fi';

import api from '../api/client';

const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const email = searchParams.get('email');

  const [formState, setFormState] = useState({
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (!token || !email) {
      setError('Invalid reset link. Please request a new password reset.');
    }
  }, [token, email]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
    setError(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);

    if (!token || !email) {
      setError('Invalid reset link. Please request a new password reset.');
      return;
    }

    if (formState.password !== formState.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formState.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      await api.post('/auth/reset-password', {
        token,
        email,
        password: formState.password,
      });
      setSuccess(true);
      setTimeout(() => {
        navigate('/login', { replace: true });
      }, 3000);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  if (!token || !email) {
    return (
      <Container fluid className="bg-light min-vh-100 d-flex align-items-center">
        <Row className="justify-content-center w-100">
          <Col xs={11} sm={8} md={6} lg={4}>
            <Card className="shadow-sm">
              <Card.Body>
                <Alert variant="danger">
                  Invalid reset link. Please request a new password reset.
                </Alert>
                <div className="d-grid">
                  <Button variant="primary" onClick={() => navigate('/forgot-password')}>
                    Request New Reset Link
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    );
  }

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

              <h3 className="mb-3 text-center">Reset Password</h3>
              <p className="text-muted text-center mb-4">
                Enter your new password below.
              </p>

              {error && <Alert variant="danger">{error}</Alert>}
              
              {success ? (
                <Alert variant="success">
                  <strong>Password reset successfully!</strong> Redirecting to login page...
                </Alert>
              ) : (
                <Form onSubmit={handleSubmit}>
                  <Form.Group controlId="password" className="mb-3">
                    <Form.Label>New Password *</Form.Label>
                    <InputGroup>
                      <Form.Control
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        value={formState.password}
                        placeholder="Enter new password"
                        onChange={handleChange}
                        required
                        minLength={6}
                        disabled={loading}
                      />
                      <Button
                        variant="outline-secondary"
                        onClick={() => setShowPassword(!showPassword)}
                        style={{ borderLeft: 'none' }}
                      >
                        {showPassword ? <FiEyeOff /> : <FiEye />}
                      </Button>
                    </InputGroup>
                    <Form.Text className="text-muted">
                      Must be at least 6 characters
                    </Form.Text>
                  </Form.Group>

                  <Form.Group controlId="confirmPassword" className="mb-4">
                    <Form.Label>Confirm New Password *</Form.Label>
                    <InputGroup>
                      <Form.Control
                        type={showConfirmPassword ? 'text' : 'password'}
                        name="confirmPassword"
                        value={formState.confirmPassword}
                        placeholder="Confirm new password"
                        onChange={handleChange}
                        required
                        minLength={6}
                        disabled={loading}
                      />
                      <Button
                        variant="outline-secondary"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        style={{ borderLeft: 'none' }}
                      >
                        {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
                      </Button>
                    </InputGroup>
                  </Form.Group>

                  <div className="d-grid">
                    <Button type="submit" variant="primary" disabled={loading}>
                      {loading ? 'Resetting...' : 'Reset Password'}
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

export default ResetPasswordPage;

