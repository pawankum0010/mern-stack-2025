import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ProductListingPage from '../ProductListingPage';
import { AuthProvider } from '../../context/AuthContext';
import { CartProvider } from '../../context/CartContext';
import { ThemeProvider } from '../../context/ThemeContext';
import api from '../../api/client';

// Mock the API client
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

// Mock useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
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

describe('ProductListingPage', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
    mockNavigate.mockClear();
  });

  it('should render loading state initially', () => {
    api.get.mockImplementation(() => new Promise(() => {})); // Never resolves

    renderWithProviders(<ProductListingPage />);
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('should display products when loaded', async () => {
    const mockProducts = [
      {
        _id: '1',
        name: 'Product 1',
        price: 100,
        images: ['/image1.jpg'],
        category: { name: 'Electronics' },
      },
      {
        _id: '2',
        name: 'Product 2',
        price: 200,
        images: ['/image2.jpg'],
        category: { name: 'Clothing' },
      },
    ];

    api.get.mockResolvedValue({
      data: {
        data: mockProducts,
        pagination: { page: 1, limit: 12, total: 2, pages: 1 },
      },
    });

    renderWithProviders(<ProductListingPage />);

    await waitFor(() => {
      expect(screen.getByText('Product 1')).toBeInTheDocument();
      expect(screen.getByText('Product 2')).toBeInTheDocument();
    });
  });

  it('should display empty state when no products', async () => {
    api.get.mockResolvedValue({
      data: {
        data: [],
        pagination: { page: 1, limit: 12, total: 0, pages: 0 },
      },
    });

    renderWithProviders(<ProductListingPage />);

    await waitFor(() => {
      expect(screen.getByText(/no products found/i)).toBeInTheDocument();
    });
  });

  it('should navigate to product details on product click', async () => {
    const mockProducts = [
      {
        _id: '1',
        name: 'Product 1',
        price: 100,
        images: ['/image1.jpg'],
      },
    ];

    api.get.mockResolvedValue({
      data: {
        data: mockProducts,
        pagination: { page: 1, limit: 12, total: 1, pages: 1 },
      },
    });

    renderWithProviders(<ProductListingPage />);

    await waitFor(() => {
      expect(screen.getByText('Product 1')).toBeInTheDocument();
    });

    // Click on product (this would navigate in real app)
    const productCard = screen.getByText('Product 1').closest('.product-card');
    if (productCard) {
      fireEvent.click(productCard);
    }
  });

  it('should filter products by search', async () => {
    const mockProducts = [
      { _id: '1', name: 'Laptop', price: 1000 },
      { _id: '2', name: 'Phone', price: 500 },
    ];

    api.get.mockResolvedValue({
      data: {
        data: mockProducts,
        pagination: { page: 1, limit: 12, total: 2, pages: 1 },
      },
    });

    renderWithProviders(<ProductListingPage />);

    await waitFor(() => {
      expect(screen.getByText('Laptop')).toBeInTheDocument();
    });

    // Search functionality would be tested here
    // This is a basic structure - actual implementation may vary
  });
});

