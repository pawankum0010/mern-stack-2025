import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import SignupPage from '../SignupPage';
import { AuthProvider } from '../../context/AuthContext';
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
  Link: ({ children, ...props }) => <a {...props}>{children}</a>,
}));

const renderWithProviders = (component) => {
  return render(
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthProvider>
        {component}
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('SignupPage', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
    mockNavigate.mockClear();
  });

  it('should render signup form', () => {
    renderWithProviders(<SignupPage />);
    
    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password\s*\*/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^pincode/i)).toBeInTheDocument();
  });

  it('should validate pincode field - only 6 digits', async () => {
    renderWithProviders(<SignupPage />);
    
    const pincodeInput = screen.getByLabelText(/^pincode/i);
    
    // Try to enter more than 6 digits
    fireEvent.change(pincodeInput, { target: { value: '1234567890' } });
    expect(pincodeInput.value).toBe('123456');
    
    // Try to enter non-digits
    fireEvent.change(pincodeInput, { target: { value: 'abc123' } });
    expect(pincodeInput.value).toBe('123');
  });

  it('should validate phone field - only 10 digits', async () => {
    renderWithProviders(<SignupPage />);
    
    const phoneInput = screen.getByLabelText(/^phone$/i);
    
    // Try to enter more than 10 digits
    fireEvent.change(phoneInput, { target: { value: '123456789012345' } });
    expect(phoneInput.value).toBe('1234567890');
    
    // Try to enter non-digits
    fireEvent.change(phoneInput, { target: { value: 'abc123' } });
    expect(phoneInput.value).toBe('123');
  });

  it('should require pincode field', async () => {
    renderWithProviders(<SignupPage />);
    
    const pincodeInput = screen.getByLabelText(/^pincode/i);
    expect(pincodeInput).toBeRequired();
  });

  it('should submit form with pincode', async () => {
    api.post.mockResolvedValue({
      data: {
        data: {
          token: 'test-token',
          user: { _id: '1', email: 'test@test.com' },
        },
      },
    });

    renderWithProviders(<SignupPage />);
    
    fireEvent.change(screen.getByLabelText(/full name/i), {
      target: { value: 'Test User' },
    });
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@test.com' },
    });
    fireEvent.change(screen.getByLabelText(/^password\s*\*/i), {
      target: { value: 'password123' },
    });
    fireEvent.change(screen.getByLabelText(/confirm password/i), {
      target: { value: 'password123' },
    });
    fireEvent.change(screen.getByLabelText(/^phone$/i), {
      target: { value: '1234567890' },
    });
    fireEvent.change(screen.getByLabelText(/^pincode/i), {
      target: { value: '123456' },
    });

    const submitButton = screen.getByRole('button', { name: /sign up/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith(
        '/auth/register',
        expect.objectContaining({
          pincode: '123456',
        })
      );
    });
  });

  it('should show error if pincode is missing', async () => {
    renderWithProviders(<SignupPage />);
    
    fireEvent.change(screen.getByLabelText(/full name/i), {
      target: { value: 'Test User' },
    });
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@test.com' },
    });
    fireEvent.change(screen.getByLabelText(/^password\s*\*/i), {
      target: { value: 'password123' },
    });
    fireEvent.change(screen.getByLabelText(/confirm password/i), {
      target: { value: 'password123' },
    });

    api.post.mockRejectedValue({
      response: {
        data: {
          message: 'Postal code is required',
        },
      },
    });

    const submitButton = screen.getByRole('button', { name: /sign up/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/postal code is required/i)).toBeInTheDocument();
    });
  });
});

