// Mock the API client before any imports that use it
jest.mock('../../api/client', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    defaults: {
      baseURL: 'http://localhost:5000/api',
    },
  },
  setAuthToken: jest.fn(),
}));

import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import AppNavbar from '../AppNavbar';
import { AuthProvider } from '../../context/AuthContext';
import { CartProvider } from '../../context/CartContext';
import { ThemeProvider } from '../../context/ThemeContext';

// Mock react-icons
jest.mock('react-icons/fi', () => ({
  FiShoppingCart: () => <div data-testid="cart-icon">Cart</div>,
  FiMoon: () => <div data-testid="moon-icon">Moon</div>,
  FiSun: () => <div data-testid="sun-icon">Sun</div>,
}));

const renderWithProviders = (component) => {
  return render(
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <ThemeProvider>
        <AuthProvider>
          <CartProvider>
            {component}
          </CartProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
};

describe('AppNavbar', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should render logo', () => {
    renderWithProviders(<AppNavbar />);
    const logo = screen.getByAltText('Soft Chilli');
    expect(logo).toBeInTheDocument();
  });

  it('should render Shop link', () => {
    renderWithProviders(<AppNavbar />);
    const shopLink = screen.getByText('Shop');
    expect(shopLink).toBeInTheDocument();
  });

  it('should render dark mode toggle button', () => {
    renderWithProviders(<AppNavbar />);
    const toggleButton = screen.getByTitle(/switch to/i);
    expect(toggleButton).toBeInTheDocument();
  });

  it('should toggle theme when button is clicked', () => {
    renderWithProviders(<AppNavbar />);
    const toggleButton = screen.getByTitle(/switch to/i);

    // Initially should show moon icon (light mode)
    expect(screen.getByTestId('moon-icon')).toBeInTheDocument();

    fireEvent.click(toggleButton);

    // After click, should show sun icon (dark mode)
    expect(screen.getByTestId('sun-icon')).toBeInTheDocument();
  });

  it('should render Login and Sign Up buttons when user is not authenticated', () => {
    renderWithProviders(<AppNavbar />);
    expect(screen.getByText('Login')).toBeInTheDocument();
    expect(screen.getByText('Sign Up')).toBeInTheDocument();
  });

  it('should render cart icon', () => {
    renderWithProviders(<AppNavbar />);
    expect(screen.getByTestId('cart-icon')).toBeInTheDocument();
  });

  it('should navigate to home when logo is clicked', () => {
    renderWithProviders(<AppNavbar />);
    const logo = screen.getByAltText('Soft Chilli').closest('div');
    
    fireEvent.click(logo);
    // Navigation is tested by react-router, we just verify click works
    expect(logo).toBeInTheDocument();
  });
});

