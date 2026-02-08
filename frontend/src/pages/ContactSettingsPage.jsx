import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  Button,
  Card,
  Col,
  Container,
  Form,
  Row,
  Spinner,
} from 'react-bootstrap';
import { FiSave, FiMail, FiPhone, FiMapPin, FiClock } from 'react-icons/fi';

import AppNavbar from '../components/AppNavbar';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';

const ContactSettingsPage = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [formState, setFormState] = useState({
    contactEmail: '',
    contactPhone: '',
    officeAddress: '',
    officeCity: '',
    officeState: '',
    officePostalCode: '',
    officeCountry: 'India',
    businessHours: '',
    supportMessage: '',
  });

  const isAdmin = user?.role?.name?.toLowerCase() === 'admin' || user?.role?.name?.toLowerCase() === 'superadmin';

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (!isAdmin) {
      navigate('/');
      return;
    }
    fetchSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, isAdmin]);

  const fetchSettings = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get('/site-settings');
      if (data?.success && data?.data) {
        setFormState({
          contactEmail: data.data.contactEmail || '',
          contactPhone: data.data.contactPhone || '',
          officeAddress: data.data.officeAddress || '',
          officeCity: data.data.officeCity || '',
          officeState: data.data.officeState || '',
          officePostalCode: data.data.officePostalCode || '',
          officeCountry: data.data.officeCountry || 'India',
          businessHours: data.data.businessHours || '',
          supportMessage: data.data.supportMessage || '',
        });
      }
    } catch (error) {
      setError(error.response?.data?.message || error.message || 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormState((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const { data } = await api.put('/site-settings', formState);
      if (data?.success) {
        setSuccess('Contact settings updated successfully!');
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (error) {
      setError(error.response?.data?.message || error.message || 'Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <>
        <AppNavbar />
        <Container className="py-5">
          <div className="text-center">
            <Spinner animation="border" role="status" />
            <p className="mt-3 text-muted">Loading settings...</p>
          </div>
        </Container>
      </>
    );
  }

  return (
    <>
      <AppNavbar />
      <Container className="py-4">
        <Row>
          <Col>
            <h2>Contact Settings</h2>
            <p className="text-muted">Manage contact information displayed on the support page</p>
          </Col>
        </Row>

        {error && (
          <Alert variant="danger" dismissible onClose={() => setError(null)} className="mt-3">
            {error}
          </Alert>
        )}

        {success && (
          <Alert variant="success" dismissible onClose={() => setSuccess(null)} className="mt-3">
            {success}
          </Alert>
        )}

        <Form onSubmit={handleSubmit}>
          <Row>
            <Col lg={8}>
              <Card className="mb-4">
                <Card.Header>
                  <h5 className="mb-0">
                    <FiMail className="me-2" />
                    Contact Information
                  </h5>
                </Card.Header>
                <Card.Body>
                  <Row>
                    <Col md={6} className="mb-3">
                      <Form.Group>
                        <Form.Label>Support Email *</Form.Label>
                        <Form.Control
                          type="email"
                          name="contactEmail"
                          value={formState.contactEmail}
                          onChange={handleChange}
                          placeholder="support@example.com"
                          required
                        />
                        <Form.Text className="text-muted">
                          Email address displayed on support page
                        </Form.Text>
                      </Form.Group>
                    </Col>
                    <Col md={6} className="mb-3">
                      <Form.Group>
                        <Form.Label>Support Phone *</Form.Label>
                        <Form.Control
                          type="text"
                          name="contactPhone"
                          value={formState.contactPhone}
                          onChange={handleChange}
                          placeholder="+91 1234567890"
                          required
                        />
                        <Form.Text className="text-muted">
                          Phone number displayed on support page
                        </Form.Text>
                      </Form.Group>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>

              <Card className="mb-4">
                <Card.Header>
                  <h5 className="mb-0">
                    <FiMapPin className="me-2" />
                    Office Address
                  </h5>
                </Card.Header>
                <Card.Body>
                  <Form.Group className="mb-3">
                    <Form.Label>Street Address *</Form.Label>
                    <Form.Control
                      type="text"
                      name="officeAddress"
                      value={formState.officeAddress}
                      onChange={handleChange}
                      placeholder="2/148 Vinamra Khand"
                      required
                    />
                  </Form.Group>
                  <Row>
                    <Col md={4} className="mb-3">
                      <Form.Group>
                        <Form.Label>City</Form.Label>
                        <Form.Control
                          type="text"
                          name="officeCity"
                          value={formState.officeCity}
                          onChange={handleChange}
                          placeholder="Gomti Nagar"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={4} className="mb-3">
                      <Form.Group>
                        <Form.Label>State</Form.Label>
                        <Form.Control
                          type="text"
                          name="officeState"
                          value={formState.officeState}
                          onChange={handleChange}
                          placeholder="Uttar Pradesh"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={4} className="mb-3">
                      <Form.Group>
                        <Form.Label>Postal Code</Form.Label>
                        <Form.Control
                          type="text"
                          name="officePostalCode"
                          value={formState.officePostalCode}
                          onChange={handleChange}
                          placeholder="226010"
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                  <Form.Group className="mb-3">
                    <Form.Label>Country</Form.Label>
                    <Form.Control
                      type="text"
                      name="officeCountry"
                      value={formState.officeCountry}
                      onChange={handleChange}
                      placeholder="India"
                    />
                  </Form.Group>
                </Card.Body>
              </Card>

              <Card className="mb-4">
                <Card.Header>
                  <h5 className="mb-0">
                    <FiClock className="me-2" />
                    Additional Information
                  </h5>
                </Card.Header>
                <Card.Body>
                  <Form.Group className="mb-3">
                    <Form.Label>Business Hours</Form.Label>
                    <Form.Control
                      type="text"
                      name="businessHours"
                      value={formState.businessHours}
                      onChange={handleChange}
                      placeholder="Monday - Friday: 9:00 AM - 6:00 PM"
                    />
                    <Form.Text className="text-muted">
                      Optional: Display business hours on support page
                    </Form.Text>
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>Support Page Message</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      name="supportMessage"
                      value={formState.supportMessage}
                      onChange={handleChange}
                      placeholder="We're here to help! Get in touch with our support team..."
                    />
                    <Form.Text className="text-muted">
                      Welcome message displayed at the top of support page
                    </Form.Text>
                  </Form.Group>
                </Card.Body>
              </Card>

              <div className="d-flex justify-content-end gap-2 mb-4">
                <Button
                  variant="secondary"
                  onClick={() => navigate('/admin/products')}
                  disabled={saving}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  type="submit"
                  disabled={saving}
                  className="d-flex align-items-center gap-2"
                >
                  {saving ? (
                    <>
                      <Spinner size="sm" className="me-2" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <FiSave />
                      Save Settings
                    </>
                  )}
                </Button>
              </div>
            </Col>
            <Col lg={4}>
              <Card className="sticky-top" style={{ top: '20px' }}>
                <Card.Header>
                  <h5 className="mb-0">Preview</h5>
                </Card.Header>
                <Card.Body>
                  <div className="mb-3">
                    <strong>
                      <FiMail className="me-2" />
                      Email:
                    </strong>
                    <div className="mt-1">
                      <a href={`mailto:${formState.contactEmail}`}>
                        {formState.contactEmail || 'Not set'}
                      </a>
                    </div>
                  </div>
                  <div className="mb-3">
                    <strong>
                      <FiPhone className="me-2" />
                      Phone:
                    </strong>
                    <div className="mt-1">
                      <a href={`tel:${formState.contactPhone.replace(/\s/g, '')}`}>
                        {formState.contactPhone || 'Not set'}
                      </a>
                    </div>
                  </div>
                  <div className="mb-3">
                    <strong>
                      <FiMapPin className="me-2" />
                      Address:
                    </strong>
                    <div className="mt-1 text-muted small">
                      {formState.officeAddress || 'Not set'}
                      {formState.officeCity && `, ${formState.officeCity}`}
                      {formState.officeState && `, ${formState.officeState}`}
                      {formState.officePostalCode && ` - ${formState.officePostalCode}`}
                      {formState.officeCountry && `, ${formState.officeCountry}`}
                    </div>
                  </div>
                  {formState.businessHours && (
                    <div className="mb-3">
                      <strong>
                        <FiClock className="me-2" />
                        Hours:
                      </strong>
                      <div className="mt-1 text-muted small">
                        {formState.businessHours}
                      </div>
                    </div>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Form>
      </Container>
    </>
  );
};

export default ContactSettingsPage;

