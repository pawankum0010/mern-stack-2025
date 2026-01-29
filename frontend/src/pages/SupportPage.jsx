import { useState, useEffect } from 'react';
import { Container, Card, Form, Button, Alert, Row, Col, Spinner } from 'react-bootstrap';
import { FiMail, FiPhone, FiMapPin, FiSend, FiCheckCircle, FiClock } from 'react-icons/fi';

import AppNavbar from '../components/AppNavbar';
import SEO from '../components/SEO';
import api from '../api/client';

const SupportPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [contactInfo, setContactInfo] = useState({
    contactEmail: 'infosoftchilli@gmail.com',
    contactPhone: '+91 9140100018',
    officeAddress: '2/148 Vinamra Khand',
    officeCity: 'Gomti Nagar',
    officeState: 'Uttar Pradesh',
    officePostalCode: '226010',
    officeCountry: 'India',
    businessHours: '',
    supportMessage: "We're here to help! Get in touch with our support team for any questions, concerns, or assistance you may need.",
  });

  useEffect(() => {
    fetchContactInfo();
  }, []);

  const fetchContactInfo = async () => {
    try {
      const { data } = await api.get('/site-settings/contact');
      if (data?.success && data?.data) {
        setContactInfo(data.data);
      }
    } catch (error) {
      console.error('Error fetching contact info:', error);
      // Keep default values if API fails
    } finally {
      setLoading(false);
    }
  };

  const getFullAddress = () => {
    const parts = [
      contactInfo.officeAddress,
      contactInfo.officeCity,
      contactInfo.officeState,
      contactInfo.officePostalCode ? `- ${contactInfo.officePostalCode}` : '',
      contactInfo.officeCountry,
    ].filter(Boolean);
    return parts.join(', ');
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSubmitted(false);

    try {
      const response = await api.post('/site-settings/support', {
        name: formData.name,
        email: formData.email,
        subject: formData.subject || 'Support Request',
        message: formData.message,
      });

      if (response.data.success) {
        setSubmitted(true);
        setFormData({
          name: '',
          email: '',
          subject: '',
          message: '',
        });
        
        // Reset submitted state after 5 seconds
        setTimeout(() => setSubmitted(false), 5000);
      } else {
        setError(response.data.message || 'Failed to submit support request. Please try again.');
      }
    } catch (err) {
      console.error('Error submitting support request:', err);
      setError(
        err.response?.data?.message || 
        'Failed to submit support request. Please try again later.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <>
        <SEO
          title="Customer Support"
          description="Get help and support from Soft Chilli customer service. Contact us via email, phone, or fill out our support form. We're here to assist you with your shopping needs."
          keywords="customer support, help, contact, soft chilli support, customer service, ecommerce support"
          url="https://erp.softchilli.com/support"
        />
        <AppNavbar />
        <Container className="py-5">
          <div className="text-center">
            <Spinner animation="border" role="status" />
            <p className="mt-3 text-muted">Loading support information...</p>
          </div>
        </Container>
      </>
    );
  }

  return (
    <>
      <SEO
        title="Customer Support"
        description="Get help and support from Soft Chilli customer service. Contact us via email, phone, or fill out our support form. We're here to assist you with your shopping needs."
        keywords="customer support, help, contact, soft chilli support, customer service, ecommerce support"
        url="https://erp.softchilli.com/support"
      />
      <AppNavbar />
      <Container className="py-5">
        <Row>
          <Col xs={12}>
            <h1 className="mb-4">Customer Support</h1>
            <p className="lead text-muted mb-5">
              {contactInfo.supportMessage || "We're here to help! Get in touch with our support team for any questions, concerns, or assistance you may need."}
            </p>
          </Col>
        </Row>

        <Row className="g-4 mb-5">
          {/* Contact Information Cards */}
          <Col md={4}>
            <Card className="h-100 text-center">
              <Card.Body className="p-4">
                <div className="mb-3">
                  <FiMail size={40} className="text-primary" />
                </div>
                <Card.Title>Email Support</Card.Title>
                <Card.Text className="text-muted">
                  Send us an email and we'll get back to you within 24 hours.
                </Card.Text>
                <a 
                  href={`mailto:${contactInfo.contactEmail}`}
                  className="text-decoration-none"
                >
                  {contactInfo.contactEmail}
                </a>
              </Card.Body>
            </Card>
          </Col>

          <Col md={4}>
            <Card className="h-100 text-center">
              <Card.Body className="p-4">
                <div className="mb-3">
                  <FiPhone size={40} className="text-success" />
                </div>
                <Card.Title>Phone Support</Card.Title>
                <Card.Text className="text-muted">
                  Call us during business hours for immediate assistance.
                </Card.Text>
                <a 
                  href={`tel:${contactInfo.contactPhone.replace(/\s/g, '')}`}
                  className="text-decoration-none"
                >
                  {contactInfo.contactPhone}
                </a>
              </Card.Body>
            </Card>
          </Col>

          <Col md={4}>
            <Card className="h-100 text-center">
              <Card.Body className="p-4">
                <div className="mb-3">
                  <FiMapPin size={40} className="text-danger" />
                </div>
                <Card.Title>Office Address</Card.Title>
                <Card.Text className="text-muted">
                  Visit us at our office location.
                </Card.Text>
                <Card.Text className="small">
                  {getFullAddress()}
                </Card.Text>
                {contactInfo.businessHours && (
                  <Card.Text className="small text-muted mt-2">
                    <FiClock className="me-1" size={14} />
                    {contactInfo.businessHours}
                  </Card.Text>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Support Form */}
        <Row>
          <Col lg={8} className="mx-auto">
            <Card>
              <Card.Header className="bg-primary text-white">
                <h4 className="mb-0">
                  <FiSend className="me-2" />
                  Send us a Message
                </h4>
              </Card.Header>
              <Card.Body className="p-4">
                {submitted && (
                  <Alert variant="success" className="d-flex align-items-center">
                    <FiCheckCircle className="me-2" size={20} />
                    <div>
                      <strong>Thank you!</strong> Your message has been prepared. 
                      Please check your email client to send it to us.
                    </div>
                  </Alert>
                )}

                {error && (
                  <Alert variant="danger" dismissible onClose={() => setError(null)}>
                    {error}
                  </Alert>
                )}

                <Form onSubmit={handleSubmit}>
                  <Row>
                    <Col md={6} className="mb-3">
                      <Form.Group>
                        <Form.Label>Your Name *</Form.Label>
                        <Form.Control
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          placeholder="Enter your name"
                          required
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6} className="mb-3">
                      <Form.Group>
                        <Form.Label>Your Email *</Form.Label>
                        <Form.Control
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          placeholder="your.email@example.com"
                          required
                        />
                      </Form.Group>
                    </Col>
                  </Row>

                  <Form.Group className="mb-3">
                    <Form.Label>Subject *</Form.Label>
                    <Form.Control
                      type="text"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      placeholder="What is this regarding?"
                      required
                    />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Message *</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={6}
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      placeholder="Please describe your question or issue in detail..."
                      required
                    />
                    <Form.Text className="text-muted">
                      Please provide as much detail as possible so we can assist you better.
                    </Form.Text>
                  </Form.Group>

                  <div className="d-grid">
                    <Button
                      variant="primary"
                      type="submit"
                      size="lg"
                      disabled={submitting}
                      className="d-flex align-items-center justify-content-center gap-2"
                    >
                      {submitting ? (
                        <>
                          <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                          Preparing...
                        </>
                      ) : (
                        <>
                          <FiSend />
                          Send Message
                        </>
                      )}
                    </Button>
                  </div>
                </Form>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* FAQ Section */}
        <Row className="mt-5">
          <Col lg={8} className="mx-auto">
            <Card>
              <Card.Header>
                <h4 className="mb-0">Frequently Asked Questions</h4>
              </Card.Header>
              <Card.Body>
                <div className="mb-4">
                  <h5>How do I track my order?</h5>
                  <p className="text-muted">
                    Once your order is shipped, you'll receive a tracking number via email. 
                    You can also check your order status in the "Your Orders" section of your account.
                  </p>
                </div>
                <div className="mb-4">
                  <h5>What is your return policy?</h5>
                  <p className="text-muted">
                    We offer a 7-day return policy on most products. Items must be in original 
                    condition with tags attached. Please contact us for return authorization.
                  </p>
                </div>
                <div className="mb-4">
                  <h5>How long does shipping take?</h5>
                  <p className="text-muted">
                    Standard shipping typically takes 3-5 business days. Express shipping options 
                    are available at checkout for faster delivery.
                  </p>
                </div>
                <div>
                  <h5>Do you ship internationally?</h5>
                  <p className="text-muted">
                    Currently, we ship within India. We're working on expanding our shipping 
                    options to other countries. Stay tuned!
                  </p>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </>
  );
};

export default SupportPage;


