import { render, screen, waitFor, act, fireEvent } from '@testing-library/react';
import { AuthProvider, useAuth } from '../AuthContext';
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

// Test component that uses auth
const TestComponent = () => {
  const { user, isAuthenticated, loading, authError, login, logout } = useAuth();

  const handleLogin = async () => {
    try {
      await login({ email: 'test@test.com', password: 'password' });
    } catch (error) {
      // Error is handled by context
    }
  };

  return (
    <div>
      <div data-testid="is-authenticated">{isAuthenticated ? 'true' : 'false'}</div>
      <div data-testid="user">{user ? user.email : 'null'}</div>
      <div data-testid="loading">{loading ? 'true' : 'false'}</div>
      <div data-testid="auth-error">{authError || 'null'}</div>
      <button onClick={handleLogin} data-testid="login-btn">
        Login
      </button>
      <button onClick={logout} data-testid="logout-btn">
        Logout
      </button>
    </div>
  );
};

describe('AuthContext', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  it('should initialize with no user when no auth in localStorage', () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(screen.getByTestId('is-authenticated')).toHaveTextContent('false');
    expect(screen.getByTestId('user')).toHaveTextContent('null');
  });

  it('should load user from localStorage on mount', () => {
    const mockUser = { _id: '123', email: 'saved@test.com', name: 'Saved User' };
    localStorage.setItem('auth', JSON.stringify({
      token: 'saved-token',
      user: mockUser,
    }));

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(screen.getByTestId('is-authenticated')).toHaveTextContent('true');
    expect(screen.getByTestId('user')).toHaveTextContent('saved@test.com');
  });

  it('should login successfully', async () => {
    const mockResponse = {
      data: {
        data: {
          token: 'test-token',
          user: { _id: '123', email: 'test@test.com', name: 'Test User' },
        },
      },
    };

    api.post.mockResolvedValue(mockResponse);
    api.post.mockResolvedValueOnce(mockResponse); // For login
    api.post.mockResolvedValue({}); // For cart merge calls

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    const loginButton = screen.getByTestId('login-btn');
    
    await act(async () => {
      fireEvent.click(loginButton);
    });

    await waitFor(() => {
      expect(screen.getByTestId('is-authenticated')).toHaveTextContent('true');
    });

    expect(screen.getByTestId('user')).toHaveTextContent('test@test.com');
    expect(localStorage.getItem('auth')).toBeTruthy();
    expect(api.post).toHaveBeenCalledWith('/auth/login', {
      email: 'test@test.com',
      password: 'password',
    });
  });

  it('should handle login errors', async () => {
    const error = new Error('Invalid credentials');
    api.post.mockRejectedValue(error);

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    const loginButton = screen.getByTestId('login-btn');
    
    // Click login button
    await act(async () => {
      fireEvent.click(loginButton);
    });

    // Wait for error message to appear in the UI
    await waitFor(() => {
      const errorElement = screen.getByTestId('auth-error');
      expect(errorElement.textContent).not.toBe('null');
      expect(errorElement.textContent).toContain('Invalid credentials');
    }, { timeout: 3000 });

    expect(screen.getByTestId('is-authenticated')).toHaveTextContent('false');
  });

  it('should logout successfully', async () => {
    // Set up authenticated user
    localStorage.setItem('auth', JSON.stringify({
      token: 'test-token',
      user: { _id: '123', email: 'test@test.com' },
    }));

    api.post.mockResolvedValue({});

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(screen.getByTestId('is-authenticated')).toHaveTextContent('true');

    const logoutButton = screen.getByTestId('logout-btn');
    
    await act(async () => {
      fireEvent.click(logoutButton);
    });

    await waitFor(() => {
      expect(screen.getByTestId('is-authenticated')).toHaveTextContent('false');
    });

    expect(localStorage.getItem('auth')).toBeNull();
  });

  it('should merge guest cart after login', async () => {
    const guestCart = {
      items: [
        { productId: 'prod1', quantity: 2 },
        { productId: 'prod2', quantity: 1 },
      ],
    };
    localStorage.setItem('guest_cart', JSON.stringify(guestCart));

    const mockResponse = {
      data: {
        data: {
          token: 'test-token',
          user: { _id: '123', email: 'test@test.com' },
        },
      },
    };

    api.post
      .mockResolvedValueOnce(mockResponse) // Login call
      .mockResolvedValue({}); // Cart merge calls

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    const loginButton = screen.getByTestId('login-btn');
    
    await act(async () => {
      fireEvent.click(loginButton);
    });

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/cart/add', {
        productId: 'prod1',
        quantity: 2,
      });
    });

    // Guest cart should be cleared
    expect(localStorage.getItem('guest_cart')).toBeNull();
  });

  it('should throw error when useAuth is used outside AuthProvider', () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      render(<TestComponent />);
    }).toThrow('useAuth must be used within an AuthProvider');

    consoleError.mockRestore();
  });
});

