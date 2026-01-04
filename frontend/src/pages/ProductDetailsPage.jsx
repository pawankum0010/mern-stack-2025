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
} from 'react-bootstrap';
import { FiShoppingCart, FiArrowLeft } from 'react-icons/fi';

import AppNavbar from '../components/AppNavbar';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import api from '../api/client';

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

  if (loading) {
    return (
      <>
        <AppNavbar />
        <Container className="py-5">
          <div className="text-center">
            <Spinner animation="border" role="status" />
            <p className="mt-2 text-muted">Loading product...</p>
          </div>
        </Container>
      </>
    );
  }

  if (error || !product) {
    return (
      <>
        <AppNavbar />
        <Container className="py-5">
          <Alert variant="danger">{error || 'Product not found'}</Alert>
          <Button variant="outline-secondary" onClick={() => navigate('/')}>
            <FiArrowLeft className="me-2" />
            Back to Products
          </Button>
        </Container>
      </>
    );
  }

  const discount =
    product.compareAtPrice && product.compareAtPrice > product.price
      ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)
      : 0;

  return (
    <>
      <AppNavbar />
      <Container className="py-4">
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

        <Button
          variant="outline-secondary"
          className="mb-3"
          onClick={() => navigate('/')}
        >
          <FiArrowLeft className="me-2" />
          Back to Products
        </Button>

        <Row className="g-4">
          {/* Product Images */}
          <Col xs={12} md={6}>
            <Card>
              <Card.Body>
                {product.images && product.images.length > 0 ? (
                  <Carousel interval={null} variant="dark">
                    {product.images.map((image, index) => {
                      // Handle both base64 (starts with data:image/) and URL strings
                      const imageUrl = image.startsWith('data:image/')
                        ? image
                        : image.startsWith('http')
                        ? image
                        : `${api.defaults.baseURL.replace('/api', '')}${image}`;
                      return (
                        <Carousel.Item key={index}>
                          <img
                            className="d-block w-100"
                            src={imageUrl}
                            alt={`${product.name} ${index + 1}`}
                            style={{ maxHeight: '500px', objectFit: 'contain' }}
                          />
                        </Carousel.Item>
                      );
                    })}
                  </Carousel>
                ) : (
                  <div
                    className="bg-light d-flex align-items-center justify-content-center"
                    style={{ height: '400px' }}
                  >
                    <span className="text-muted">No image available</span>
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>

          {/* Product Info */}
          <Col xs={12} md={6}>
            <Card>
              <Card.Body>
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <div>
                    {product.category && (
                      <Badge bg="secondary" className="mb-2">
                        {typeof product.category === 'object' && product.category?.name
                          ? product.category.name
                          : typeof product.category === 'string'
                            ? product.category
                            : 'Uncategorized'}
                      </Badge>
                    )}
                    {product.featured && (
                      <Badge bg="warning" text="dark" className="mb-2 ms-2">
                        Featured
                      </Badge>
                    )}
                    {discount > 0 && (
                      <Badge bg="danger" className="mb-2 ms-2">
                        {discount}% OFF
                      </Badge>
                    )}
                  </div>
                  <Badge bg={product.status === 'active' ? 'success' : 'secondary'}>
                    {product.status}
                  </Badge>
                </div>

                <h2 className="mb-3">{product.name}</h2>

                <div className="mb-3">
                  <div className="d-flex align-items-center gap-3">
                    <h4 className="mb-0 text-primary">${product.price?.toFixed(2) || '0.00'}</h4>
                    {product.compareAtPrice && product.compareAtPrice > product.price && (
                      <span className="text-muted text-decoration-line-through">
                        ${product.compareAtPrice.toFixed(2)}
                      </span>
                    )}
                  </div>
                </div>

                {product.description && (
                  <div className="mb-4">
                    <h5>Description</h5>
                    <p className="text-muted" style={{ whiteSpace: 'pre-wrap' }}>
                      {product.description}
                    </p>
                  </div>
                )}

                {/* Product Details Table */}
                <Table bordered className="mb-4">
                  <tbody>
                    {product.sku && (
                      <tr>
                        <th style={{ width: '40%' }}>SKU</th>
                        <td>{product.sku}</td>
                      </tr>
                    )}
                    <tr>
                      <th>Stock</th>
                      <td>
                        {product.stock > 0 ? (
                          <Badge bg="success">{product.stock} available</Badge>
                        ) : (
                          <Badge bg="danger">Out of Stock</Badge>
                        )}
                      </td>
                    </tr>
                    {product.vendor && (
                      <tr>
                        <th>Vendor</th>
                        <td>
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
                        <th>Weight</th>
                        <td>
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
                        <th>Dimensions</th>
                        <td>
                          {product.dimensions.length} × {product.dimensions.width} ×{' '}
                          {product.dimensions.height} {product.dimensionUnit || 'cm'}
                        </td>
                      </tr>
                    )}
                    {product.color && (
                      <tr>
                        <th>Color</th>
                        <td>{product.color}</td>
                      </tr>
                    )}
                    {product.size && (
                      <tr>
                        <th>Size</th>
                        <td>
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
                        <th>Brand</th>
                        <td>{product.brand}</td>
                      </tr>
                    )}
                    {product.material && (
                      <tr>
                        <th>Material</th>
                        <td>{product.material}</td>
                      </tr>
                    )}
                    {product.tags && product.tags.length > 0 && (
                      <tr>
                        <th>Tags</th>
                        <td>
                          {product.tags.map((tag, index) => (
                            <Badge key={index} bg="info" className="me-1">
                              {tag}
                            </Badge>
                          ))}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </Table>

                {/* Add to Cart */}
                {product.stock > 0 ? (
                  <div className="d-flex gap-2 align-items-center">
                    <div className="d-flex align-items-center gap-2">
                      <label htmlFor="quantity">Quantity:</label>
                      <input
                        id="quantity"
                        type="number"
                        min="1"
                        max={product.stock}
                        value={quantity}
                        onChange={(e) => setQuantity(Math.max(1, Math.min(product.stock, parseInt(e.target.value) || 1)))}
                        className="form-control"
                        style={{ width: '80px' }}
                      />
                    </div>
                    <Button
                      variant="primary"
                      size="lg"
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
                  </div>
                ) : (
                  <Alert variant="warning">This product is currently out of stock.</Alert>
                )}
              </Card.Body>
            </Card>
          </Col>

          {/* Additional Details */}
          {(product.specifications ||
            product.warranty ||
            product.shippingInfo ||
            product.returnPolicy) && (
            <Col xs={12}>
              <Card>
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
          )}
        </Row>
      </Container>
    </>
  );
};

export default ProductDetailsPage;

