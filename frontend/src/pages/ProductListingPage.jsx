import { useEffect, useState } from 'react';
import { Badge, Button, Card, Col, Container, Form, Row, Spinner, Alert } from 'react-bootstrap';
import { useNavigate, useLocation } from 'react-router-dom';
import { FiChevronDown, FiChevronUp, FiStar } from 'react-icons/fi';

import AppNavbar from '../components/AppNavbar';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import api from '../api/client';
import './ProductListingPage.css';

const ProductListingPage = () => {
  const { isAuthenticated } = useAuth();
  const cartContext = useCart();
  const { refreshCart } = cartContext;
  const navigate = useNavigate();
  const location = useLocation();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [addingToCart, setAddingToCart] = useState(null);
  const [cartMessage, setCartMessage] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    minPrice: '',
    maxPrice: '',
    status: 'active',
    featured: '',
  });
  const [sortBy, setSortBy] = useState('relevance');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    pages: 0,
  });
  const [expandedFilters, setExpandedFilters] = useState({
    price: true,
    category: true,
    featured: true,
  });

  // Sync search from URL params
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const searchParam = params.get('search');
    if (searchParam) {
      setFilters((prev) => ({ ...prev, search: searchParam }));
    }
  }, [location.search]);

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data } = await api.get('/categories', { params: { status: 'active' } });
        setCategories(data?.data || []);
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };
    fetchCategories();
  }, []);

  // Initial fetch on mount
  useEffect(() => {
    fetchProducts(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchProducts = async (page = 1) => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: pagination.limit,
        status: 'active',
      };

      // Only include non-empty filter values
      if (filters.search && filters.search.trim()) {
        params.search = filters.search.trim();
      }
      if (filters.category && filters.category.trim()) {
        params.category = filters.category.trim();
      }
      if (filters.minPrice && filters.minPrice > 0) {
        params.minPrice = filters.minPrice;
      }
      if (filters.maxPrice && filters.maxPrice > 0) {
        params.maxPrice = filters.maxPrice;
      }
      if (filters.featured) {
        params.featured = filters.featured;
      }

      // Add sorting
      if (sortBy === 'price-low') {
        params.sortBy = 'price';
        params.sortOrder = 'asc';
      } else if (sortBy === 'price-high') {
        params.sortBy = 'price';
        params.sortOrder = 'desc';
      } else if (sortBy === 'name') {
        params.sortBy = 'name';
        params.sortOrder = 'asc';
      }

      const { data } = await api.get('/products', { params });
      setProducts(data?.data || []);
      setPagination(data?.pagination || pagination);
    } catch (error) {
      if (error.response?.status === 404) {
        setProducts([]);
        setPagination({ ...pagination, total: 0, pages: 0 });
      } else {
        console.error('Error fetching products:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  // Debounce filter changes to avoid too many API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProducts(1);
    }, 500); // Wait 500ms after user stops typing

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, sortBy]);

  const handleFilterChange = (name, value) => {
    setFilters((prev) => ({ ...prev, [name]: value }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (newPage) => {
    fetchProducts(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAddToCart = async (productId) => {
    setAddingToCart(productId);
    setCartMessage(null);
    
    try {
      if (!isAuthenticated) {
        // Guest cart - store in localStorage
        const { getGuestCart, saveGuestCart } = cartContext;
        const guestCart = getGuestCart();
        const product = products.find(p => p._id === productId);
        
        if (!product) {
          throw new Error('Product not found');
        }
        
        const existingItemIndex = guestCart.items.findIndex(
          item => item.productId === productId
        );
        
        if (existingItemIndex > -1) {
          guestCart.items[existingItemIndex].quantity += 1;
        } else {
          guestCart.items.push({
            productId,
            product: {
              _id: product._id,
              name: product.name,
              price: product.price,
              images: product.images,
            },
            quantity: 1,
            price: product.price,
          });
        }
        
        saveGuestCart(guestCart);
        setCartMessage({ type: 'success', text: 'Added to cart!' });
        refreshCart();
      } else {
        // Authenticated user - use API
        await api.post('/cart/add', { productId, quantity: 1 });
        setCartMessage({ type: 'success', text: 'Added to cart!' });
        refreshCart();
      }
      setTimeout(() => setCartMessage(null), 3000);
    } catch (error) {
      setCartMessage({ type: 'danger', text: error.message || 'Failed to add to cart' });
      setTimeout(() => setCartMessage(null), 3000);
    } finally {
      setAddingToCart(null);
    }
  };

  const toggleFilterSection = (section) => {
    setExpandedFilters((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const clearAllFilters = () => {
    setFilters({
      search: '',
      category: '',
      minPrice: '',
      maxPrice: '',
      status: 'active',
      featured: '',
    });
  };

  const getImageUrl = (image) => {
    if (!image) return '';
    if (image.startsWith('data:image/')) return image;
    if (image.startsWith('http')) return image;
    return `${api.defaults.baseURL.replace('/api', '')}${image}`;
  };

  const calculateDiscount = (price, comparePrice) => {
    if (!comparePrice || comparePrice <= price) return 0;
    return Math.round(((comparePrice - price) / comparePrice) * 100);
  };

  return (
    <>
      <AppNavbar />
      <div className="product-listing-page">
        <Container fluid className="main-content">
          <Row>
            {/* Filters Sidebar */}
            <Col xs={12} md={3} className="filters-sidebar">
              <div className="filters-card">
                <div className="filters-header">
                  <h5>Filters</h5>
                  <Button
                    variant="link"
                    size="sm"
                    className="clear-filters-btn"
                    onClick={clearAllFilters}
                  >
                    Clear all
                  </Button>
                </div>

                {/* Category Filter */}
                <div className="filter-section">
                  <div
                    className="filter-section-header"
                    onClick={() => toggleFilterSection('category')}
                  >
                    <span>Category</span>
                    {expandedFilters.category ? (
                      <FiChevronUp size={18} />
                    ) : (
                      <FiChevronDown size={18} />
                    )}
                  </div>
                  {expandedFilters.category && (
                    <div className="filter-section-content">
                      <Form.Select
                        value={filters.category}
                        onChange={(e) => handleFilterChange('category', e.target.value)}
                        className="filter-select"
                      >
                        <option value="">All Categories</option>
                        {categories.map((cat) => (
                          <option key={cat._id} value={cat.name}>
                            {cat.name}
                          </option>
                        ))}
                      </Form.Select>
                    </div>
                  )}
                </div>

                {/* Price Filter */}
                <div className="filter-section">
                  <div
                    className="filter-section-header"
                    onClick={() => toggleFilterSection('price')}
                  >
                    <span>Price</span>
                    {expandedFilters.price ? (
                      <FiChevronUp size={18} />
                    ) : (
                      <FiChevronDown size={18} />
                    )}
                  </div>
                  {expandedFilters.price && (
                    <div className="filter-section-content">
                      <div className="price-inputs">
                        <Form.Group>
                          <Form.Label>Min Price</Form.Label>
                          <Form.Control
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="0.00"
                            value={filters.minPrice}
                            onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                          />
                        </Form.Group>
                        <Form.Group>
                          <Form.Label>Max Price</Form.Label>
                          <Form.Control
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="0.00"
                            value={filters.maxPrice}
                            onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                          />
                        </Form.Group>
                      </div>
                    </div>
                  )}
                </div>

                {/* Featured Filter */}
                <div className="filter-section">
                  <div
                    className="filter-section-header"
                    onClick={() => toggleFilterSection('featured')}
                  >
                    <span>Featured</span>
                    {expandedFilters.featured ? (
                      <FiChevronUp size={18} />
                    ) : (
                      <FiChevronDown size={18} />
                    )}
                  </div>
                  {expandedFilters.featured && (
                    <div className="filter-section-content">
                      <Form.Select
                        value={filters.featured}
                        onChange={(e) => handleFilterChange('featured', e.target.value)}
                        className="filter-select"
                      >
                        <option value="">All Products</option>
                        <option value="true">Featured Only</option>
                      </Form.Select>
                    </div>
                  )}
                </div>
              </div>
            </Col>

            {/* Products Grid */}
            <Col xs={12} md={9} className="products-section">
              {cartMessage && (
                <Alert
                  variant={cartMessage.type}
                  dismissible
                  onClose={() => setCartMessage(null)}
                  className="mb-3"
                >
                  {cartMessage.text}
                </Alert>
              )}

              {/* Results Header */}
              <div className="results-header">
                <div className="results-count">
                  {loading ? (
                    <span>Loading...</span>
                  ) : (
                    <span>
                      {pagination.total > 0
                        ? `${pagination.total} ${pagination.total === 1 ? 'result' : 'results'}`
                        : 'No results found'}
                    </span>
                  )}
                </div>
                <div className="sort-options">
                  <Form.Select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="sort-select"
                    size="sm"
                  >
                    <option value="relevance">Sort by: Relevance</option>
                    <option value="price-low">Price: Low to High</option>
                    <option value="price-high">Price: High to Low</option>
                    <option value="name">Name: A to Z</option>
                  </Form.Select>
                </div>
              </div>

              {loading ? (
                <div className="loading-container">
                  <Spinner animation="border" role="status" />
                  <p className="mt-3 text-muted">Loading products...</p>
                </div>
              ) : products.length === 0 ? (
                <div className="no-products">
                  <div className="no-products-content">
                    <p className="text-muted">No products found matching your criteria.</p>
                    <Button variant="outline-primary" onClick={clearAllFilters}>
                      Clear Filters
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <Row className="products-grid">
                    {products.map((product) => {
                      const discount = calculateDiscount(
                        product.price,
                        product.compareAtPrice
                      );
                      return (
                        <Col key={product._id} xs={6} sm={6} md={4} lg={3} className="product-col">
                          <Card className="product-card">
                            <div className="product-image-wrapper">
                              {product.images && product.images.length > 0 && (
                                <div
                                  className="product-image"
                                  style={{
                                    backgroundImage: `url(${getImageUrl(product.images[0])})`,
                                  }}
                                  onClick={() => navigate(`/products/${product._id}`)}
                                />
                              )}
                              {product.featured && (
                                <Badge className="featured-badge">Featured</Badge>
                              )}
                              {discount > 0 && (
                                <Badge className="discount-badge">-{discount}%</Badge>
                              )}
                            </div>
                            <Card.Body className="product-card-body">
                              <div className="product-category">
                                {product.category && (
                                  <span className="category-tag">
                                    {typeof product.category === 'object' && product.category?.name
                                      ? product.category.name
                                      : typeof product.category === 'string'
                                        ? product.category
                                        : 'Uncategorized'}
                                  </span>
                                )}
                              </div>
                              <Card.Title
                                className="product-title"
                                onClick={() => navigate(`/products/${product._id}`)}
                              >
                                {product.name}
                              </Card.Title>
                              {product.description && (
                                <Card.Text className="product-description">
                                  {product.description.length > 80
                                    ? `${product.description.substring(0, 80)}...`
                                    : product.description}
                                </Card.Text>
                              )}
                              <div className="product-rating">
                                <div className="stars">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <FiStar
                                      key={star}
                                      size={14}
                                      fill="#ffa500"
                                      color="#ffa500"
                                    />
                                  ))}
                                </div>
                                <span className="rating-text">(0)</span>
                              </div>
                              <div className="product-price-section">
                                <div className="price-row">
                                  <span className="current-price">
                                    ${product.price?.toFixed(2) || '0.00'}
                                  </span>
                                  {product.compareAtPrice &&
                                    product.compareAtPrice > product.price && (
                                      <span className="original-price">
                                        ${product.compareAtPrice.toFixed(2)}
                                      </span>
                                    )}
                                </div>
                                {discount > 0 && (
                                  <div className="save-amount">
                                    You save ${(product.compareAtPrice - product.price).toFixed(2)}
                                  </div>
                                )}
                              </div>
                              <div className="product-stock">
                                {product.stock > 0 ? (
                                  <span className="in-stock">
                                    {product.stock} in stock
                                  </span>
                                ) : (
                                  <span className="out-of-stock">Out of stock</span>
                                )}
                              </div>
                              <Button
                                variant="warning"
                                className="add-to-cart-btn w-100"
                                disabled={
                                  addingToCart === product._id || (product.stock ?? 0) === 0
                                }
                                onClick={() => handleAddToCart(product._id)}
                              >
                                {addingToCart === product._id ? (
                                  <>
                                    <Spinner size="sm" className="me-2" />
                                    Adding...
                                  </>
                                ) : (
                                  'Add to Cart'
                                )}
                              </Button>
                            </Card.Body>
                          </Card>
                        </Col>
                      );
                    })}
                  </Row>

                  {/* Pagination */}
                  {pagination.pages > 1 && (
                    <div className="pagination-container">
                      <div className="pagination">
                        <Button
                          variant="outline-secondary"
                          size="sm"
                          disabled={pagination.page === 1}
                          onClick={() => handlePageChange(pagination.page - 1)}
                        >
                          Previous
                        </Button>
                        <div className="page-numbers">
                          {Array.from({ length: pagination.pages }, (_, i) => i + 1)
                            .filter(
                              (page) =>
                                page === 1 ||
                                page === pagination.pages ||
                                (page >= pagination.page - 1 && page <= pagination.page + 1)
                            )
                            .map((page, idx, arr) => (
                              <div key={page} className="page-group">
                                {idx > 0 && arr[idx - 1] !== page - 1 && (
                                  <span className="page-ellipsis">...</span>
                                )}
                                <Button
                                  variant={pagination.page === page ? 'warning' : 'outline-secondary'}
                                  size="sm"
                                  onClick={() => handlePageChange(page)}
                                  className="page-btn"
                                >
                                  {page}
                                </Button>
                              </div>
                            ))}
                        </div>
                        <Button
                          variant="outline-secondary"
                          size="sm"
                          disabled={pagination.page === pagination.pages}
                          onClick={() => handlePageChange(pagination.page + 1)}
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </Col>
          </Row>
        </Container>
      </div>
    </>
  );
};

export default ProductListingPage;
