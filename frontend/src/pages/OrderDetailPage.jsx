import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Alert,
  Badge,
  Button,
  Card,
  Col,
  Container,
  Form,
  Row,
  Spinner,
  Table,
} from 'react-bootstrap';
import { FiFileText } from 'react-icons/fi';

import AppNavbar from '../components/AppNavbar';
import ProtectedRoute from '../components/ProtectedRoute';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';

const OrderDetailPage = () => {
  const { id } = useParams();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [activityLogs, setActivityLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState('');

  const isAdmin = user?.role?.name?.toLowerCase() === 'admin' || user?.role?.name?.toLowerCase() === 'superadmin';

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    fetchOrder();
  }, [id, isAuthenticated, navigate]);

  const fetchOrder = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get(`/orders/${id}`);
      setOrder(data?.data);
      setStatus(data?.data?.status || '');
      fetchActivityLogs();
    } catch (error) {
      setError(error.message || 'Failed to load order');
    } finally {
      setLoading(false);
    }
  };

  const fetchActivityLogs = async () => {
    setLoadingLogs(true);
    try {
      const { data } = await api.get(`/orders/${id}/activity-logs`);
      setActivityLogs(data?.data || []);
    } catch (error) {
      console.error('Failed to load activity logs:', error);
    } finally {
      setLoadingLogs(false);
    }
  };

  const handleStatusUpdate = async (e) => {
    e.preventDefault();
    setUpdating(true);
    try {
      await api.put(`/orders/${id}/status`, { status });
      await fetchOrder();
      await fetchActivityLogs();
    } catch (error) {
      setError(error.message || 'Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  const handleViewInvoice = async () => {
    try {
      const response = await api.get(`/invoices/${id}/html`, {
        responseType: 'text',
      });
      const newWindow = window.open();
      if (newWindow) {
        newWindow.document.write(response.data);
        newWindow.document.close();
      }
    } catch (error) {
      setError(error.response?.data?.message || error.message || 'Failed to load invoice');
    }
  };

  const handleDownloadInvoice = async () => {
    try {
      const response = await api.get(`/invoices/${id}/download`, {
        responseType: 'blob',
      });
      
      // Check if response is PDF or HTML based on content type
      const contentType = response.headers['content-type'] || response.headers['Content-Type'] || '';
      const isPDF = contentType.includes('application/pdf');
      const extension = isPDF ? 'pdf' : 'html';
      
      const blob = new Blob([response.data], { type: contentType || (isPDF ? 'application/pdf' : 'text/html') });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `invoice-${order?.orderNumber || id}.${extension}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      setError(error.response?.data?.message || error.message || 'Failed to download invoice');
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      pending: 'warning',
      approved: 'success',
      processing: 'info',
      shipped: 'primary',
      delivered: 'success',
      cancelled: 'danger',
    };
    return <Badge bg={variants[status] || 'secondary'}>{status.toUpperCase()}</Badge>;
  };

  if (loading) {
    return (
      <>
        <AppNavbar />
        <Container className="py-5">
          <div className="text-center">
            <Spinner animation="border" role="status" />
            <p className="mt-2 text-muted">Loading order...</p>
          </div>
        </Container>
      </>
    );
  }

  if (!order) {
    return (
      <>
        <AppNavbar />
        <Container className="py-5">
          <Alert variant="danger">Order not found</Alert>
        </Container>
      </>
    );
  }

  return (
    <>
      <AppNavbar />
      <Container className="py-4">
        {error && (
          <Alert variant="danger" dismissible onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
        <Row className="g-4">
          <Col xs={12}>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h4>Order #{order.orderNumber}</h4>
              <div className="d-flex gap-2">
                {order.status !== 'pending' && order.status !== 'cancelled' && (
                  <>
                    <Button
                      variant="outline-success"
                      onClick={handleViewInvoice}
                    >
                      <FiFileText className="me-2" />
                      View Invoice
                    </Button>
                    <Button
                      variant="outline-primary"
                      onClick={handleDownloadInvoice}
                    >
                      <FiFileText className="me-2" />
                      Download Invoice
                    </Button>
                  </>
                )}
                <Button variant="outline-secondary" onClick={() => navigate('/orders')}>
                  Back to Orders
                </Button>
              </div>
            </div>
          </Col>
          <Col xs={12} lg={8}>
            <Card className="mb-3">
              <Card.Header>
                <Card.Title className="mb-0">Order Items</Card.Title>
              </Card.Header>
              <Card.Body>
                <Table>
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Quantity</th>
                      <th>Price</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.items?.map((item, idx) => (
                      <tr key={idx}>
                        <td>{item.name}</td>
                        <td>{item.quantity}</td>
                        <td>${item.price?.toFixed(2) || '0.00'}</td>
                        <td>${item.total?.toFixed(2) || '0.00'}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
                <div className="mt-3">
                  <div className="d-flex justify-content-between">
                    <span>Subtotal:</span>
                    <span>${order.subtotal?.toFixed(2) || '0.00'}</span>
                  </div>
                  {order.tax > 0 && (
                    <div className="d-flex justify-content-between">
                      <span>Tax:</span>
                      <span>${order.tax?.toFixed(2) || '0.00'}</span>
                    </div>
                  )}
                  {order.shipping > 0 && (
                    <div className="d-flex justify-content-between">
                      <span>Shipping:</span>
                      <span>${order.shipping?.toFixed(2) || '0.00'}</span>
                    </div>
                  )}
                  <div className="d-flex justify-content-between mt-2 pt-2 border-top">
                    <strong>Total:</strong>
                    <strong className="h5">${order.total?.toFixed(2) || '0.00'}</strong>
                  </div>
                </div>
              </Card.Body>
            </Card>
            <Card>
              <Card.Header>
                <Card.Title className="mb-0">Shipping Address</Card.Title>
              </Card.Header>
              <Card.Body>
                {order.shippingAddress && (
                  <div>
                    <p>{order.shippingAddress.line1}</p>
                    {order.shippingAddress.line2 && <p>{order.shippingAddress.line2}</p>}
                    <p>
                      {order.shippingAddress.city}, {order.shippingAddress.state}{' '}
                      {order.shippingAddress.postalCode}
                    </p>
                    <p>{order.shippingAddress.country}</p>
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>
          <Col xs={12} lg={4}>
            <Card>
              <Card.Header>
                <Card.Title className="mb-0">Order Information</Card.Title>
              </Card.Header>
              <Card.Body>
                <div className="mb-3">
                  <strong>Status:</strong>
                  <div className="mt-1">{getStatusBadge(order.status)}</div>
                </div>
                <div className="mb-3">
                  <strong>Payment Method:</strong>
                  <div className="mt-1">{order.paymentMethod?.toUpperCase() || 'N/A'}</div>
                </div>
                <div className="mb-3">
                  <strong>Order Date:</strong>
                  <div className="mt-1">
                    {new Date(order.createdAt).toLocaleString()}
                  </div>
                </div>
                {order.approvedAt && (
                  <div className="mb-3">
                    <strong>Approved At:</strong>
                    <div className="mt-1">
                      {new Date(order.approvedAt).toLocaleString()}
                    </div>
                  </div>
                )}
                {order.approvedBy && (
                  <div className="mb-3">
                    <strong>Approved By:</strong>
                    <div className="mt-1">
                      {order.approvedBy?.name || order.approvedBy?.email || 'N/A'}
                    </div>
                  </div>
                )}
                {order.notes && (
                  <div className="mb-3">
                    <strong>Notes:</strong>
                    <div className="mt-1">{order.notes}</div>
                  </div>
                )}
                {isAdmin && (
                  <Card className="mt-3">
                    <Card.Header>
                      <Card.Title className="mb-0" style={{ fontSize: '1rem' }}>
                        Update Status
                      </Card.Title>
                    </Card.Header>
                    <Card.Body>
                      <Form onSubmit={handleStatusUpdate}>
                        <Form.Select
                          value={status}
                          onChange={(e) => setStatus(e.target.value)}
                          className="mb-3"
                        >
                          <option value="pending">Pending</option>
                          <option value="approved">Approved</option>
                          <option value="processing">Processing</option>
                          <option value="shipped">Shipped</option>
                          <option value="delivered">Delivered</option>
                          <option value="cancelled">Cancelled</option>
                        </Form.Select>
                        <Button
                          type="submit"
                          variant="primary"
                          size="sm"
                          className="w-100"
                          disabled={updating || status === order.status}
                        >
                          {updating ? 'Updating...' : 'Update Status'}
                        </Button>
                      </Form>
                    </Card.Body>
                  </Card>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
        <Row className="g-4 mt-2">
          <Col xs={12}>
            <Card>
              <Card.Header>
                <Card.Title className="mb-0">Order Activity Log</Card.Title>
              </Card.Header>
              <Card.Body>
                {loadingLogs ? (
                  <div className="text-center py-3">
                    <Spinner animation="border" size="sm" />
                    <p className="mt-2 text-muted small">Loading activity logs...</p>
                  </div>
                ) : activityLogs.length === 0 ? (
                  <p className="text-muted text-center py-3">No activity logs found.</p>
                ) : (
                  <div className="timeline">
                    {activityLogs.map((log, idx) => (
                      <div key={log._id} className="d-flex mb-3 pb-3 border-bottom">
                        <div className="flex-shrink-0 me-3">
                          <div
                            className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center"
                            style={{ width: '40px', height: '40px', fontSize: '0.875rem' }}
                          >
                            {idx + 1}
                          </div>
                        </div>
                        <div className="flex-grow-1">
                          <div className="d-flex justify-content-between align-items-start">
                            <div>
                              <h6 className="mb-1 text-capitalize">{log.action.replace('_', ' ')}</h6>
                              {log.fromStatus && log.toStatus && (
                                <p className="mb-1 small text-muted">
                                  Status changed: <Badge bg="secondary">{log.fromStatus}</Badge>{' '}
                                  → <Badge bg="success">{log.toStatus}</Badge>
                                </p>
                              )}
                              {log.notes && <p className="mb-1 small">{log.notes}</p>}
                              <p className="mb-0 small text-muted">
                                By: <strong>{log.performedByName || log.performedBy?.name || 'System'}</strong>
                              </p>
                            </div>
                            <small className="text-muted">
                              {new Date(log.createdAt).toLocaleString()}
                            </small>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </>
  );
};

const OrderDetailPageWithProtection = () => (
  <ProtectedRoute>
    <OrderDetailPage />
  </ProtectedRoute>
);

export default OrderDetailPageWithProtection;

