import { useEffect, useState, useCallback, useRef } from 'react';
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
} from 'react-bootstrap';
import { FiRefreshCw, FiFilter, FiX, FiUser } from 'react-icons/fi';

import { useAuth } from '../context/AuthContext';
import api from '../api/client';

const ActiveUsersReportPage = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    userId: '',
    startDate: '',
    endDate: '',
    status: '',
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });
  const fetchingRef = useRef(false);

  const isAdmin = user?.role?.name?.toLowerCase() === 'admin' || user?.role?.name?.toLowerCase() === 'superadmin';

  const fetchAllUsers = useCallback(async () => {
    setLoadingUsers(true);
    try {
      const { data } = await api.get('/users');
      const allUsersList = data?.data || [];
      setAllUsers(allUsersList);
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setLoadingUsers(false);
    }
  }, []);

  const fetchReport = useCallback(async () => {
    if (fetchingRef.current) return; // Prevent duplicate calls
    fetchingRef.current = true;
    setLoading(true);
    setError(null);
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
      };

      if (filters.userId) params.userId = filters.userId;
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;
      if (filters.status) params.status = filters.status;

      const { data } = await api.get('/reports/active-users', { params });
      setUsers(data?.data || []);
      setPagination(prev => ({
        ...prev,
        total: data?.pagination?.total || 0,
        pages: data?.pagination?.pages || 0,
      }));
    } catch (err) {
      setError(err.response?.data?.message || 'Error fetching active users report');
      console.error('Error fetching report:', err);
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  }, [filters, pagination.page, pagination.limit]);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (!isAdmin) {
      navigate('/');
      return;
    }
    fetchAllUsers();
    fetchReport();
  }, [isAuthenticated, isAdmin, fetchAllUsers, fetchReport, navigate]);

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const clearFilters = () => {
    setFilters({
      userId: '',
      startDate: '',
      endDate: '',
      status: '',
    });
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const getStatusBadge = (status) => {
    const statusColors = {
      pending: 'warning',
      approved: 'info',
      processing: 'primary',
      shipped: 'secondary',
      delivered: 'success',
      cancelled: 'danger',
    };
    return <Badge bg={statusColors[status] || 'secondary'}>{status?.toUpperCase()}</Badge>;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  if (!isAuthenticated || !isAdmin) {
    return null;
  }

  return (
    <>
      <Container fluid className="py-4">
        <Row>
          <Col>
            <Card>
              <Card.Header className="d-flex justify-content-between align-items-center">
                <h4 className="mb-0">
                  <FiUser className="me-2" />
                  Active Users Report
                </h4>
                <Button variant="outline-primary" size="sm" onClick={fetchReport} disabled={loading}>
                  <FiRefreshCw className={loading ? 'spinning' : ''} /> Refresh
                </Button>
              </Card.Header>
              <Card.Body>
                {error && (
                  <Alert variant="danger" dismissible onClose={() => setError(null)}>
                    {error}
                  </Alert>
                )}

                {/* Filters */}
                <Card className="mb-4">
                  <Card.Header>
                    <div className="d-flex justify-content-between align-items-center">
                      <span>
                        <FiFilter className="me-2" />
                        Filters
                      </span>
                      <Button variant="link" size="sm" onClick={clearFilters}>
                        <FiX /> Clear
                      </Button>
                    </div>
                  </Card.Header>
                  <Card.Body>
                    <Row>
                      <Col md={3}>
                        <Form.Group className="mb-3">
                          <Form.Label>User</Form.Label>
                          <Form.Select
                            value={filters.userId}
                            onChange={(e) => handleFilterChange('userId', e.target.value)}
                            disabled={loadingUsers}
                          >
                            <option value="">All Users</option>
                            {allUsers.map((u) => (
                              <option key={u._id} value={u._id}>
                                {u.name || u.email} ({u.email})
                              </option>
                            ))}
                          </Form.Select>
                        </Form.Group>
                      </Col>
                      <Col md={3}>
                        <Form.Group className="mb-3">
                          <Form.Label>Start Date</Form.Label>
                          <Form.Control
                            type="date"
                            value={filters.startDate}
                            onChange={(e) => handleFilterChange('startDate', e.target.value)}
                          />
                        </Form.Group>
                      </Col>
                      <Col md={3}>
                        <Form.Group className="mb-3">
                          <Form.Label>End Date</Form.Label>
                          <Form.Control
                            type="date"
                            value={filters.endDate}
                            onChange={(e) => handleFilterChange('endDate', e.target.value)}
                          />
                        </Form.Group>
                      </Col>
                      <Col md={3}>
                        <Form.Group className="mb-3">
                          <Form.Label>Order Status</Form.Label>
                          <Form.Select
                            value={filters.status}
                            onChange={(e) => handleFilterChange('status', e.target.value)}
                          >
                            <option value="">All Statuses</option>
                            <option value="pending">Pending</option>
                            <option value="approved">Approved</option>
                            <option value="processing">Processing</option>
                            <option value="shipped">Shipped</option>
                            <option value="delivered">Delivered</option>
                            <option value="cancelled">Cancelled</option>
                          </Form.Select>
                        </Form.Group>
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>

                {/* Report Table */}
                {loading ? (
                  <div className="text-center py-5">
                    <Spinner animation="border" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </Spinner>
                  </div>
                ) : users.length === 0 ? (
                  <Alert variant="info">No users found with orders matching the filters.</Alert>
                ) : (
                  <>
                    <Table responsive striped bordered hover>
                      <thead>
                        <tr>
                          <th>User</th>
                          <th>Email</th>
                          <th>Phone</th>
                          <th>Total Orders</th>
                          <th>Total Amount</th>
                          <th>Last Order Date</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.map((userData) => (
                          <tr key={userData.user._id}>
                            <td>{userData.user.name || 'N/A'}</td>
                            <td>{userData.user.email}</td>
                            <td>{userData.user.phone || 'N/A'}</td>
                            <td>
                              <Badge bg="primary">{userData.totalOrders}</Badge>
                            </td>
                            <td>
                              <strong>{formatCurrency(userData.totalAmount)}</strong>
                            </td>
                            <td>{formatDate(userData.lastOrderDate)}</td>
                            <td>
                              <div className="d-flex flex-column gap-1">
                                {userData.orders.slice(0, 3).map((order) => (
                                  <div key={order.orderNumber} className="small">
                                    {getStatusBadge(order.status)} {order.orderNumber} - {formatCurrency(order.total)}
                                  </div>
                                ))}
                                {userData.orders.length > 3 && (
                                  <span className="text-muted small">+{userData.orders.length - 3} more</span>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>

                    {/* Pagination */}
                    {pagination.pages > 1 && (
                      <div className="d-flex justify-content-between align-items-center mt-3">
                        <div>
                          Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                          {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                          {pagination.total} users
                        </div>
                        <div>
                          <Button
                            variant="outline-primary"
                            size="sm"
                            disabled={pagination.page === 1}
                            onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
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
                            onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
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
          </Col>
        </Row>
      </Container>
    </>
  );
};

export default ActiveUsersReportPage;

