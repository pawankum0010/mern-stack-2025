import { useState } from 'react';
import { Alert, Button, Card, Form, InputGroup } from 'react-bootstrap';
import { useNavigate, Navigate, Link } from 'react-router-dom';
import { FiEye, FiEyeOff } from 'react-icons/fi';

import { useAuth } from '../context/AuthContext';

const ADMIN_ROLES = ['admin', 'superadmin', 'support'];

const BackendLoginPage = () => {
  const { login, isAuthenticated, user, authError, loading } = useAuth();
  const navigate = useNavigate();

  const [formState, setFormState] = useState({ email: '', password: '' });
  const [error, setError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  const userRole = user?.role?.name?.toLowerCase?.();
  if (isAuthenticated && userRole && ADMIN_ROLES.includes(userRole)) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      const response = await login(formState);
      const role = response?.data?.user?.role?.name?.toLowerCase?.();
      if (role && ADMIN_ROLES.includes(role)) {
        navigate('/admin/dashboard', { replace: true });
        return;
      }
      setError('This page is for administrators only. Please use the main site to sign in.');
    } catch (err) {
      setError(err.message || 'Invalid credentials');
    }
  };

  return (
    <div className="backend-login-wrap">
      <div className="backend-login-brand">
        <img src="/logo.svg" alt="Soft Chilli" onError={(e) => { e.target.style.display = 'none'; }} />
        <h1>Admin Sign In</h1>
        <p>Sign in to the backend</p>
      </div>
      <Card className="backend-login-card">
        <Card.Body>
          {(error || authError) && (
            <Alert variant="danger" className="mb-3">{error || authError}</Alert>
          )}
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Email</Form.Label>
              <Form.Control
                type="email"
                name="email"
                value={formState.email}
                onChange={handleChange}
                placeholder="Admin email"
                required
                className="backend-login-input"
              />
            </Form.Group>
            <Form.Group className="mb-4">
              <Form.Label>Password</Form.Label>
              <InputGroup>
                <Form.Control
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formState.password}
                  onChange={handleChange}
                  placeholder="Password"
                  required
                  minLength={6}
                  className="backend-login-input"
                />
                <Button
                  type="button"
                  variant="outline-secondary"
                  onClick={() => setShowPassword(!showPassword)}
                  className="backend-login-toggle-pw"
                >
                  {showPassword ? <FiEyeOff /> : <FiEye />}
                </Button>
              </InputGroup>
            </Form.Group>
            <Button type="submit" variant="primary" className="backend-login-btn w-100" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
            <div className="backend-login-forgot text-center mt-3">
              <Link to="/forgot-password">Forgot password?</Link>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </div>
  );
};

export default BackendLoginPage;
