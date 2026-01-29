import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  Badge,
  Button,
  Card,
  Col,
  Container,
  Form,
  Modal,
  Row,
  Spinner,
  Table,
} from 'react-bootstrap';
import { FiEdit2, FiTrash2, FiPlus, FiCheck, FiX } from 'react-icons/fi';

import AppNavbar from '../components/AppNavbar';
import ProtectedRoute from '../components/ProtectedRoute';
import { useAuth } from '../context/AuthContext';
import { useCurrency } from '../context/CurrencyContext';
import api from '../api/client';

// Popular currencies
const POPULAR_CURRENCIES = [
  { code: 'USD', name: 'US Dollar', symbol: '$', position: 'before', decimalPlaces: 2 },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹', position: 'before', decimalPlaces: 2 },
  { code: 'EUR', name: 'Euro', symbol: '€', position: 'before', decimalPlaces: 2 },
  { code: 'GBP', name: 'British Pound', symbol: '£', position: 'before', decimalPlaces: 2 },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥', position: 'before', decimalPlaces: 0 },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', position: 'before', decimalPlaces: 2 },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$', position: 'before', decimalPlaces: 2 },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', position: 'before', decimalPlaces: 2 },
  { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ', position: 'before', decimalPlaces: 2 },
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$', position: 'before', decimalPlaces: 2 },
];

const CurrencySettingsPage = () => {
  const { user, isAuthenticated } = useAuth();
  const { updateCurrency, fetchDefaultCurrency } = useCurrency();
  const navigate = useNavigate();
  const [currencies, setCurrencies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingCurrency, setEditingCurrency] = useState(null);
  const [formState, setFormState] = useState({
    code: '',
    name: '',
    symbol: '',
    position: 'before',
    decimalPlaces: 2,
    isDefault: false,
    isActive: true,
  });
  const [submitting, setSubmitting] = useState(false);
  const overlayRef = useRef(null);
  const drawerRef = useRef(null);

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
    fetchCurrencies();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, isAdmin]);

  const fetchCurrencies = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get('/currencies');
      setCurrencies(data?.data || []);
    } catch (error) {
      setError(error.response?.data?.message || error.message || 'Failed to load currencies');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (currency = null) => {
    if (currency) {
      setEditingCurrency(currency);
      setFormState({
        code: currency.code,
        name: currency.name,
        symbol: currency.symbol,
        position: currency.position || 'before',
        decimalPlaces: currency.decimalPlaces || 2,
        isDefault: currency.isDefault || false,
        isActive: currency.isActive !== undefined ? currency.isActive : true,
      });
    } else {
      setEditingCurrency(null);
      setFormState({
        code: '',
        name: '',
        symbol: '',
        position: 'before',
        decimalPlaces: 2,
        isDefault: false,
        isActive: true,
      });
    }
    setShowModal(true);
    setError(null);
    setSuccess(null);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingCurrency(null);
    setError(null);
    setSuccess(null);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormState((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSelectPopularCurrency = (popularCurrency) => {
    setFormState((prev) => ({
      ...prev,
      code: popularCurrency.code,
      name: popularCurrency.name,
      symbol: popularCurrency.symbol,
      position: popularCurrency.position,
      decimalPlaces: popularCurrency.decimalPlaces,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const payload = {
        code: formState.code.toUpperCase(),
        name: formState.name,
        symbol: formState.symbol,
        position: formState.position,
        decimalPlaces: parseInt(formState.decimalPlaces),
        isDefault: formState.isDefault,
        isActive: formState.isActive,
      };

      if (editingCurrency) {
        await api.put(`/currencies/${editingCurrency._id}`, payload);
        setSuccess('Currency updated successfully');
      } else {
        await api.post('/currencies', payload);
        setSuccess('Currency created successfully');
      }

      await fetchCurrencies();
      
      // If this is the default currency, update the context
      if (formState.isDefault) {
        await fetchDefaultCurrency();
      }

      setTimeout(() => {
        handleCloseModal();
      }, 1000);
    } catch (error) {
      setError(error.response?.data?.message || error.message || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this currency?')) {
      return;
    }

    try {
      await api.delete(`/currencies/${id}`);
      setSuccess('Currency deleted successfully');
      await fetchCurrencies();
    } catch (error) {
      setError(error.response?.data?.message || error.message || 'Failed to delete currency');
    }
  };

  const handleSetDefault = async (id) => {
    try {
      await api.patch(`/currencies/${id}/set-default`);
      setSuccess('Default currency updated successfully');
      await fetchCurrencies();
      await fetchDefaultCurrency();
    } catch (error) {
      setError(error.response?.data?.message || error.message || 'Failed to set default currency');
    }
  };

  const renderCurrencies = () => {
    if (loading) {
      return (
        <div className="text-center py-4">
          <Spinner animation="border" role="status" />
          <p className="mt-2 text-muted">Loading currencies...</p>
        </div>
      );
    }

    if (currencies.length === 0) {
      return (
        <div className="text-center py-4 text-muted">
          No currencies found. Add your first currency!
        </div>
      );
    }

    return (
      <div className="table-responsive">
        <Table striped bordered hover>
          <thead>
            <tr>
              <th>Code</th>
              <th>Name</th>
              <th>Symbol</th>
              <th>Position</th>
              <th>Decimal Places</th>
              <th>Status</th>
              <th>Default</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {currencies.map((currency) => (
              <tr key={currency._id}>
                <td>
                  <strong>{currency.code}</strong>
                </td>
                <td>{currency.name}</td>
                <td>
                  <Badge bg="secondary">{currency.symbol}</Badge>
                </td>
                <td>{currency.position}</td>
                <td>{currency.decimalPlaces}</td>
                <td>
                  <Badge bg={currency.isActive ? 'success' : 'secondary'}>
                    {currency.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </td>
                <td>
                  {currency.isDefault ? (
                    <Badge bg="primary">
                      <FiCheck className="me-1" />
                      Default
                    </Badge>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline-primary"
                      onClick={() => handleSetDefault(currency._id)}
                    >
                      Set Default
                    </Button>
                  )}
                </td>
                <td>
                  <div className="d-flex gap-2">
                    <Button
                      size="sm"
                      variant="outline-primary"
                      onClick={() => handleOpenModal(currency)}
                      title="Edit"
                    >
                      <FiEdit2 />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline-danger"
                      onClick={() => handleDelete(currency._id)}
                      title="Delete"
                      disabled={currency.isDefault}
                    >
                      <FiTrash2 />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>
    );
  };

  return (
    <>
      <AppNavbar />
      <Container fluid className="py-4">
        <Row className="mb-3">
          <Col>
            <h2>Currency Settings</h2>
            <p className="text-muted">Manage currencies and set default currency for your store</p>
          </Col>
          <Col xs="auto">
            <Button variant="primary" onClick={() => handleOpenModal()}>
              <FiPlus className="me-2" />
              Add Currency
            </Button>
          </Col>
        </Row>

        {error && (
          <Alert variant="danger" dismissible onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert variant="success" dismissible onClose={() => setSuccess(null)}>
            {success}
          </Alert>
        )}

        <Card>
          <Card.Body>{renderCurrencies()}</Card.Body>
        </Card>
      </Container>

      {/* Add/Edit Modal */}
      <Modal show={showModal} onHide={handleCloseModal} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title>{editingCurrency ? 'Edit Currency' : 'Add Currency'}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            {error && <Alert variant="danger">{error}</Alert>}
            {success && <Alert variant="success">{success}</Alert>}

            {/* Popular Currencies */}
            {!editingCurrency && (
              <div className="mb-4">
                <Form.Label className="fw-bold">Popular Currencies</Form.Label>
                <div className="d-flex flex-wrap gap-2">
                  {POPULAR_CURRENCIES.map((popular) => (
                    <Button
                      key={popular.code}
                      variant="outline-secondary"
                      size="sm"
                      onClick={() => handleSelectPopularCurrency(popular)}
                    >
                      {popular.symbol} {popular.code}
                    </Button>
                  ))}
                </div>
                <Form.Text className="text-muted">
                  Click on a popular currency to auto-fill the form
                </Form.Text>
              </div>
            )}

            <Row>
              <Col md={6} className="mb-3">
                <Form.Group>
                  <Form.Label>Currency Code *</Form.Label>
                  <Form.Control
                    type="text"
                    name="code"
                    value={formState.code}
                    onChange={handleChange}
                    placeholder="USD, INR, EUR, etc."
                    maxLength={3}
                    required
                    disabled={!!editingCurrency}
                    style={{ textTransform: 'uppercase' }}
                  />
                  <Form.Text className="text-muted">3-letter ISO code (e.g., USD, INR)</Form.Text>
                </Form.Group>
              </Col>
              <Col md={6} className="mb-3">
                <Form.Group>
                  <Form.Label>Currency Name *</Form.Label>
                  <Form.Control
                    type="text"
                    name="name"
                    value={formState.name}
                    onChange={handleChange}
                    placeholder="US Dollar, Indian Rupee, etc."
                    required
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6} className="mb-3">
                <Form.Group>
                  <Form.Label>Symbol *</Form.Label>
                  <Form.Control
                    type="text"
                    name="symbol"
                    value={formState.symbol}
                    onChange={handleChange}
                    placeholder="$, ₹, €, etc."
                    maxLength={10}
                    required
                  />
                  <Form.Text className="text-muted">Currency symbol to display</Form.Text>
                </Form.Group>
              </Col>
              <Col md={6} className="mb-3">
                <Form.Group>
                  <Form.Label>Position *</Form.Label>
                  <Form.Select name="position" value={formState.position} onChange={handleChange} required>
                    <option value="before">Before amount ($100)</option>
                    <option value="after">After amount (100 $)</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6} className="mb-3">
                <Form.Group>
                  <Form.Label>Decimal Places *</Form.Label>
                  <Form.Control
                    type="number"
                    name="decimalPlaces"
                    value={formState.decimalPlaces}
                    onChange={handleChange}
                    min="0"
                    max="4"
                    required
                  />
                  <Form.Text className="text-muted">Number of decimal places (0-4)</Form.Text>
                </Form.Group>
              </Col>
              <Col md={6} className="mb-3">
                <Form.Group className="mt-4">
                  <Form.Check
                    type="checkbox"
                    name="isDefault"
                    label="Set as Default Currency"
                    checked={formState.isDefault}
                    onChange={handleChange}
                  />
                  <Form.Check
                    type="checkbox"
                    name="isActive"
                    label="Active"
                    checked={formState.isActive}
                    onChange={handleChange}
                  />
                </Form.Group>
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseModal} disabled={submitting}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={submitting}>
              {submitting ? 'Saving...' : editingCurrency ? 'Update' : 'Create'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </>
  );
};

const CurrencySettingsPageWithProtection = () => (
  <ProtectedRoute roles={['admin', 'superadmin']}>
    <CurrencySettingsPage />
  </ProtectedRoute>
);

export default CurrencySettingsPageWithProtection;

