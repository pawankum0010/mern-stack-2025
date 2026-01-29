import { Badge, Button, Card, Col, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { FiStar } from 'react-icons/fi';

import api from '../api/client';
import { useCurrency } from '../context/CurrencyContext';

/**
 * ProductCard Component
 * 
 * A reusable component for displaying product information in a card format.
 * Can be used in product listings, search results, featured products, etc.
 * 
 * @param {Object} product - The product object containing all product details
 * @param {Function} onAddToCart - Callback function when "Add to Cart" is clicked
 * @param {Boolean} isAddingToCart - Whether this specific product is being added to cart
 * @param {String} className - Additional CSS classes for the card
 * @param {Number} colSize - Bootstrap column size (default: { xs: 6, sm: 6, md: 4, lg: 3 })
 */
const ProductCard = ({ 
  product, 
  onAddToCart, 
  isAddingToCart = false,
  className = '',
  colSize = { xs: 6, sm: 6, md: 4, lg: 3 }
}) => {
  const navigate = useNavigate();
  const { formatPrice } = useCurrency();

  /**
   * Get the full URL for a product image
   * Handles different image formats (base64, absolute URLs, relative paths)
   */
  const getImageUrl = (image) => {
    if (!image) return '';
    if (image.startsWith('data:image/')) return image;
    if (image.startsWith('http')) return image;
    return `${api.defaults.baseURL.replace('/api', '')}${image}`;
  };

  /**
   * Calculate discount percentage
   */
  const calculateDiscount = (price, comparePrice) => {
    if (!comparePrice || comparePrice <= price) return 0;
    return Math.round(((comparePrice - price) / comparePrice) * 100);
  };

  const discount = calculateDiscount(product.price, product.compareAtPrice);
  const isOutOfStock = (product.stock ?? 0) === 0;

  const handleCardClick = () => {
    navigate(`/products/${product._id}`);
  };

  const handleAddToCartClick = (e) => {
    e.stopPropagation(); // Prevent card click when clicking button
    if (onAddToCart) {
      onAddToCart(product._id);
    }
  };

  return (
    <Col {...colSize} className={`product-col ${className}`}>
      <Card className="product-card">
        <div className="product-image-wrapper">
          {product.images && product.images.length > 0 && (
            <div
              className="product-image"
              style={{
                backgroundImage: `url(${getImageUrl(product.images[0])})`,
              }}
              onClick={handleCardClick}
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
            onClick={handleCardClick}
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
                {formatPrice(product.price || 0)}
              </span>
              {product.compareAtPrice &&
                product.compareAtPrice > product.price && (
                  <span className="original-price">
                    {formatPrice(product.compareAtPrice)}
                  </span>
                )}
            </div>
            {discount > 0 && (
              <div className="save-amount">
                You save {formatPrice(product.compareAtPrice - product.price)}
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
            disabled={isAddingToCart || isOutOfStock}
            onClick={handleAddToCartClick}
          >
            {isAddingToCart ? (
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
};

export default ProductCard;

