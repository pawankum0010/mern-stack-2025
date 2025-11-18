import { Navbar, Nav, Button, Container, Badge } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { FiShoppingCart } from 'react-icons/fi';

import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

const AppNavbar = () => {
  const { user, logout } = useAuth();
  const { cartCount } = useCart();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <Navbar bg="dark" variant="dark" expand="lg" className="mb-4">
      <Container fluid>
        <Navbar.Brand>MERN Admin Panel</Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            <Nav.Link onClick={() => navigate('/')}>Users</Nav.Link>
            <Nav.Link onClick={() => navigate('/products')}>Products</Nav.Link>
            <Nav.Link onClick={() => navigate('/shop')}>Shop</Nav.Link>
            <Nav.Link onClick={() => navigate('/orders')}>Orders</Nav.Link>
          </Nav>
          <Nav>
            <Nav.Link
              onClick={() => navigate('/cart')}
              className="d-flex align-items-center position-relative"
              style={{ cursor: 'pointer' }}
            >
              <FiShoppingCart size={20} />
              {cartCount > 0 && (
                <Badge
                  bg="danger"
                  className="position-absolute"
                  style={{
                    top: '-5px',
                    right: '-5px',
                    fontSize: '0.7rem',
                    minWidth: '18px',
                    height: '18px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {cartCount > 99 ? '99+' : cartCount}
                </Badge>
              )}
            </Nav.Link>
          </Nav>
          <div className="d-flex align-items-center gap-3 text-light">
            {user && (
              <>
                <span>{user.name || user.email}</span>
                <span className="badge bg-secondary text-uppercase">
                  {user?.role?.name || user?.role}
                </span>
              </>
            )}
            <Button variant="outline-light" size="sm" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default AppNavbar;

