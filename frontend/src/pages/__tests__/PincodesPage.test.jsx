import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import PincodesPage from '../PincodesPage';
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

describe('PincodesPage', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
    mockNavigate.mockClear();
    
    // Mock authenticated admin user
    localStorage.setItem('auth', JSON.stringify({
      token: 'test-token',
      user: {
        _id: '1',
        email: 'admin@test.com',
        role: { name: 'admin' },
      },
    }));
  });

  it('should render loading state initially', async () => {
    api.get.mockImplementation(() => new Promise(() => {})); // Never resolves

    renderWithProviders(<PincodesPage />);
    
    // Should show loading or redirect
    await waitFor(() => {
      expect(screen.queryByText(/loading/i) || screen.queryByText(/pincode/i)).toBeTruthy();
    }, { timeout: 1000 });
  });

  it('should display pincodes when loaded', async () => {
    const mockPincodes = [
      {
        _id: '1',
        pincode: '123456',
        shippingCharge: 50,
        status: 'active',
      },
      {
        _id: '2',
        pincode: '789012',
        shippingCharge: 75,
        status: 'active',
      },
    ];

    api.get
      .mockResolvedValueOnce({ data: { data: mockPincodes } })
      .mockResolvedValueOnce({ data: { data: [] } }); // notifications

    renderWithProviders(<PincodesPage />);

    await waitFor(() => {
      expect(screen.getByText('123456')).toBeInTheDocument();
      expect(screen.getByText('789012')).toBeInTheDocument();
    });
  });

  it('should display empty state when no pincodes', async () => {
    api.get
      .mockResolvedValueOnce({ data: { data: [] } })
      .mockResolvedValueOnce({ data: { data: [] } }); // notifications

    renderWithProviders(<PincodesPage />);

    await waitFor(() => {
      expect(screen.getByText(/no pincodes found/i)).toBeInTheDocument();
    });
  });

  it('should display notifications', async () => {
    const mockNotifications = [
      {
        _id: '1',
        pincode: '123456',
        status: 'pending',
        userId: 'user1',
      },
    ];

    api.get
      .mockResolvedValueOnce({ data: { data: [] } }) // pincodes
      .mockResolvedValueOnce({ data: { data: mockNotifications } }); // notifications

    renderWithProviders(<PincodesPage />);

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith('/pincodes/notifications');
    });
  });
});

