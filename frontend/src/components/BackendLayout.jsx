import { useState } from 'react';
import { NavDropdown, Button } from 'react-bootstrap';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  FiMenu,
  FiChevronLeft,
  FiChevronRight,
  FiLogOut,
  FiUser,
  FiGrid,
  FiPackage,
  FiUsers,
  FiShoppingCart,
  FiLayers,
  FiSettings,
  FiBarChart2,
  FiFileText,
  FiAlertCircle,
  FiMessageSquare,
  FiMapPin,
} from 'react-icons/fi';

import { useAuth } from '../context/AuthContext';
import './BackendLayout.css';

const MENU = [
  { path: '/admin/dashboard', label: 'Dashboard', icon: FiGrid },
  { path: '/admin/products', label: 'Products', icon: FiPackage },
  { path: '/admin/users', label: 'Users', icon: FiUsers },
  {
    label: 'Sales',
    icon: FiShoppingCart,
    children: [
      { path: '/admin/orders', label: 'Orders' },
      { path: '/admin/pos', label: 'POS Order' },
    ],
  },
  {
    label: 'Catalog',
    icon: FiLayers,
    children: [
      { path: '/admin/categories', label: 'Categories' },
      { path: '/admin/vendors', label: 'Vendors' },
      { path: '/admin/brands', label: 'Brands' },
      { path: '/admin/sizes', label: 'Sizes' },
      { path: '/admin/weight-units', label: 'Weight Units' },
    ],
  },
  {
    label: 'Location & Data',
    icon: FiMapPin,
    children: [
      { path: '/admin/states', label: 'States' },
      { path: '/admin/pincodes', label: 'Pincodes' },
    ],
  },
  {
    label: 'Reports',
    icon: FiBarChart2,
    children: [
      { path: '/admin/reports/active-users', label: 'Active Users' },
      { path: '/admin/reports/highest-selling-products', label: 'Highest Selling' },
      { path: '/admin/reports/orders-status', label: 'Orders Status' },
    ],
  },
  {
    label: 'Settings',
    icon: FiSettings,
    children: [
      { path: '/admin/currencies', label: 'Currencies' },
      { path: '/admin/contact-settings', label: 'Contact Settings' },
    ],
  },
  { path: '/admin/customer-activity-logs', label: 'Activity Logs', icon: FiFileText },
  { path: '/admin/error-logs', label: 'Error Logs', icon: FiAlertCircle },
  { path: '/admin/support-requests', label: 'Support', icon: FiMessageSquare },
];

const pathToBreadcrumb = (path) => {
  const parts = path.replace(/^\/admin\/?/, '').split('/').filter(Boolean);
  const breadcrumbs = [{ path: '/admin', label: 'Admin' }];
  let acc = '/admin';
  for (const p of parts) {
    acc += `/${p}`;
    const label = p
      .split('-')
      .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
      .join(' ');
    breadcrumbs.push({ path: acc, label });
  }
  return breadcrumbs;
};

const BackendLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const breadcrumbs = pathToBreadcrumb(location.pathname);

  const handleLogout = async () => {
    await logout();
    navigate('/backend', { replace: true });
  };

  const isChildActive = (children) =>
    children && children.some((c) => c.path === location.pathname);

  const renderNavItem = (item) => {
    if (item.children) {
      const hasActive = isChildActive(item.children);
      return (
        <div
          key={item.label}
          className={`backend-nav-section ${hasActive ? 'has-active' : ''}`}
        >
          <div className="backend-nav-section-title">
            <item.icon size={18} className="backend-nav-section-icon" />
            {!sidebarCollapsed && <span>{item.label}</span>}
          </div>
          {!sidebarCollapsed &&
            item.children.map((child) => (
              <button
                type="button"
                key={child.path}
                className={`backend-nav-link backend-nav-sublink ${location.pathname === child.path ? 'active' : ''}`}
                onClick={() => navigate(child.path)}
              >
                <span className="backend-nav-link-text">{child.label}</span>
              </button>
            ))}
        </div>
      );
    }
    return (
      <button
        type="button"
        key={item.path}
        className={`backend-nav-link ${location.pathname === item.path ? 'active' : ''}`}
        onClick={() => navigate(item.path)}
      >
        <item.icon size={18} className="backend-nav-link-icon" />
        {!sidebarCollapsed && <span className="backend-nav-link-text">{item.label}</span>}
      </button>
    );
  };

  return (
    <div className={`backend-wrap ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      <aside className="backend-sidebar">
        <div className="backend-sidebar-header">
          <Button
            variant="link"
            className="backend-sidebar-toggle"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            title={sidebarCollapsed ? 'Expand' : 'Collapse'}
          >
            {sidebarCollapsed ? <FiChevronRight size={20} /> : <FiChevronLeft size={20} />}
          </Button>
          {!sidebarCollapsed && (
            <div className="backend-sidebar-logo" onClick={() => navigate('/admin/dashboard')}>
              <img src="/logo.svg" alt="Soft Chilli" onError={(e) => { e.target.style.display = 'none'; }} />
              <span>Admin</span>
            </div>
          )}
        </div>
        <nav className="backend-nav">
          {MENU.map(renderNavItem)}
        </nav>
      </aside>
      <div className="backend-main">
        <header className="backend-header">
          <div className="backend-header-left">
            <Button
              variant="link"
              className="backend-mobile-menu d-md-none"
              onClick={() => setSidebarCollapsed((c) => !c)}
            >
              <FiMenu size={24} />
            </Button>
            <nav className="backend-breadcrumb">
              {breadcrumbs.map((b, i) => (
                <span key={b.path}>
                  {i > 0 && <span className="backend-breadcrumb-sep">/</span>}
                  {i === breadcrumbs.length - 1 ? (
                    <span className="backend-breadcrumb-current">{b.label}</span>
                  ) : (
                    <button type="button" className="backend-breadcrumb-link" onClick={() => navigate(b.path)}>
                      {b.label}
                    </button>
                  )}
                </span>
              ))}
            </nav>
          </div>
          <div className="backend-header-right">
            <NavDropdown
              align="end"
              title={
                <span className="backend-user-trigger">
                  <FiUser size={18} />
                  <span className="d-none d-md-inline">
                    {user?.name || user?.email?.split('@')[0] || 'User'}
                  </span>
                </span>
              }
              id="backend-user-dropdown"
              className="backend-user-dropdown"
            >
              <NavDropdown.Item disabled className="backend-user-role">
                {user?.role?.name || 'User'}
              </NavDropdown.Item>
              <NavDropdown.Divider />
              <NavDropdown.Item onClick={handleLogout}>
                <FiLogOut className="me-2" /> Sign Out
              </NavDropdown.Item>
            </NavDropdown>
          </div>
        </header>
        <main className="backend-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default BackendLayout;
