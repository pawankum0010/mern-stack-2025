import { useEffect, useState } from 'react';
import { Button, Col, Container, Row, Spinner, Alert } from 'react-bootstrap';
import { useLocation } from 'react-router-dom';

import AppNavbar from '../components/AppNavbar';
import ProductCard from '../components/ProductCard';
import FilterSidebar from '../components/FilterSidebar';
import ResultsHeader from '../components/ResultsHeader';
import SEO from '../components/SEO';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import api from '../api/client';
import './ProductListingPage.css';

const ProductListingPage = () => {
  const { isAuthenticated } = useAuth();
  const cartContext = useCart();
  const { refreshCart } = cartContext;
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


  // Get category name for SEO if filter is applied
  const categoryName = filters.category 
    ? categories.find(cat => cat.name === filters.category)?.name || filters.category
    : null;

  const seoTitle = categoryName 
    ? `Shop ${categoryName} Online | Fashion, Electronics & Study Materials`
    : filters.search
    ? `Search Results for "${filters.search}" | Soft Chilli eCommerce`
    : 'Shop Online | Fashion, Electronics & Study Materials - Soft Chilli';

  const seoDescription = categoryName
    ? `Shop ${categoryName} products online at Soft Chilli. Best prices on ${categoryName.toLowerCase()} with fast delivery. Browse our wide selection of quality products.`
    : filters.search
    ? `Find ${filters.search} products at Soft Chilli. Browse our collection of fashion, electronics, and study materials.`
    : 'Shop online at Soft Chilli - Your trusted eCommerce portal for Fashion, Electronics, Study Materials & more. Browse thousands of products from top brands with best prices and fast delivery.';

  const seoKeywords = categoryName
    ? `${categoryName.toLowerCase()}, online shopping, ${categoryName.toLowerCase()} products, soft chilli, ecommerce, buy ${categoryName.toLowerCase()} online`
    : 'ecommerce, online shopping, fashion, electronics, study materials, books, soft chilli, erp softchilli, online store, shopping portal, buy online, fashion store, electronics store';

  return (
    <>
      <SEO
        title={seoTitle}
        description={seoDescription}
        keywords={seoKeywords}
        url={window.location.pathname + window.location.search}
      />
      <AppNavbar />
      <div className="product-listing-page">
        <Container fluid className="main-content">
          <Row>
            {/* Filters Sidebar */}
            <Col xs={12} md={3} className="filters-sidebar">
              <FilterSidebar
                categories={categories}
                filters={filters}
                onFilterChange={handleFilterChange}
                onClearFilters={clearAllFilters}
                expandedFilters={expandedFilters}
                onToggleSection={toggleFilterSection}
              />
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
              <ResultsHeader
                totalResults={pagination.total}
                currentResults={products.length}
                loading={loading}
                sortBy={sortBy}
                onSortChange={setSortBy}
              />

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
                    {products.map((product) => (
                      <ProductCard
                        key={product._id}
                        product={product}
                        onAddToCart={handleAddToCart}
                        isAddingToCart={addingToCart === product._id}
                      />
                    ))}
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
