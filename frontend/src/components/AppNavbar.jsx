import { useState, useEffect } from 'react';
import { Nav, NavDropdown, Button, Container, Badge, InputGroup, Form } from 'react-bootstrap';
import { useNavigate, useLocation } from 'react-router-dom';
import { FiShoppingCart, FiMoon, FiSun, FiChevronDown, FiSearch } from 'react-icons/fi';

import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useTheme } from '../context/ThemeContext';
import './AppNavbar.css';

const AppNavbar = () => {
  const { user, logout } = useAuth();
  const { cartCount } = useCart();
  const { isDarkMode, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');

  // Sync search query with URL params when on product listing page
  useEffect(() => {
    if (location.pathname === '/') {
      const params = new URLSearchParams(location.search);
      const searchParam = params.get('search');
      if (searchParam) {
        setSearchQuery(searchParam);
      } else {
        setSearchQuery('');
      }
    }
  }, [location]);

  const handleLogout = async () => {
    await logout();
    navigate('/', { replace: true });
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/');
    }
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const isAdmin = user?.role?.name?.toLowerCase() === 'admin' || user?.role?.name?.toLowerCase() === 'superadmin';
  const isCustomer = user?.role?.name?.toLowerCase() === 'customer';

  return (
    <>
      {/* Top Navigation Bar - Amazon Style */}
      <div className={`amazon-navbar-top ${isDarkMode ? 'dark-mode' : ''}`}>
        <Container fluid className="amazon-navbar-container">
          <div className="amazon-navbar-left">
            <div 
              className="amazon-logo" 
              onClick={() => navigate(isAdmin ? '/admin/products' : '/')}
            >
              <img 
                src="/logo.svg" 
                alt="Soft Chilli" 
                className="logo-img"
                onError={(e) => {
                  console.error('Logo failed to load');
                  e.target.style.display = 'none';
                }}
              />
              {isAdmin && <span className="admin-label d-none d-md-inline">Admin Panel</span>}
            </div>
          </div>

          {/* Search Bar in Center - Only show for non-admin */}
          {!isAdmin && (
            <div className="amazon-navbar-search">
              <Form onSubmit={handleSearch} className="navbar-search-form">
                <InputGroup className="navbar-search-input-group">
                  <Form.Control
                    type="text"
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={handleSearchChange}
                    className="navbar-search-input"
                  />
                  <Button 
                    type="submit"
                    variant="warning" 
                    className="navbar-search-button"
                  >
                    <FiSearch size={20} />
                  </Button>
                </InputGroup>
              </Form>
            </div>
          )}

          {/* Admin Navigation in Center */}
          {isAdmin && (
            <div className="amazon-navbar-center">
              <Nav className="amazon-main-nav">
                <Nav.Link onClick={() => navigate('/admin/users')} className="nav-link-item">Users</Nav.Link>
                <Nav.Link onClick={() => navigate('/admin/products')} className="nav-link-item">Products</Nav.Link>
                <NavDropdown title="Master" id="master-dropdown" className="nav-dropdown-item">
                  <NavDropdown.Item onClick={() => navigate('/admin/categories')}>Categories</NavDropdown.Item>
                  <NavDropdown.Item onClick={() => navigate('/admin/vendors')}>Vendors</NavDropdown.Item>
                  <NavDropdown.Item onClick={() => navigate('/admin/states')}>States</NavDropdown.Item>
                  <NavDropdown.Item onClick={() => navigate('/admin/weight-units')}>Weight Units</NavDropdown.Item>
                  <NavDropdown.Item onClick={() => navigate('/admin/sizes')}>Sizes</NavDropdown.Item>
                  <NavDropdown.Item onClick={() => navigate('/admin/pincodes')}>Pincodes</NavDropdown.Item>
                  <NavDropdown.Item onClick={() => navigate('/admin/currencies')}>Currencies</NavDropdown.Item>
                </NavDropdown>
                <NavDropdown title="Reports" id="reports-dropdown" className="nav-dropdown-item">
                  <NavDropdown.Item onClick={() => navigate('/admin/reports/active-users')}>Active Users</NavDropdown.Item>
                  <NavDropdown.Item onClick={() => navigate('/admin/reports/highest-selling-products')}>Highest Selling Products</NavDropdown.Item>
                  <NavDropdown.Item onClick={() => navigate('/admin/reports/orders-status')}>Orders Status</NavDropdown.Item>
                </NavDropdown>
                <Nav.Link onClick={() => navigate('/admin/customer-activity-logs')} className="nav-link-item">Activity Logs</Nav.Link>
                <Nav.Link onClick={() => navigate('/admin/error-logs')} className="nav-link-item">Error Logs</Nav.Link>
                {user && (
                  <Nav.Link onClick={() => navigate('/admin/orders')} className="nav-link-item">Orders</Nav.Link>
                )}
              </Nav>
            </div>
          )}

          <div className="amazon-navbar-right">
            {!isAdmin && (
              <div 
                className="amazon-cart-icon"
                onClick={() => navigate('/cart')}
              >
                <FiShoppingCart size={24} />
                {cartCount > 0 && (
                  <Badge className="cart-badge">{cartCount > 99 ? '99+' : cartCount}</Badge>
                )}
                <span className="cart-text d-none d-md-inline">Cart</span>
              </div>
            )}
            
            <Button
              variant="link"
              className="theme-toggle-btn"
              onClick={toggleTheme}
              title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {isDarkMode ? <FiSun size={20} /> : <FiMoon size={20} />}
            </Button>

            {user ? (
              <div className="amazon-account-menu">
                <NavDropdown
                  title={
                    <div className="account-dropdown-trigger">
                      <span className="account-greeting">Hello, {user.name || user.email?.split('@')[0] || 'User'}</span>
                      <span className="account-label">
                        {isAdmin ? 'Admin' : isCustomer ? 'Account & Lists' : 'Account'}
                        <FiChevronDown size={12} className="ms-1 account-arrow" />
                      </span>
                    </div>
                  }
                  id="account-dropdown"
                  className="account-dropdown"
                >
                  <div className="account-dropdown-content">
                    <div className="account-section">
                      <div className="account-info">
                        <div className="account-name">{user.name || user.email}</div>
                        <div className="account-role">
                          <Badge bg="secondary" className="role-badge">
                            {user?.role?.name || user?.role || 'User'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    {!isAdmin && (
                      <>
                        <NavDropdown.Item onClick={() => navigate('/')}>Shop</NavDropdown.Item>
                        <NavDropdown.Item onClick={() => navigate('/support')}>Support</NavDropdown.Item>
                      </>
                    )}
                    {isCustomer && (
                      <>
                        <NavDropdown.Item onClick={() => navigate('/profile')}>Your Profile</NavDropdown.Item>
                        <NavDropdown.Item onClick={() => navigate('/orders')}>Your Orders</NavDropdown.Item>
                        <NavDropdown.Item onClick={() => navigate('/addresses')}>Your Addresses</NavDropdown.Item>
                        <NavDropdown.Item onClick={() => navigate('/support')}>Support</NavDropdown.Item>
                      </>
                    )}
                    <NavDropdown.Item onClick={handleLogout} className="logout-item">Sign Out</NavDropdown.Item>
                  </div>
                </NavDropdown>
              </div>
            ) : (
              <div className="amazon-auth-buttons d-flex align-items-center gap-3">
                <Button
                  variant="link"
                  className="auth-link-btn"
                  onClick={() => navigate('/support')}
                  style={{ color: '#ffffff', fontSize: '0.875rem' }}
                >
                  Support
                </Button>
                <Button
                  variant="link"
                  className="auth-link-btn"
                  onClick={() => navigate('/login')}
                >
                  <span className="auth-link-line1">Hello, sign in</span>
                  <span className="auth-link-line2">Account & Lists</span>
                </Button>
              </div>
            )}
          </div>
        </Container>
      </div>
    </>
  );
};

export default AppNavbar;
