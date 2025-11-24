import { useEffect, useState } from 'react';
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
import { FiEdit2, FiTrash2, FiPlus, FiX } from 'react-icons/fi';

import AppNavbar from '../components/AppNavbar';
import ProtectedRoute from '../components/ProtectedRoute';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';

const WeightUnitsPage = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [weightUnits, setWeightUnits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingWeightUnit, setEditingWeightUnit] = useState(null);
  const [formState, setFormState] = useState({
    name: '',
    code: '',
    symbol: '',
    status: 'active',
  });
  const [submitting, setSubmitting] = useState(false);

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
    fetchWeightUnits();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, isAdmin]);

  const fetchWeightUnits = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get('/weight-units');
      setWeightUnits(data?.data || []);
    } catch (error) {
      setError(error.response?.data?.message || error.message || 'Failed to load weight units');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (weightUnit = null) => {
    if (weightUnit) {
      setEditingWeightUnit(weightUnit);
      setFormState({
        name: weightUnit.name || '',
        code: weightUnit.code || '',
        symbol: weightUnit.symbol || '',
        status: weightUnit.status || 'active',
      });
    } else {
      setEditingWeightUnit(null);
      setFormState({
        name: '',
        code: '',
        symbol: '',
        status: 'active',
      });
    }
    setShowModal(true);
    setError(null);
    setSuccess(null);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingWeightUnit(null);
    setError(null);
    setSuccess(null);
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
    setError(null);
    setSuccess(null);
    setSubmitting(true);

    try {
      if (editingWeightUnit) {
        await api.put(`/weight-units/${editingWeightUnit._id}`, formState);
        setSuccess('Weight unit updated successfully');
      } else {
        await api.post('/weight-units', formState);
        setSuccess('Weight unit created successfully');
      }
      fetchWeightUnits();
      setTimeout(() => {
        handleCloseModal();
      }, 1000);
    } catch (error) {
      setError(error.response?.data?.message || error.message || 'Failed to save weight unit');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this weight unit?')) {
      return;
    }

    try {
      await api.delete(`/weight-units/${id}`);
      setSuccess('Weight unit deleted successfully');
      fetchWeightUnits();
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      setError(error.response?.data?.message || error.message || 'Failed to delete weight unit');
      setTimeout(() => setError(null), 3000);
    }
  };

  if (loading && weightUnits.length === 0) {
    return (
      <>
        <AppNavbar />
        <Container className="py-5">
          <div className="text-center">
            <Spinner animation="border" role="status" />
            <p className="mt-2 text-muted">Loading weight units...</p>
          </div>
        </Container>
      </>
    );
  }

  return (
    <>
      <AppNavbar />
      <Container className="py-4">
        <Row className="mb-3">
          <Col>
            <h3>Manage Weight Units</h3>
          </Col>
          <Col xs="auto">
            <Button variant="primary" onClick={() => handleOpenModal()}>
              <FiPlus className="me-2" />
              Add Weight Unit
            </Button>
          </Col>
        </Row>

        {error && (
          <Alert variant="danger" dismissible onClose={() => setError(null)} className="mb-3">
            {error}
          </Alert>
        )}

        {success && (
          <Alert variant="success" dismissible onClose={() => setSuccess(null)} className="mb-3">
            {success}
          </Alert>
        )}

        <Card>
          <Card.Body>
            {weightUnits.length === 0 ? (
              <div className="text-center py-5">
                <p className="text-muted">No weight units found. Add your first weight unit to get started.</p>
              </div>
            ) : (
              <Table striped bordered hover responsive>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Code</th>
                    <th>Symbol</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {weightUnits.map((weightUnit) => (
                    <tr key={weightUnit._id}>
                      <td>{weightUnit.name}</td>
                      <td>
                        <Badge bg="secondary">{weightUnit.code}</Badge>
                      </td>
                      <td>{weightUnit.symbol || '-'}</td>
                      <td>
                        <Badge bg={weightUnit.status === 'active' ? 'success' : 'secondary'}>
                          {weightUnit.status}
                        </Badge>
                      </td>
                      <td>
                        <div className="d-flex gap-2">
                          <Button
                            variant="outline-primary"
                            size="sm"
                            onClick={() => handleOpenModal(weightUnit)}
                          >
                            <FiEdit2 />
                          </Button>
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => handleDelete(weightUnit._id)}
                          >
                            <FiTrash2 />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </Card.Body>
        </Card>

        {/* Add/Edit Modal */}
        <Modal show={showModal} onHide={handleCloseModal} size="lg">
          <Modal.Header closeButton>
            <Modal.Title>{editingWeightUnit ? 'Edit Weight Unit' : 'Add New Weight Unit'}</Modal.Title>
          </Modal.Header>
          <Form onSubmit={handleSubmit}>
            <Modal.Body>
              {error && (
                <Alert variant="danger" className="mb-3">
                  {error}
                </Alert>
              )}

              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Name *</Form.Label>
                    <Form.Control
                      type="text"
                      name="name"
                      value={formState.name}
                      onChange={handleChange}
                      placeholder="e.g., Kilogram"
                      required
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Code *</Form.Label>
                    <Form.Control
                      type="text"
                      name="code"
                      value={formState.code}
                      onChange={handleChange}
                      placeholder="e.g., KG"
                      maxLength={10}
                      required
                      style={{ textTransform: 'uppercase' }}
                    />
                    <Form.Text className="text-muted">2-10 character code (e.g., KG, G, LB, OZ)</Form.Text>
                  </Form.Group>
                </Col>
              </Row>

              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Symbol</Form.Label>
                    <Form.Control
                      type="text"
                      name="symbol"
                      value={formState.symbol}
                      onChange={handleChange}
                      placeholder="e.g., kg"
                    />
                    <Form.Text className="text-muted">Optional symbol for display</Form.Text>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Status *</Form.Label>
                    <Form.Select name="status" value={formState.status} onChange={handleChange} required>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={handleCloseModal} disabled={submitting}>
                <FiX className="me-1" />
                Cancel
              </Button>
              <Button variant="primary" type="submit" disabled={submitting}>
                {submitting ? (
                  <>
                    <Spinner size="sm" className="me-2" />
                    Saving...
                  </>
                ) : (
                  <>
                    <FiPlus className="me-1" />
                    {editingWeightUnit ? 'Update' : 'Add'} Weight Unit
                  </>
                )}
              </Button>
            </Modal.Footer>
          </Form>
        </Modal>
      </Container>
    </>
  );
};

const WeightUnitsPageWithProtection = () => (
  <ProtectedRoute roles={['admin', 'superadmin']}>
    <WeightUnitsPage />
  </ProtectedRoute>
);

export default WeightUnitsPageWithProtection;

