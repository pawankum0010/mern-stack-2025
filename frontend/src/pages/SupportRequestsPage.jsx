import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Badge,
  Button,
  Card,
  Container,
  Form,
  Row,
  Col,
  Spinner,
  Table,
  Alert,
  Modal,
} from 'react-bootstrap';
import { FiRefreshCw, FiFilter, FiX, FiCheckCircle, FiTrash2, FiEye, FiMail } from 'react-icons/fi';

import AppNavbar from '../components/AppNavbar';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';

const SupportRequestsPage = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [updateStatus, setUpdateStatus] = useState('pending');
  const [adminNotes, setAdminNotes] = useState('');
  const [updating, setUpdating] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    search: '',
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
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
    fetchRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, isAdmin, pagination.page, filters.status]);

  const fetchRequests = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
      };

      if (filters.status) params.status = filters.status;
      if (filters.search) params.search = filters.search;

      const { data } = await api.get('/site-settings/support-requests', { params });
      setRequests(data?.data || []);
      setPagination(data?.pagination || pagination);
    } catch (error) {
      setError(error.response?.data?.message || error.message || 'Failed to load support requests');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (name, value) => {
    setFilters((prev) => ({ ...prev, [name]: value }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleClearFilters = () => {
    setFilters({
      status: '',
      search: '',
    });
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleViewDetails = (request) => {
    setSelectedRequest(request);
    setShowDetailsModal(true);
  };

  const handleUpdateStatus = (request) => {
    setSelectedRequest(request);
    setUpdateStatus(request.status);
    setAdminNotes(request.adminNotes || '');
    setShowUpdateModal(true);
  };

  const handleSubmitUpdate = async (e) => {
    e.preventDefault();
    setUpdating(true);
    setError(null);
    setSuccess(null);

    try {
      await api.put(`/site-settings/support-requests/${selectedRequest._id}`, {
        status: updateStatus,
        adminNotes: adminNotes,
      });
      setSuccess('Support request updated successfully');
      setShowUpdateModal(false);
      fetchRequests();
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      setError(error.response?.data?.message || error.message || 'Failed to update support request');
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this support request?')) {
      return;
    }

    try {
      await api.delete(`/site-settings/support-requests/${id}`);
      setSuccess('Support request deleted successfully');
      fetchRequests();
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      setError(error.response?.data?.message || error.message || 'Failed to delete support request');
      setTimeout(() => setError(null), 3000);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { variant: 'warning', text: 'Pending' },
      in_progress: { variant: 'info', text: 'In Progress' },
      resolved: { variant: 'success', text: 'Resolved' },
      closed: { variant: 'secondary', text: 'Closed' },
    };
    const badge = badges[status] || { variant: 'secondary', text: status };
    return <Badge bg={badge.variant}>{badge.text}</Badge>;
  };

  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading && requests.length === 0) {
    return (
      <>
        <AppNavbar />
        <Container className="py-5">
          <div className="text-center">
            <Spinner animation="border" role="status" />
            <p className="mt-2 text-muted">Loading support requests...</p>
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
            <h3>Support Requests</h3>
            <p className="text-muted">Manage customer support requests and inquiries</p>
          </Col>
          <Col xs="auto">
            <Button variant="outline-primary" onClick={fetchRequests} disabled={loading}>
              <FiRefreshCw className={loading ? 'spinning' : ''} /> Refresh
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

        <Card className="mb-3">
          <Card.Header>
            <div className="d-flex align-items-center justify-content-between">
              <span>
                <FiFilter className="me-2" />
                Filters
              </span>
              <Button variant="link" size="sm" onClick={handleClearFilters}>
                Clear Filters
              </Button>
            </div>
          </Card.Header>
          <Card.Body>
            <Row>
              <Col md={4}>
                <Form.Group>
                  <Form.Label>Status</Form.Label>
                  <Form.Select
                    value={filters.status}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                  >
                    <option value="">All Statuses</option>
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={8}>
                <Form.Group>
                  <Form.Label>Search</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Search by name, email, subject, or message..."
                    value={filters.search}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                  />
                </Form.Group>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        <Card>
          <Card.Body>
            {requests.length === 0 ? (
              <div className="text-center py-5">
                <p className="text-muted">No support requests found.</p>
              </div>
            ) : (
              <>
                <Table striped bordered hover responsive>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Subject</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {requests.map((request) => (
                      <tr key={request._id}>
                        <td>{formatDate(request.createdAt)}</td>
                        <td>{request.name}</td>
                        <td>
                          <a href={`mailto:${request.email}`}>
                            <FiMail className="me-1" />
                            {request.email}
                          </a>
                        </td>
                        <td>{request.subject || 'No Subject'}</td>
                        <td>{getStatusBadge(request.status)}</td>
                        <td>
                          <div className="d-flex gap-2">
                            <Button
                              variant="outline-primary"
                              size="sm"
                              onClick={() => handleViewDetails(request)}
                            >
                              <FiEye />
                            </Button>
                            <Button
                              variant="outline-success"
                              size="sm"
                              onClick={() => handleUpdateStatus(request)}
                            >
                              <FiCheckCircle />
                            </Button>
                            <Button
                              variant="outline-danger"
                              size="sm"
                              onClick={() => handleDelete(request._id)}
                            >
                              <FiTrash2 />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>

                {pagination.pages > 1 && (
                  <div className="d-flex justify-content-between align-items-center mt-3">
                    <div>
                      Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                      {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                      {pagination.total} requests
                    </div>
                    <div>
                      <Button
                        variant="outline-primary"
                        size="sm"
                        disabled={pagination.page === 1}
                        onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
                      >
                        Previous
                      </Button>
                      <span className="mx-2">
                        Page {pagination.page} of {pagination.pages}
                      </span>
                      <Button
                        variant="outline-primary"
                        size="sm"
                        disabled={pagination.page === pagination.pages}
                        onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </Card.Body>
        </Card>

        {/* Details Modal */}
        <Modal show={showDetailsModal} onHide={() => setShowDetailsModal(false)} size="lg">
          <Modal.Header closeButton>
            <Modal.Title>Support Request Details</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {selectedRequest && (
              <>
                <Row className="mb-3">
                  <Col md={6}>
                    <strong>Name:</strong>
                    <p>{selectedRequest.name}</p>
                  </Col>
                  <Col md={6}>
                    <strong>Email:</strong>
                    <p>
                      <a href={`mailto:${selectedRequest.email}`}>
                        <FiMail className="me-1" />
                        {selectedRequest.email}
                      </a>
                    </p>
                  </Col>
                </Row>
                <Row className="mb-3">
                  <Col md={6}>
                    <strong>Subject:</strong>
                    <p>{selectedRequest.subject || 'No Subject'}</p>
                  </Col>
                  <Col md={6}>
                    <strong>Status:</strong>
                    <p>{getStatusBadge(selectedRequest.status)}</p>
                  </Col>
                </Row>
                <Row className="mb-3">
                  <Col md={6}>
                    <strong>Submitted:</strong>
                    <p>{formatDate(selectedRequest.createdAt)}</p>
                  </Col>
                  {selectedRequest.resolvedAt && (
                    <Col md={6}>
                      <strong>Resolved:</strong>
                      <p>{formatDate(selectedRequest.resolvedAt)}</p>
                    </Col>
                  )}
                </Row>
                {selectedRequest.resolvedBy && (
                  <Row className="mb-3">
                    <Col>
                      <strong>Resolved By:</strong>
                      <p>
                        {selectedRequest.resolvedBy?.name || 'Unknown'} (
                        {selectedRequest.resolvedBy?.email || 'N/A'})
                      </p>
                    </Col>
                  </Row>
                )}
                <Row className="mb-3">
                  <Col>
                    <strong>Message:</strong>
                    <div className="border p-3 rounded bg-light" style={{ whiteSpace: 'pre-wrap' }}>
                      {selectedRequest.message}
                    </div>
                  </Col>
                </Row>
                {selectedRequest.adminNotes && (
                  <Row className="mb-3">
                    <Col>
                      <strong>Admin Notes:</strong>
                      <div className="border p-3 rounded bg-light" style={{ whiteSpace: 'pre-wrap' }}>
                        {selectedRequest.adminNotes}
                      </div>
                    </Col>
                  </Row>
                )}
              </>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowDetailsModal(false)}>
              Close
            </Button>
            {selectedRequest && (
              <Button variant="primary" onClick={() => {
                setShowDetailsModal(false);
                handleUpdateStatus(selectedRequest);
              }}>
                Update Status
              </Button>
            )}
          </Modal.Footer>
        </Modal>

        {/* Update Status Modal */}
        <Modal show={showUpdateModal} onHide={() => setShowUpdateModal(false)}>
          <Modal.Header closeButton>
            <Modal.Title>Update Support Request</Modal.Title>
          </Modal.Header>
          <Form onSubmit={handleSubmitUpdate}>
            <Modal.Body>
              {selectedRequest && (
                <>
                  <Form.Group className="mb-3">
                    <Form.Label>Status *</Form.Label>
                    <Form.Select
                      value={updateStatus}
                      onChange={(e) => setUpdateStatus(e.target.value)}
                      required
                    >
                      <option value="pending">Pending</option>
                      <option value="in_progress">In Progress</option>
                      <option value="resolved">Resolved</option>
                      <option value="closed">Closed</option>
                    </Form.Select>
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>Admin Notes</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={4}
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      placeholder="Add internal notes about this support request..."
                    />
                  </Form.Group>
                </>
              )}
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={() => setShowUpdateModal(false)} disabled={updating}>
                <FiX className="me-1" />
                Cancel
              </Button>
              <Button variant="primary" type="submit" disabled={updating}>
                {updating ? (
                  <>
                    <Spinner size="sm" className="me-2" />
                    Updating...
                  </>
                ) : (
                  <>
                    <FiCheckCircle className="me-1" />
                    Update
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

export default SupportRequestsPage;

