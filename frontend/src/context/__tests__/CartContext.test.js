import { render, screen, act, waitFor, fireEvent } from '@testing-library/react';
import { CartProvider, useCart } from '../CartContext';
import { AuthProvider } from '../AuthContext';
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

// Test component that uses the cart
const TestComponent = () => {
  const { cartCount, refreshCart, getGuestCart, saveGuestCart } = useCart();

  return (
    <div>
      <div data-testid="cart-count">{cartCount}</div>
      <button onClick={refreshCart} data-testid="refresh-cart">
        Refresh Cart
      </button>
      <button
        onClick={() => {
          const cart = getGuestCart();
          cart.items.push({ productId: 'guest123', quantity: 1 });
          saveGuestCart(cart);
          refreshCart();
        }}
        data-testid="add-guest-cart"
      >
        Add Guest Cart
      </button>
    </div>
  );
};

describe('CartContext', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  it('should initialize with cart count 0', () => {
    api.get.mockResolvedValue({ data: { data: { items: [] } } });

    render(
      <AuthProvider>
        <CartProvider>
          <TestComponent />
        </CartProvider>
      </AuthProvider>
    );

    expect(screen.getByTestId('cart-count')).toHaveTextContent('0');
  });

  it('should load cart count from API when authenticated', async () => {
    // Set up authenticated user
    localStorage.setItem('auth', JSON.stringify({
      token: 'test-token',
      user: { _id: '123', email: 'test@test.com' }
    }));

    const mockCart = {
      items: [
        { productId: '1', quantity: 2 },
        { productId: '2', quantity: 1 },
      ],
    };

    api.get.mockResolvedValue({ data: { data: mockCart } });

    render(
      <AuthProvider>
        <CartProvider>
          <TestComponent />
        </CartProvider>
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('cart-count')).toHaveTextContent('3');
    });
  });

  it('should load guest cart from localStorage', () => {
    const guestCart = {
      items: [
        { productId: 'guest1', quantity: 2 },
        { productId: 'guest2', quantity: 1 },
      ],
    };
    localStorage.setItem('guest_cart', JSON.stringify(guestCart));

    render(
      <AuthProvider>
        <CartProvider>
          <TestComponent />
        </CartProvider>
      </AuthProvider>
    );

    expect(screen.getByTestId('cart-count')).toHaveTextContent('3');
  });

  it('should add item to guest cart', () => {
    render(
      <AuthProvider>
        <CartProvider>
          <TestComponent />
        </CartProvider>
      </AuthProvider>
    );

    act(() => {
      screen.getByTestId('add-guest-cart').click();
    });

    const savedCart = JSON.parse(localStorage.getItem('guest_cart'));
    expect(savedCart.items).toHaveLength(1);
    expect(savedCart.items[0].productId).toBe('guest123');
  });

  it('should save guest cart to localStorage', () => {
    render(
      <AuthProvider>
        <CartProvider>
          <TestComponent />
        </CartProvider>
      </AuthProvider>
    );

    act(() => {
      screen.getByTestId('add-guest-cart').click();
    });

    expect(localStorage.getItem('guest_cart')).toBeTruthy();
    const cart = JSON.parse(localStorage.getItem('guest_cart'));
    expect(cart.items).toHaveLength(1);
  });

  it('should refresh cart count', async () => {
    // Set up authenticated user
    localStorage.setItem('auth', JSON.stringify({
      token: 'test-token',
      user: { _id: '123', email: 'test@test.com' }
    }));

    // First call for initial load, second for refresh
    api.get
      .mockResolvedValueOnce({ data: { data: { items: [] } } })
      .mockResolvedValueOnce({
        data: { data: { items: [{ productId: '1', quantity: 5 }] } },
      });

    render(
      <AuthProvider>
        <CartProvider>
          <TestComponent />
        </CartProvider>
      </AuthProvider>
    );

    // Wait for initial load to complete
    await waitFor(() => {
      expect(screen.getByTestId('cart-count')).toHaveTextContent('0');
    }, { timeout: 2000 });

    // Ensure API was called for initial load
    expect(api.get).toHaveBeenCalledWith('/cart');

    // Clear previous calls to track refresh call
    jest.clearAllMocks();
    api.get.mockResolvedValueOnce({
      data: { data: { items: [{ productId: '1', quantity: 5 }] } },
    });

    // Click refresh button
    const refreshButton = screen.getByTestId('refresh-cart');
    fireEvent.click(refreshButton);

    // Wait for cart count to update after refresh
    await waitFor(() => {
      expect(screen.getByTestId('cart-count')).toHaveTextContent('5');
    }, { timeout: 3000 });

    // Verify API was called for refresh
    expect(api.get).toHaveBeenCalledWith('/cart');
  });

  it('should handle API errors gracefully', async () => {
    api.get.mockRejectedValue(new Error('Network error'));

    render(
      <AuthProvider>
        <CartProvider>
          <TestComponent />
        </CartProvider>
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('cart-count')).toHaveTextContent('0');
    });
  });
});

