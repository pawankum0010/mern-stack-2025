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
import { FiEdit2, FiTrash2, FiPlus, FiX, FiBell } from 'react-icons/fi';

import AppNavbar from '../components/AppNavbar';
import ProtectedRoute from '../components/ProtectedRoute';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';

const PincodesPage = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [pincodes, setPincodes] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);
  const [editingPincode, setEditingPincode] = useState(null);
  const [formState, setFormState] = useState({
    pincode: '',
    shippingCharge: '',
    status: 'active',
    description: '',
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
    fetchPincodes();
    fetchNotifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, isAdmin]);

  const fetchPincodes = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get('/pincodes');
      setPincodes(data?.data || []);
    } catch (error) {
      setError(error.response?.data?.message || error.message || 'Failed to load pincodes');
    } finally {
      setLoading(false);
    }
  };

  const fetchNotifications = async () => {
    setLoadingNotifications(true);
    try {
      const { data } = await api.get('/pincodes/notifications');
      setNotifications(data?.data || []);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setLoadingNotifications(false);
    }
  };

  const handleOpenModal = (pincode = null) => {
    if (pincode) {
      setEditingPincode(pincode);
      setFormState({
        pincode: pincode.pincode || '',
        shippingCharge: pincode.shippingCharge || '',
        status: pincode.status || 'active',
        description: pincode.description || '',
      });
    } else {
      setEditingPincode(null);
      setFormState({
        pincode: '',
        shippingCharge: '',
        status: 'active',
        description: '',
      });
    }
    setShowModal(true);
    setError(null);
    setSuccess(null);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingPincode(null);
    setError(null);
    setSuccess(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormState((prev) => ({
      ...prev,
      [name]: name === 'pincode' ? value.replace(/\D/g, '').slice(0, 6) : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const payload = {
        pincode: formState.pincode,
        shippingCharge: parseFloat(formState.shippingCharge),
        status: formState.status,
        description: formState.description || undefined,
      };

      if (editingPincode) {
        await api.put(`/pincodes/${editingPincode._id}`, payload);
        setSuccess('Pincode updated successfully');
      } else {
        await api.post('/pincodes', payload);
        setSuccess('Pincode created successfully');
      }

      await fetchPincodes();
      await fetchNotifications();
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
    if (!window.confirm('Are you sure you want to delete this pincode?')) {
      return;
    }

    try {
      await api.delete(`/pincodes/${id}`);
      setSuccess('Pincode deleted successfully');
      await fetchPincodes();
    } catch (error) {
      setError(error.response?.data?.message || error.message || 'Failed to delete pincode');
    }
  };

  const pendingNotificationsCount = notifications.filter((n) => n.status === 'pending').length;

  return (
    <>
      <AppNavbar />
      <Container fluid className="py-4">
        <Row className="mb-3">
          <Col>
            <h2>Pincode Management</h2>
            <p className="text-muted">Manage shipping charges by pincode</p>
          </Col>
          <Col xs="auto" className="d-flex gap-2">
            {pendingNotificationsCount > 0 && (
              <Button
                variant="warning"
                onClick={() => setShowNotificationsModal(true)}
                className="d-flex align-items-center gap-2"
              >
                <FiBell />
                Pending Notifications ({pendingNotificationsCount})
              </Button>
            )}
            <Button variant="primary" onClick={() => handleOpenModal()}>
              <FiPlus /> Add Pincode
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
          <Card.Body>
            {loading ? (
              <div className="text-center py-4">
                <Spinner animation="border" role="status" />
                <p className="mt-2 text-muted">Loading pincodes...</p>
              </div>
            ) : pincodes.length === 0 ? (
              <div className="text-center py-4 text-muted">No pincodes found. Add your first pincode!</div>
            ) : (
              <div className="table-responsive">
                <Table striped bordered hover>
                  <thead>
                    <tr>
                      <th>Pincode</th>
                      <th>Shipping Charge</th>
                      <th>Status</th>
                      <th>Description</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pincodes.map((pincode) => (
                      <tr key={pincode._id}>
                        <td>{pincode.pincode}</td>
                        <td>${pincode.shippingCharge.toFixed(2)}</td>
                        <td>
                          <Badge bg={pincode.status === 'active' ? 'success' : 'secondary'}>
                            {pincode.status}
                          </Badge>
                        </td>
                        <td>{pincode.description || '-'}</td>
                        <td>
                          <div className="d-flex gap-2">
                            <Button
                              size="sm"
                              variant="outline-primary"
                              onClick={() => handleOpenModal(pincode)}
                              title="Edit"
                            >
                              <FiEdit2 />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline-danger"
                              onClick={() => handleDelete(pincode._id)}
                              title="Delete"
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
            )}
          </Card.Body>
        </Card>
      </Container>

      {/* Add/Edit Modal */}
      <Modal show={showModal} onHide={handleCloseModal} centered>
        <Modal.Header closeButton>
          <Modal.Title>{editingPincode ? 'Edit Pincode' : 'Add Pincode'}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            {error && <Alert variant="danger">{error}</Alert>}
            {success && <Alert variant="success">{success}</Alert>}

            <Form.Group className="mb-3">
              <Form.Label>Pincode *</Form.Label>
              <Form.Control
                type="text"
                name="pincode"
                value={formState.pincode}
                onChange={handleChange}
                placeholder="123456"
                maxLength={6}
                required
                pattern="[0-9]{6}"
                disabled={!!editingPincode}
              />
              <Form.Text className="text-muted">6 digits only</Form.Text>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Shipping Charge ($) *</Form.Label>
              <Form.Control
                type="number"
                name="shippingCharge"
                value={formState.shippingCharge}
                onChange={handleChange}
                placeholder="0.00"
                step="0.01"
                min="0"
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Status</Form.Label>
              <Form.Select name="status" value={formState.status} onChange={handleChange}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                type="text"
                name="description"
                value={formState.description}
                onChange={handleChange}
                placeholder="Optional description"
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseModal} disabled={submitting}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={submitting}>
              {submitting ? 'Saving...' : editingPincode ? 'Update' : 'Create'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Notifications Modal */}
      <Modal show={showNotificationsModal} onHide={() => setShowNotificationsModal(false)} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>Pending Pincode Notifications</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {loadingNotifications ? (
            <div className="text-center py-4">
              <Spinner animation="border" role="status" />
            </div>
          ) : notifications.filter((n) => n.status === 'pending').length === 0 ? (
            <div className="text-center py-4 text-muted">No pending notifications</div>
          ) : (
            <div className="table-responsive">
              <Table striped bordered hover size="sm">
                <thead>
                  <tr>
                    <th>Pincode</th>
                    <th>User Email</th>
                    <th>Requested At</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {notifications
                    .filter((n) => n.status === 'pending')
                    .map((notification) => (
                      <tr key={notification._id}>
                        <td>
                          <strong>{notification.pincode}</strong>
                        </td>
                        <td>{notification.userEmail || notification.userId?.email || '-'}</td>
                        <td>{new Date(notification.createdAt).toLocaleString()}</td>
                        <td>
                          <Button
                            size="sm"
                            variant="primary"
                            onClick={() => {
                              handleOpenModal();
                              setFormState((prev) => ({ ...prev, pincode: notification.pincode }));
                              setShowNotificationsModal(false);
                            }}
                          >
                            Add Pincode
                          </Button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </Table>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowNotificationsModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

const PincodesPageWithProtection = () => (
  <ProtectedRoute roles={['admin', 'superadmin']}>
    <PincodesPage />
  </ProtectedRoute>
);

export default PincodesPageWithProtection;

