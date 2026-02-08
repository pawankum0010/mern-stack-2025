import { useEffect, useState } from 'react';
import { Card, Col, Row, Spinner, Table, Badge, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import {
  FiDollarSign,
  FiShoppingCart,
  FiUsers,
  FiPackage,
  FiClock,
  FiTrendingUp,
} from 'react-icons/fi';

import { useCurrency } from '../context/CurrencyContext';
import api from '../api/client';
import './AdminDashboardPage.css';

const statusVariant = (status) => {
  const map = {
    pending: 'warning',
    approved: 'info',
    processing: 'primary',
    shipped: 'info',
    delivered: 'success',
    cancelled: 'danger',
  };
  return map[status] || 'secondary';
};

const AdminDashboardPage = () => {
  const { formatPrice } = useCurrency();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data } = await api.get('/dashboard');
        setStats(data?.data || null);
      } catch (err) {
        setError(err.message || 'Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="admin-page">
        <div className="admin-page-header">
          <h1 className="admin-page-title">Dashboard</h1>
        </div>
        <div className="admin-dashboard-loading">
          <Spinner animation="border" />
          <span>Loading dashboard...</span>
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="admin-page">
        <div className="admin-page-header">
          <h1 className="admin-page-title">Dashboard</h1>
        </div>
        <Card className="admin-card">
          <Card.Body>
            <p className="text-danger mb-0">{error || 'No data available.'}</p>
          </Card.Body>
        </Card>
      </div>
    );
  }

  const {
    totalOrders,
    totalRevenue,
    totalCustomers,
    totalProducts,
    pendingOrders,
    recentOrders,
  } = stats;

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h1 className="admin-page-title">Dashboard</h1>
        <p className="admin-page-subtitle">Overview of your store performance</p>
      </div>

      <Row className="admin-dashboard-cards g-3 mb-4">
        <Col xs={12} sm={6} xl={3}>
          <Card className="admin-dashboard-card admin-dashboard-card-revenue">
            <Card.Body>
              <div className="admin-dashboard-card-icon">
                <FiDollarSign size={28} />
              </div>
              <div className="admin-dashboard-card-content">
                <span className="admin-dashboard-card-label">Total Revenue</span>
                <span className="admin-dashboard-card-value">{formatPrice(totalRevenue)}</span>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col xs={12} sm={6} xl={3}>
          <Card className="admin-dashboard-card admin-dashboard-card-orders">
            <Card.Body>
              <div className="admin-dashboard-card-icon">
                <FiShoppingCart size={28} />
              </div>
              <div className="admin-dashboard-card-content">
                <span className="admin-dashboard-card-label">Total Orders</span>
                <span className="admin-dashboard-card-value">{totalOrders}</span>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col xs={12} sm={6} xl={3}>
          <Card className="admin-dashboard-card admin-dashboard-card-customers">
            <Card.Body>
              <div className="admin-dashboard-card-icon">
                <FiUsers size={28} />
              </div>
              <div className="admin-dashboard-card-content">
                <span className="admin-dashboard-card-label">Customers</span>
                <span className="admin-dashboard-card-value">{totalCustomers}</span>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col xs={12} sm={6} xl={3}>
          <Card className="admin-dashboard-card admin-dashboard-card-pending">
            <Card.Body>
              <div className="admin-dashboard-card-icon">
                <FiClock size={28} />
              </div>
              <div className="admin-dashboard-card-content">
                <span className="admin-dashboard-card-label">Pending Orders</span>
                <span className="admin-dashboard-card-value">{pendingOrders}</span>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row>
        <Col xl={8}>
          <Card className="admin-card admin-card-table">
            <Card.Header className="admin-card-header">
              <div className="admin-card-header-inner">
                <h2 className="admin-card-title">Recent Orders</h2>
                <Button
                  variant="outline-primary"
                  size="sm"
                  className="admin-card-action"
                  onClick={() => navigate('/admin/orders')}
                >
                  View All
                </Button>
              </div>
            </Card.Header>
            <Card.Body className="p-0">
              {recentOrders && recentOrders.length > 0 ? (
                <Table responsive className="admin-table mb-0">
                  <thead>
                    <tr>
                      <th>Order #</th>
                      <th>Customer</th>
                      <th>Status</th>
                      <th>Total</th>
                      <th>Date</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentOrders.map((order) => (
                      <tr key={order._id}>
                        <td>
                          <strong>{order.orderNumber}</strong>
                        </td>
                        <td>
                          {order.user?.name || order.user?.email || '—'}
                        </td>
                        <td>
                          <Badge bg={statusVariant(order.status)}>{order.status}</Badge>
                        </td>
                        <td>{formatPrice(order.total)}</td>
                        <td>
                          {order.createdAt
                            ? new Date(order.createdAt).toLocaleDateString('en-IN', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                              })
                            : '—'}
                        </td>
                        <td>
                          <Button
                            variant="link"
                            size="sm"
                            className="p-0"
                            onClick={() => navigate(`/admin/orders/${order._id}`)}
                          >
                            View
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              ) : (
                <div className="admin-card-empty">No orders yet.</div>
              )}
            </Card.Body>
          </Card>
        </Col>
        <Col xl={4}>
          <Card className="admin-card">
            <Card.Header className="admin-card-header">
              <h2 className="admin-card-title">Quick Stats</h2>
            </Card.Header>
            <Card.Body>
              <div className="admin-dashboard-quickstats">
                <div className="admin-dashboard-quickstat">
                  <FiPackage size={20} className="text-muted" />
                  <span>Products in catalog</span>
                  <strong>{totalProducts}</strong>
                </div>
                <div className="admin-dashboard-quickstat">
                  <FiTrendingUp size={20} className="text-muted" />
                  <span>Total orders (all time)</span>
                  <strong>{totalOrders}</strong>
                </div>
              </div>
              <div className="mt-3">
                <Button
                  variant="primary"
                  size="sm"
                  className="w-100"
                  onClick={() => navigate('/admin/reports/orders-status')}
                >
                  Orders Report
                </Button>
                <Button
                  variant="outline-secondary"
                  size="sm"
                  className="w-100 mt-2"
                  onClick={() => navigate('/admin/reports/highest-selling-products')}
                >
                  Top Products
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default AdminDashboardPage;
