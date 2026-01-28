import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Alert,
  Badge,
  Button,
  Card,
  Col,
  Container,
  Row,
  Spinner,
  Carousel,
  Table,
  Form,
} from 'react-bootstrap';
import { FiShoppingCart, FiArrowLeft, FiStar, FiChevronLeft, FiChevronRight } from 'react-icons/fi';

import AppNavbar from '../components/AppNavbar';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import api from '../api/client';
import './ProductDetailsPage.css';

const ProductDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const cartContext = useCart();
  const { refreshCart } = cartContext;

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [addingToCart, setAddingToCart] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [cartMessage, setCartMessage] = useState(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  useEffect(() => {
    fetchProduct();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchProduct = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get(`/products/${id}`);
      setProduct(data?.data);
    } catch (error) {
      setError(error.message || 'Failed to load product');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async () => {
    setAddingToCart(true);
    setCartMessage(null);
    try {
      if (!isAuthenticated) {
        // Guest cart - store in localStorage
        const { getGuestCart, saveGuestCart } = cartContext;
        const guestCart = getGuestCart();
        
        const existingItemIndex = guestCart.items.findIndex(
          item => item.productId === id
        );
        
        if (existingItemIndex > -1) {
          guestCart.items[existingItemIndex].quantity += quantity;
        } else {
          guestCart.items.push({
            productId: id,
            product: {
              _id: product._id,
              name: product.name,
              price: product.price,
              images: product.images,
            },
            quantity: quantity,
            price: product.price,
          });
        }
        
        saveGuestCart(guestCart);
        setCartMessage({ type: 'success', text: 'Added to cart!' });
        refreshCart();
      } else {
        // Authenticated user - use API
        await api.post('/cart/add', { productId: id, quantity });
        setCartMessage({ type: 'success', text: 'Added to cart!' });
        refreshCart();
      }
      setTimeout(() => setCartMessage(null), 3000);
    } catch (error) {
      setCartMessage({ type: 'danger', text: error.message || 'Failed to add to cart' });
      setTimeout(() => setCartMessage(null), 3000);
    } finally {
      setAddingToCart(false);
    }
  };

  const getImageUrl = (image) => {
    if (!image) return '';
    if (image.startsWith('data:image/')) return image;
    if (image.startsWith('http')) return image;
    return `${api.defaults.baseURL.replace('/api', '')}${image}`;
  };

  const nextImage = () => {
    if (product.images && product.images.length > 0) {
      setSelectedImageIndex((prev) => (prev + 1) % product.images.length);
    }
  };

  const prevImage = () => {
    if (product.images && product.images.length > 0) {
      setSelectedImageIndex((prev) => (prev - 1 + product.images.length) % product.images.length);
    }
  };

  if (loading) {
    return (
      <>
        <AppNavbar />
        <div className="product-details-page">
          <Container className="py-5">
            <div className="text-center">
              <Spinner animation="border" role="status" />
              <p className="mt-2 text-muted">Loading product...</p>
            </div>
          </Container>
        </div>
      </>
    );
  }

  if (error || !product) {
    return (
      <>
        <AppNavbar />
        <div className="product-details-page">
          <Container className="py-5">
            <Alert variant="danger">{error || 'Product not found'}</Alert>
            <Button variant="outline-secondary" onClick={() => navigate('/')} className="back-btn">
              <FiArrowLeft className="me-2" />
              Back to Products
            </Button>
          </Container>
        </div>
      </>
    );
  }

  const discount =
    product.compareAtPrice && product.compareAtPrice > product.price
      ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)
      : 0;

  const saveAmount = product.compareAtPrice && product.compareAtPrice > product.price
    ? (product.compareAtPrice - product.price).toFixed(2)
    : 0;

  return (
    <>
      <AppNavbar />
      <div className="product-details-page">
        <Container className="product-details-container">
          {cartMessage && (
            <Alert
              variant={cartMessage.type}
              dismissible
              onClose={() => setCartMessage(null)}
              className="cart-message-alert"
            >
              {cartMessage.text}
            </Alert>
          )}

          <Button
            variant="link"
            className="back-to-products-btn"
            onClick={() => navigate('/')}
          >
            <FiArrowLeft className="me-2" />
            Back to Products
          </Button>

          <Row className="product-details-row">
            {/* Product Images */}
            <Col xs={12} md={6} lg={5} className="product-images-col">
              <div className="product-images-wrapper">
                {/* Thumbnail Images */}
                {product.images && product.images.length > 1 && (
                  <div className="thumbnail-images">
                    {product.images.map((image, index) => (
                      <div
                        key={index}
                        className={`thumbnail-item ${selectedImageIndex === index ? 'active' : ''}`}
                        onClick={() => setSelectedImageIndex(index)}
                      >
                        <img
                          src={getImageUrl(image)}
                          alt={`${product.name} thumbnail ${index + 1}`}
                        />
                      </div>
                    ))}
                  </div>
                )}

                {/* Main Image */}
                <div className="main-image-container">
                  {product.images && product.images.length > 0 ? (
                    <>
                      {product.images.length > 1 && (
                        <Button
                          variant="link"
                          className="image-nav-btn prev-btn"
                          onClick={prevImage}
                        >
                          <FiChevronLeft size={24} />
                        </Button>
                      )}
                      <div className="main-image">
                        <img
                          src={getImageUrl(product.images[selectedImageIndex])}
                          alt={product.name}
                        />
                      </div>
                      {product.images.length > 1 && (
                        <Button
                          variant="link"
                          className="image-nav-btn next-btn"
                          onClick={nextImage}
                        >
                          <FiChevronRight size={24} />
                        </Button>
                      )}
                    </>
                  ) : (
                    <div className="no-image-placeholder">
                      <span className="text-muted">No image available</span>
                    </div>
                  )}
                </div>
              </div>
            </Col>

            {/* Product Info */}
            <Col xs={12} md={6} lg={4} className="product-info-col">
              <div className="product-info-wrapper">
                {/* Breadcrumb */}
                {product.category && (
                  <div className="product-breadcrumb">
                    <span className="breadcrumb-link" onClick={() => navigate('/')}>
                      Shop
                    </span>
                    <span className="breadcrumb-separator">›</span>
                    <span className="breadcrumb-text">
                      {typeof product.category === 'object' && product.category?.name
                        ? product.category.name
                        : typeof product.category === 'string'
                          ? product.category
                          : 'Uncategorized'}
                    </span>
                  </div>
                )}

                {/* Product Title */}
                <h1 className="product-title">{product.name}</h1>

                {/* Rating */}
                <div className="product-rating-section">
                  <div className="stars-rating">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <FiStar
                        key={star}
                        size={18}
                        fill="#ffa500"
                        color="#ffa500"
                      />
                    ))}
                  </div>
                  <span className="rating-link">(0)</span>
                </div>

                {/* Price Section */}
                <div className="product-price-section">
                  <div className="price-row">
                    <span className="current-price">${product.price?.toFixed(2) || '0.00'}</span>
                    {product.compareAtPrice && product.compareAtPrice > product.price && (
                      <span className="original-price">${product.compareAtPrice.toFixed(2)}</span>
                    )}
                  </div>
                  {discount > 0 && (
                    <>
                      <div className="discount-badge-large">{discount}% OFF</div>
                      <div className="save-amount-text">
                        You save ${saveAmount}
                      </div>
                    </>
                  )}
                  {product.stock > 0 && (
                    <div className="stock-info">
                      <span className="in-stock-badge">In Stock</span>
                      <span className="stock-count">{product.stock} available</span>
                    </div>
                  )}
                </div>

                {/* Product Badges */}
                <div className="product-badges">
                  {product.featured && (
                    <Badge className="featured-badge-large">Featured</Badge>
                  )}
                  {product.category && (
                    <Badge className="category-badge-large">
                      {typeof product.category === 'object' && product.category?.name
                        ? product.category.name
                        : typeof product.category === 'string'
                          ? product.category
                          : 'Uncategorized'}
                    </Badge>
                  )}
                </div>

                {/* Description */}
                {product.description && (
                  <div className="product-description-section">
                    <h5>About this item</h5>
                    <p className="description-text">{product.description}</p>
                  </div>
                )}

                {/* Key Features */}
                <div className="product-features">
                  {product.sku && (
                    <div className="feature-item">
                      <span className="feature-label">SKU:</span>
                      <span className="feature-value">{product.sku}</span>
                    </div>
                  )}
                  {product.vendor && (
                    <div className="feature-item">
                      <span className="feature-label">Vendor:</span>
                      <span className="feature-value">
                        {typeof product.vendor === 'object' && product.vendor?.name
                          ? product.vendor.name
                          : typeof product.vendor === 'string'
                            ? product.vendor
                            : '-'}
                      </span>
                    </div>
                  )}
                  {product.brand && (
                    <div className="feature-item">
                      <span className="feature-label">Brand:</span>
                      <span className="feature-value">{product.brand}</span>
                    </div>
                  )}
                </div>

                {/* Add to Cart Section */}
                <div className="add-to-cart-section">
                  {product.stock > 0 ? (
                    <>
                      <div className="quantity-selector">
                        <label htmlFor="quantity">Quantity:</label>
                        <Form.Select
                          id="quantity"
                          value={quantity}
                          onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                          className="quantity-select"
                        >
                          {Array.from({ length: Math.min(product.stock, 10) }, (_, i) => i + 1).map((num) => (
                            <option key={num} value={num}>
                              {num}
                            </option>
                          ))}
                        </Form.Select>
                      </div>
                      <Button
                        variant="warning"
                        size="lg"
                        className="add-to-cart-btn-large"
                        onClick={handleAddToCart}
                        disabled={addingToCart || product.stock === 0}
                      >
                        {addingToCart ? (
                          <>
                            <Spinner size="sm" animation="border" className="me-2" />
                            Adding...
                          </>
                        ) : (
                          <>
                            <FiShoppingCart className="me-2" />
                            Add to Cart
                          </>
                        )}
                      </Button>
                      <Button
                        variant="outline-warning"
                        size="lg"
                        className="buy-now-btn"
                        disabled={addingToCart || product.stock === 0}
                      >
                        Buy Now
                      </Button>
                    </>
                  ) : (
                    <Alert variant="warning" className="out-of-stock-alert">
                      This product is currently out of stock.
                    </Alert>
                  )}
                </div>
              </div>
            </Col>

            {/* Product Details Card */}
            <Col xs={12} md={12} lg={3} className="product-details-card-col">
              <Card className="product-details-card">
                <Card.Header>
                  <h5 className="mb-0">Product Details</h5>
                </Card.Header>
                <Card.Body>
                  <Table borderless className="details-table">
                    <tbody>
                      {product.sku && (
                        <tr>
                          <td className="detail-label">SKU</td>
                          <td className="detail-value">{product.sku}</td>
                        </tr>
                      )}
                      <tr>
                        <td className="detail-label">Stock</td>
                        <td className="detail-value">
                          {product.stock > 0 ? (
                            <Badge bg="success">{product.stock} available</Badge>
                          ) : (
                            <Badge bg="danger">Out of Stock</Badge>
                          )}
                        </td>
                      </tr>
                      {product.vendor && (
                        <tr>
                          <td className="detail-label">Vendor</td>
                          <td className="detail-value">
                            {typeof product.vendor === 'object' && product.vendor?.name
                              ? product.vendor.name
                              : typeof product.vendor === 'string'
                                ? product.vendor
                                : '-'}
                          </td>
                        </tr>
                      )}
                      {product.weight && (
                        <tr>
                          <td className="detail-label">Weight</td>
                          <td className="detail-value">
                            {product.weight}{' '}
                            {typeof product.weightUnit === 'object' && product.weightUnit?.symbol
                              ? product.weightUnit.symbol
                              : typeof product.weightUnit === 'object' && product.weightUnit?.name
                                ? product.weightUnit.name
                                : typeof product.weightUnit === 'string'
                                  ? product.weightUnit
                                  : 'kg'}
                          </td>
                        </tr>
                      )}
                      {product.dimensions && (
                        <tr>
                          <td className="detail-label">Dimensions</td>
                          <td className="detail-value">
                            {product.dimensions.length} × {product.dimensions.width} ×{' '}
                            {product.dimensions.height} {product.dimensionUnit || 'cm'}
                          </td>
                        </tr>
                      )}
                      {product.color && (
                        <tr>
                          <td className="detail-label">Color</td>
                          <td className="detail-value">{product.color}</td>
                        </tr>
                      )}
                      {product.size && (
                        <tr>
                          <td className="detail-label">Size</td>
                          <td className="detail-value">
                            {typeof product.size === 'object' && product.size?.name
                              ? product.size.name
                              : typeof product.size === 'object' && product.size?.code
                                ? product.size.code
                                : typeof product.size === 'string'
                                  ? product.size
                                  : '-'}
                          </td>
                        </tr>
                      )}
                      {product.brand && (
                        <tr>
                          <td className="detail-label">Brand</td>
                          <td className="detail-value">{product.brand}</td>
                        </tr>
                      )}
                      {product.material && (
                        <tr>
                          <td className="detail-label">Material</td>
                          <td className="detail-value">{product.material}</td>
                        </tr>
                      )}
                      {product.tags && product.tags.length > 0 && (
                        <tr>
                          <td className="detail-label">Tags</td>
                          <td className="detail-value">
                            <div className="tags-container">
                              {product.tags.map((tag, index) => (
                                <Badge key={index} bg="info" className="tag-badge">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </Table>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Additional Information */}
          {(product.specifications ||
            product.warranty ||
            product.shippingInfo ||
            product.returnPolicy) && (
            <Row className="additional-info-row">
              <Col xs={12}>
                <Card className="additional-info-card">
                  <Card.Header>
                    <h5 className="mb-0">Additional Information</h5>
                  </Card.Header>
                  <Card.Body>
                    <Row>
                      {product.specifications && (
                        <Col xs={12} md={6} className="mb-3">
                          <h6>Specifications</h6>
                          {typeof product.specifications === 'string' ? (
                            <p className="text-muted" style={{ whiteSpace: 'pre-wrap' }}>
                              {product.specifications}
                            </p>
                          ) : (
                            <Table size="sm" bordered>
                              <tbody>
                                {Object.entries(product.specifications).map(([key, value]) => (
                                  <tr key={key}>
                                    <th>{key}</th>
                                    <td>{value}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </Table>
                          )}
                        </Col>
                      )}
                      {product.warranty && (
                        <Col xs={12} md={6} className="mb-3">
                          <h6>Warranty</h6>
                          <p className="text-muted">{product.warranty}</p>
                        </Col>
                      )}
                      {product.shippingInfo && (
                        <Col xs={12} md={6} className="mb-3">
                          <h6>Shipping Information</h6>
                          <p className="text-muted" style={{ whiteSpace: 'pre-wrap' }}>
                            {product.shippingInfo}
                          </p>
                        </Col>
                      )}
                      {product.returnPolicy && (
                        <Col xs={12} md={6} className="mb-3">
                          <h6>Return Policy</h6>
                          <p className="text-muted" style={{ whiteSpace: 'pre-wrap' }}>
                            {product.returnPolicy}
                          </p>
                        </Col>
                      )}
                    </Row>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          )}
        </Container>
      </div>
    </>
  );
};

export default ProductDetailsPage;
