import { render, screen } from '@testing-library/react';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import ProtectedRoute from '../ProtectedRoute';
import { AuthProvider } from '../../context/AuthContext';

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

const TestPage = () => <div>Protected Content</div>;

const renderWithRouter = (component, initialEntries = ['/']) => {
  return render(
    <MemoryRouter initialEntries={initialEntries} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthProvider>
        {component}
      </AuthProvider>
    </MemoryRouter>
  );
};

describe('ProtectedRoute', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should redirect to login when not authenticated', () => {
    renderWithRouter(
      <ProtectedRoute>
        <TestPage />
      </ProtectedRoute>
    );

    // Should redirect to login, so protected content should not be visible
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('should render children when authenticated', () => {
    localStorage.setItem('auth', JSON.stringify({
      token: 'test-token',
      user: { _id: '123', email: 'test@test.com' },
    }));

    renderWithRouter(
      <ProtectedRoute>
        <TestPage />
      </ProtectedRoute>
    );

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('should allow access when user has required role', () => {
    localStorage.setItem('auth', JSON.stringify({
      token: 'test-token',
      user: {
        _id: '123',
        email: 'admin@test.com',
        role: { name: 'admin' },
      },
    }));

    renderWithRouter(
      <ProtectedRoute roles={['admin', 'superadmin']}>
        <TestPage />
      </ProtectedRoute>
    );

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('should redirect to unauthorized when user lacks required role', () => {
    localStorage.setItem('auth', JSON.stringify({
      token: 'test-token',
      user: {
        _id: '123',
        email: 'customer@test.com',
        role: { name: 'customer' },
      },
    }));

    renderWithRouter(
      <ProtectedRoute roles={['admin', 'superadmin']}>
        <TestPage />
      </ProtectedRoute>
    );

    // Should redirect to unauthorized
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('should handle role as string', () => {
    localStorage.setItem('auth', JSON.stringify({
      token: 'test-token',
      user: {
        _id: '123',
        email: 'admin@test.com',
        role: 'admin',
      },
    }));

    renderWithRouter(
      <ProtectedRoute roles={['admin']}>
        <TestPage />
      </ProtectedRoute>
    );

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('should handle case-insensitive role matching', () => {
    localStorage.setItem('auth', JSON.stringify({
      token: 'test-token',
      user: {
        _id: '123',
        email: 'admin@test.com',
        role: { name: 'ADMIN' },
      },
    }));

    renderWithRouter(
      <ProtectedRoute roles={['admin']}>
        <TestPage />
      </ProtectedRoute>
    );

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });
});

