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
import { useAuth } from '../context/AuthContext';
import api from '../api/client';

const SizesPage = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [sizes, setSizes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingSize, setEditingSize] = useState(null);
  const [formState, setFormState] = useState({
    name: '',
    code: '',
    category: 'general',
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
    fetchSizes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, isAdmin]);

  const fetchSizes = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get('/sizes');
      setSizes(data?.data || []);
    } catch (error) {
      setError(error.response?.data?.message || error.message || 'Failed to load sizes');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (size = null) => {
    if (size) {
      setEditingSize(size);
      setFormState({
        name: size.name || '',
        code: size.code || '',
        category: size.category || 'general',
        status: size.status || 'active',
      });
    } else {
      setEditingSize(null);
      setFormState({
        name: '',
        code: '',
        category: 'general',
        status: 'active',
      });
    }
    setShowModal(true);
    setError(null);
    setSuccess(null);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingSize(null);
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
      if (editingSize) {
        await api.put(`/sizes/${editingSize._id}`, formState);
        setSuccess('Size updated successfully');
      } else {
        await api.post('/sizes', formState);
        setSuccess('Size created successfully');
      }
      fetchSizes();
      setTimeout(() => {
        handleCloseModal();
      }, 1000);
    } catch (error) {
      setError(error.response?.data?.message || error.message || 'Failed to save size');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this size?')) {
      return;
    }

    try {
      await api.delete(`/sizes/${id}`);
      setSuccess('Size deleted successfully');
      fetchSizes();
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      setError(error.response?.data?.message || error.message || 'Failed to delete size');
      setTimeout(() => setError(null), 3000);
    }
  };

  if (loading && sizes.length === 0) {
    return (
      <>
        <AppNavbar />
        <Container className="py-5">
          <div className="text-center">
            <Spinner animation="border" role="status" />
            <p className="mt-2 text-muted">Loading sizes...</p>
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
            <h3>Manage Sizes</h3>
          </Col>
          <Col xs="auto">
            <Button variant="primary" onClick={() => handleOpenModal()}>
              <FiPlus className="me-2" />
              Add Size
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
            {sizes.length === 0 ? (
              <div className="text-center py-5">
                <p className="text-muted">No sizes found. Add your first size to get started.</p>
              </div>
            ) : (
              <Table striped bordered hover responsive>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Code</th>
                    <th>Category</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sizes.map((size) => (
                    <tr key={size._id}>
                      <td>{size.name}</td>
                      <td>
                        <Badge bg="secondary">{size.code}</Badge>
                      </td>
                      <td>
                        <Badge bg="info">{size.category}</Badge>
                      </td>
                      <td>
                        <Badge bg={size.status === 'active' ? 'success' : 'secondary'}>
                          {size.status}
                        </Badge>
                      </td>
                      <td>
                        <div className="d-flex gap-2">
                          <Button
                            variant="outline-primary"
                            size="sm"
                            onClick={() => handleOpenModal(size)}
                          >
                            <FiEdit2 />
                          </Button>
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => handleDelete(size._id)}
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
            <Modal.Title>{editingSize ? 'Edit Size' : 'Add New Size'}</Modal.Title>
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
                      placeholder="e.g., Small, Medium, Large"
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
                      placeholder="e.g., S, M, L"
                      maxLength={10}
                      required
                      style={{ textTransform: 'uppercase' }}
                    />
                    <Form.Text className="text-muted">2-10 character code (e.g., S, M, L, XL)</Form.Text>
                  </Form.Group>
                </Col>
              </Row>

              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Category *</Form.Label>
                    <Form.Select name="category" value={formState.category} onChange={handleChange} required>
                      <option value="general">General</option>
                      <option value="clothing">Clothing</option>
                      <option value="shoes">Shoes</option>
                      <option value="other">Other</option>
                    </Form.Select>
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
                    {editingSize ? 'Update' : 'Add'} Size
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

export default SizesPage;

