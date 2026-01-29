import { useState } from 'react';
import { Alert, Button, Card, Col, Container, Form, Row, InputGroup } from 'react-bootstrap';
import { useNavigate, Link } from 'react-router-dom';
import { FiEye, FiEyeOff } from 'react-icons/fi';

import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import AppNavbar from '../components/AppNavbar';

const SignupPage = () => {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [formState, setFormState] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    pincode: '',
    dob: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    postalCode: '',
    country: '',
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  if (isAuthenticated) {
    return <navigate to="/" replace />;
  }

  const handleChange = (event) => {
    const { name, value } = event.target;
    
    // Phone number validation - only 10 digits
    if (name === 'phone') {
      const phoneValue = value.replace(/\D/g, '').slice(0, 10);
      setFormState((prev) => ({ ...prev, [name]: phoneValue }));
      return;
    }
    
    // Pincode validation - only 6 digits
    if (name === 'pincode') {
      const pincodeValue = value.replace(/\D/g, '').slice(0, 6);
      setFormState((prev) => ({ ...prev, [name]: pincodeValue }));
      return;
    }
    
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  const handleDateChange = (event) => {
    const { value } = event.target;
    // Convert from date input format (yyyy-mm-dd) to backend format (dd-mm-yyyy)
    if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const [year, month, day] = value.split('-');
      setFormState((prev) => ({ ...prev, dob: `${day}-${month}-${year}` }));
    }
  };

  const convertDateToInputFormat = (dobString) => {
    // Convert dd-mm-yyyy to yyyy-mm-dd for date input
    if (!dobString) return '';
    const parts = dobString.split('-');
    if (parts.length === 3 && /^\d{2}-\d{2}-\d{4}$/.test(dobString)) {
      const [day, month, year] = parts;
      return `${year}-${month}-${day}`;
    }
    return '';
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);

    if (formState.password !== formState.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formState.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    const payload = {
      name: formState.name,
      email: formState.email,
      password: formState.password,
      phone: formState.phone,
      pincode: formState.pincode,
      dob: formState.dob,
      address: {
        line1: formState.addressLine1,
        line2: formState.addressLine2,
        city: formState.city,
        state: formState.state,
        postalCode: formState.postalCode,
        country: formState.country,
      },
    };

    // Remove empty address fields
    if (!payload.address.line1) delete payload.address.line1;
    if (!payload.address.line2) delete payload.address.line2;
    if (!payload.address.city) delete payload.address.city;
    if (!payload.address.state) delete payload.address.state;
    if (!payload.address.postalCode) delete payload.address.postalCode;
    if (!payload.address.country) delete payload.address.country;
    if (Object.keys(payload.address).length === 0) delete payload.address;

    try {
      await api.post('/auth/register', payload);
      // Auto login after signup
      await login({ email: formState.email, password: formState.password });
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <AppNavbar />
      <Container fluid className="bg-light" style={{ minHeight: 'calc(100vh - 60px)', display: 'flex', alignItems: 'center', paddingTop: '1rem', paddingBottom: '1rem' }}>
        <Row className="justify-content-center w-100">
          <Col xs={11} sm={8} md={6} lg={5}>
            <Card className="shadow-sm">
            <Card.Body>
              <h3 className="mb-3 text-center">Create Account</h3>
              <p className="text-muted text-center mb-4">
                Sign up to start shopping
              </p>

              {error && <Alert variant="danger">{error}</Alert>}

              <Form onSubmit={handleSubmit}>
                <Form.Group controlId="name" className="mb-3">
                  <Form.Label>Full Name *</Form.Label>
                  <Form.Control
                    name="name"
                    value={formState.name}
                    placeholder="John Doe"
                    onChange={handleChange}
                    required
                  />
                </Form.Group>

                <Form.Group controlId="email" className="mb-3">
                  <Form.Label>Email *</Form.Label>
                  <Form.Control
                    type="email"
                    name="email"
                    value={formState.email}
                    placeholder="john@example.com"
                    onChange={handleChange}
                    required
                  />
                </Form.Group>

                <Form.Group controlId="password" className="mb-3">
                  <Form.Label>Password *</Form.Label>
                  <InputGroup>
                    <Form.Control
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={formState.password}
                      placeholder="At least 6 characters"
                      onChange={handleChange}
                      required
                      minLength={6}
                    />
                    <Button
                      variant="outline-secondary"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{ borderLeft: 'none' }}
                    >
                      {showPassword ? <FiEyeOff /> : <FiEye />}
                    </Button>
                  </InputGroup>
                </Form.Group>

                <Form.Group controlId="confirmPassword" className="mb-3">
                  <Form.Label>Confirm Password *</Form.Label>
                  <InputGroup>
                    <Form.Control
                      type={showConfirmPassword ? 'text' : 'password'}
                      name="confirmPassword"
                      value={formState.confirmPassword}
                      placeholder="Confirm your password"
                      onChange={handleChange}
                      required
                      minLength={6}
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

                <Form.Group controlId="phone" className="mb-3">
                  <Form.Label>Phone</Form.Label>
                  <Form.Control
                    type="tel"
                    name="phone"
                    value={formState.phone}
                    placeholder="1234567890"
                    onChange={handleChange}
                    maxLength={10}
                  />
                  <Form.Text className="text-muted">
                    10 digits only
                  </Form.Text>
                </Form.Group>

                <Form.Group controlId="pincode" className="mb-3">
                  <Form.Label>Pincode *</Form.Label>
                  <Form.Control
                    type="text"
                    name="pincode"
                    value={formState.pincode}
                    placeholder="123456"
                    onChange={handleChange}
                    maxLength={6}
                    required
                    pattern="[0-9]{6}"
                  />
                  <Form.Text className="text-muted">
                    6 digits only (required for shipping)
                  </Form.Text>
                </Form.Group>

                <Form.Group controlId="dob" className="mb-3">
                  <Form.Label>Date of Birth</Form.Label>
                  <Form.Control
                    type="date"
                    value={convertDateToInputFormat(formState.dob)}
                    onChange={handleDateChange}
                  />
                </Form.Group>

                <div className="d-grid mb-3">
                  <Button type="submit" variant="primary" disabled={loading}>
                    {loading ? 'Creating Account...' : 'Sign Up'}
                  </Button>
                </div>

                <div className="text-center">
                  <small className="text-muted">
                    Already have an account?{' '}
                    <Link to="/login">Sign in</Link>
                  </small>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
    </>
  );
};

export default SignupPage;

