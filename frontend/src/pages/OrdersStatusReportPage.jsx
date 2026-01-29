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
  ProgressBar,
} from 'react-bootstrap';
import { FiRefreshCw, FiFilter, FiX, FiBarChart2, FiDollarSign, FiShoppingBag } from 'react-icons/fi';

import AppNavbar from '../components/AppNavbar';
import ProtectedRoute from '../components/ProtectedRoute';
import { useAuth } from '../context/AuthContext';
import { useCurrency } from '../context/CurrencyContext';
import api from '../api/client';

const OrdersStatusReportPage = () => {
  const { user, isAuthenticated } = useAuth();
  const { formatPrice } = useCurrency();
  const navigate = useNavigate();
  const [statusData, setStatusData] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expandedStatus, setExpandedStatus] = useState(null);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
  });
  const fetchingRef = useRef(false);

  const isAdmin = user?.role?.name?.toLowerCase() === 'admin' || user?.role?.name?.toLowerCase() === 'superadmin';

  const fetchReport = useCallback(async () => {
    if (fetchingRef.current) return; // Prevent duplicate calls
    fetchingRef.current = true;
    setLoading(true);
    setError(null);
    try {
      const params = {};

      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;

      const { data } = await api.get('/reports/orders-status', { params });
      setStatusData(data?.data || []);
      setSummary(data?.summary || null);
    } catch (err) {
      setError(err.response?.data?.message || 'Error fetching orders status report');
      console.error('Error fetching report:', err);
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  }, [filters]);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (!isAdmin) {
      navigate('/');
      return;
    }
    fetchReport();
  }, [isAuthenticated, isAdmin, fetchReport, navigate]);

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const clearFilters = () => {
    setFilters({
      startDate: '',
      endDate: '',
    });
  };

  const toggleStatusExpansion = (status) => {
    setExpandedStatus(expandedStatus === status ? null : status);
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
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!isAuthenticated || !isAdmin) {
    return null;
  }

  return (
    <ProtectedRoute roles={['admin', 'superadmin']}>
      <AppNavbar />
      <Container fluid className="py-4">
        <Row>
          <Col>
            <Card>
              <Card.Header className="d-flex justify-content-between align-items-center">
                <h4 className="mb-0">
                  <FiBarChart2 className="me-2" />
                  Orders Status Report
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

                {/* Summary Cards */}
                {summary && (
                  <Row className="mb-4">
                    <Col md={6}>
                      <Card className="text-center">
                        <Card.Body>
                          <FiShoppingBag className="mb-2" size={24} />
                          <h5>{summary.totalOrders}</h5>
                          <p className="text-muted mb-0">Total Orders</p>
                        </Card.Body>
                      </Card>
                    </Col>
                    <Col md={6}>
                      <Card className="text-center">
                        <Card.Body>
                          <FiDollarSign className="mb-2" size={24} />
                          <h5>{formatPrice(summary.totalAmount)}</h5>
                          <p className="text-muted mb-0">Total Amount</p>
                        </Card.Body>
                      </Card>
                    </Col>
                  </Row>
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
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Start Date</Form.Label>
                          <Form.Control
                            type="date"
                            value={filters.startDate}
                            onChange={(e) => handleFilterChange('startDate', e.target.value)}
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>End Date</Form.Label>
                          <Form.Control
                            type="date"
                            value={filters.endDate}
                            onChange={(e) => handleFilterChange('endDate', e.target.value)}
                          />
                        </Form.Group>
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>

                {/* Status Report */}
                {loading ? (
                  <div className="text-center py-5">
                    <Spinner animation="border" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </Spinner>
                  </div>
                ) : statusData.length === 0 ? (
                  <Alert variant="info">No orders found matching the filters.</Alert>
                ) : (
                  <div>
                    {/* Status Summary Cards */}
                    <Row className="mb-4">
                      {statusData.map((status) => (
                        <Col md={4} key={status.status} className="mb-3">
                          <Card
                            className={`h-100 ${expandedStatus === status.status ? 'border-primary' : ''}`}
                            style={{ cursor: 'pointer' }}
                            onClick={() => toggleStatusExpansion(status.status)}
                          >
                            <Card.Body>
                              <div className="d-flex justify-content-between align-items-center mb-2">
                                <h6 className="mb-0">{getStatusBadge(status.status)}</h6>
                                <span className="text-muted">{status.percentage}%</span>
                              </div>
                              <div className="mb-2">
                                <strong className="fs-4">{status.count}</strong>
                                <span className="text-muted ms-2">orders</span>
                              </div>
                              <div>
                                <strong>{formatPrice(status.totalAmount)}</strong>
                              </div>
                              <ProgressBar
                                now={parseFloat(status.percentage)}
                                variant={status.status === 'delivered' ? 'success' : status.status === 'cancelled' ? 'danger' : 'primary'}
                                className="mt-2"
                              />
                            </Card.Body>
                          </Card>
                        </Col>
                      ))}
                    </Row>

                    {/* Expanded Status Details */}
                    {expandedStatus && (
                      <Card className="mb-4">
                        <Card.Header>
                          <div className="d-flex justify-content-between align-items-center">
                            <h6 className="mb-0">
                              {getStatusBadge(expandedStatus)} - Order Details
                            </h6>
                            <Button
                              variant="link"
                              size="sm"
                              onClick={() => setExpandedStatus(null)}
                            >
                              <FiX /> Close
                            </Button>
                          </div>
                        </Card.Header>
                        <Card.Body>
                          {(() => {
                            const status = statusData.find(s => s.status === expandedStatus);
                            if (!status || status.orders.length === 0) {
                              return <Alert variant="info">No orders in this status.</Alert>;
                            }
                            return (
                              <Table responsive striped bordered hover size="sm">
                                <thead>
                                  <tr>
                                    <th>Order Number</th>
                                    <th>User</th>
                                    <th>Total Amount</th>
                                    <th>Items</th>
                                    <th>Created At</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {status.orders.map((order) => (
                                    <tr key={order.orderNumber}>
                                      <td>{order.orderNumber}</td>
                                      <td>{order.user?.name || order.user?.email || 'N/A'}</td>
                                      <td>
                                        <strong>{formatPrice(order.total)}</strong>
                                      </td>
                                      <td>
                                        <Badge bg="secondary">{order.itemsCount}</Badge>
                                      </td>
                                      <td>{formatDate(order.createdAt)}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </Table>
                            );
                          })()}
                        </Card.Body>
                      </Card>
                    )}
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </ProtectedRoute>
  );
};

export default OrdersStatusReportPage;

