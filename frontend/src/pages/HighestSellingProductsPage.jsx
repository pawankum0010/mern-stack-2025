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
import { FiRefreshCw, FiFilter, FiX, FiTrendingUp, FiDollarSign, FiPackage } from 'react-icons/fi';

import AppNavbar from '../components/AppNavbar';
import ProtectedRoute from '../components/ProtectedRoute';
import { useAuth } from '../context/AuthContext';
import { useCurrency } from '../context/CurrencyContext';
import api from '../api/client';

const HighestSellingProductsPage = () => {
  const { user, isAuthenticated } = useAuth();
  const { formatPrice } = useCurrency();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    limit: 20,
  });
  const fetchingRef = useRef(false);

  const isAdmin = user?.role?.name?.toLowerCase() === 'admin' || user?.role?.name?.toLowerCase() === 'superadmin';

  const fetchReport = useCallback(async () => {
    if (fetchingRef.current) return; // Prevent duplicate calls
    fetchingRef.current = true;
    setLoading(true);
    setError(null);
    try {
      const params = {
        limit: filters.limit,
      };

      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;

      const { data } = await api.get('/reports/highest-selling-products', { params });
      setProducts(data?.data || []);
      setSummary(data?.summary || null);
    } catch (err) {
      setError(err.response?.data?.message || 'Error fetching highest selling products report');
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
      limit: 20,
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
                  <FiTrendingUp className="me-2" />
                  Highest Selling Products Report
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
                    <Col md={4}>
                      <Card className="text-center">
                        <Card.Body>
                          <FiPackage className="mb-2" size={24} />
                          <h5>{summary.totalProducts}</h5>
                          <p className="text-muted mb-0">Total Products Sold</p>
                        </Card.Body>
                      </Card>
                    </Col>
                    <Col md={4}>
                      <Card className="text-center">
                        <Card.Body>
                          <FiDollarSign className="mb-2" size={24} />
                          <h5>{formatPrice(summary.totalRevenue)}</h5>
                          <p className="text-muted mb-0">Total Revenue</p>
                        </Card.Body>
                      </Card>
                    </Col>
                    <Col md={4}>
                      <Card className="text-center">
                        <Card.Body>
                          <FiPackage className="mb-2" size={24} />
                          <h5>{summary.totalQuantity}</h5>
                          <p className="text-muted mb-0">Total Quantity Sold</p>
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
                      <Col md={4}>
                        <Form.Group className="mb-3">
                          <Form.Label>Start Date</Form.Label>
                          <Form.Control
                            type="date"
                            value={filters.startDate}
                            onChange={(e) => handleFilterChange('startDate', e.target.value)}
                          />
                        </Form.Group>
                      </Col>
                      <Col md={4}>
                        <Form.Group className="mb-3">
                          <Form.Label>End Date</Form.Label>
                          <Form.Control
                            type="date"
                            value={filters.endDate}
                            onChange={(e) => handleFilterChange('endDate', e.target.value)}
                          />
                        </Form.Group>
                      </Col>
                      <Col md={4}>
                        <Form.Group className="mb-3">
                          <Form.Label>Top N Products</Form.Label>
                          <Form.Select
                            value={filters.limit}
                            onChange={(e) => handleFilterChange('limit', parseInt(e.target.value))}
                          >
                            <option value={10}>Top 10</option>
                            <option value={20}>Top 20</option>
                            <option value={50}>Top 50</option>
                            <option value={100}>Top 100</option>
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
                ) : products.length === 0 ? (
                  <Alert variant="info">No products found matching the filters.</Alert>
                ) : (
                  <Table responsive striped bordered hover>
                    <thead>
                      <tr>
                        <th>Rank</th>
                        <th>Product</th>
                        <th>SKU</th>
                        <th>Total Quantity</th>
                        <th>Total Revenue</th>
                        <th>Average Price</th>
                        <th>Order Count</th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.map((product, index) => (
                        <tr key={product.productId || index}>
                          <td>
                            <Badge bg={index < 3 ? 'success' : 'secondary'}>
                              #{index + 1}
                            </Badge>
                          </td>
                          <td>
                            <div className="d-flex align-items-center">
                              {product.productImage && (
                                <img
                                  src={product.productImage}
                                  alt={product.productName}
                                  style={{
                                    width: '40px',
                                    height: '40px',
                                    objectFit: 'cover',
                                    borderRadius: '4px',
                                    marginRight: '10px',
                                  }}
                                />
                              )}
                              <span>{product.productName}</span>
                            </div>
                          </td>
                          <td>{product.productSku}</td>
                          <td>
                            <Badge bg="info">{product.totalQuantity}</Badge>
                          </td>
                          <td>
                            <strong>{formatPrice(product.totalRevenue)}</strong>
                          </td>
                          <td>{formatPrice(product.averagePrice)}</td>
                          <td>
                            <Badge bg="primary">{product.orderCount}</Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </ProtectedRoute>
  );
};

export default HighestSellingProductsPage;

