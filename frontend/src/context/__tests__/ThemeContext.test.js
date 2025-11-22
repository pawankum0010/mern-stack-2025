import { render, screen, act } from '@testing-library/react';
import { ThemeProvider, useTheme } from '../ThemeContext';

// Test component that uses the theme
const TestComponent = () => {
  const { isDarkMode, toggleTheme } = useTheme();
  return (
    <div>
      <div data-testid="theme-status">{isDarkMode ? 'dark' : 'light'}</div>
      <button onClick={toggleTheme} data-testid="toggle-theme">
        Toggle Theme
      </button>
    </div>
  );
};

describe('ThemeContext', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    // Reset document classes
    document.body.className = '';
    document.documentElement.removeAttribute('data-theme');
  });

  it('should default to light mode when no preference is saved', () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    expect(screen.getByTestId('theme-status')).toHaveTextContent('light');
    expect(document.body).toHaveClass('light-mode');
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
  });

  it('should load dark mode from localStorage', () => {
    localStorage.setItem('theme', 'dark');

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    expect(screen.getByTestId('theme-status')).toHaveTextContent('dark');
    expect(document.body).toHaveClass('dark-mode');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });

  it('should toggle from light to dark mode', () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    expect(screen.getByTestId('theme-status')).toHaveTextContent('light');

    act(() => {
      screen.getByTestId('toggle-theme').click();
    });

    expect(screen.getByTestId('theme-status')).toHaveTextContent('dark');
    expect(document.body).toHaveClass('dark-mode');
    expect(localStorage.getItem('theme')).toBe('dark');
  });

  it('should toggle from dark to light mode', () => {
    localStorage.setItem('theme', 'dark');

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    expect(screen.getByTestId('theme-status')).toHaveTextContent('dark');

    act(() => {
      screen.getByTestId('toggle-theme').click();
    });

    expect(screen.getByTestId('theme-status')).toHaveTextContent('light');
    expect(document.body).toHaveClass('light-mode');
    expect(localStorage.getItem('theme')).toBe('light');
  });

  it('should persist theme preference in localStorage', () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    act(() => {
      screen.getByTestId('toggle-theme').click();
    });

    expect(localStorage.getItem('theme')).toBe('dark');

    act(() => {
      screen.getByTestId('toggle-theme').click();
    });

    expect(localStorage.getItem('theme')).toBe('light');
  });

  it('should throw error when useTheme is used outside ThemeProvider', () => {
    // Suppress console.error for this test
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      render(<TestComponent />);
    }).toThrow('useTheme must be used within a ThemeProvider');

    consoleError.mockRestore();
  });
});

