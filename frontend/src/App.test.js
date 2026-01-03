import { render, screen } from '@testing-library/react';
import App from './App';

// Mock the API client to avoid axios interceptor issues
jest.mock('./api/client', () => {
  const mockApi = {
    get: jest.fn(() => Promise.resolve({ data: {} })),
    post: jest.fn(() => Promise.resolve({ data: {} })),
    put: jest.fn(() => Promise.resolve({ data: {} })),
    delete: jest.fn(() => Promise.resolve({ data: {} })),
    defaults: {
      baseURL: 'http://localhost:5000/api',
    },
  };
  return {
    __esModule: true,
    default: mockApi,
    setAuthToken: jest.fn(),
  };
});

test('renders app without crashing', () => {
  render(<App />);
  // Just check that the app renders without crashing
  expect(screen).toBeTruthy();
});
