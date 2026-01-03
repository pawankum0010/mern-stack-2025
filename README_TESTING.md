# Testing Guide for Soft Chilli eCommerce

This guide explains how to run and write tests for the application.

## Prerequisites

The testing setup is already configured with:
- **Jest** - JavaScript testing framework
- **React Testing Library** - For testing React components
- **@testing-library/user-event** - For simulating user interactions

## Running Tests

### Run All Tests
```bash
cd frontend
npm test
```

### Run Tests in Watch Mode
```bash
npm test
```
This will run tests in watch mode, automatically re-running when files change.

### Run Tests Once (CI Mode)
```bash
CI=true npm test
```

### Run Specific Test File
```bash
npm test ThemeContext.test.js
```

### Run Tests with Coverage
```bash
npm test -- --coverage
```

## Test Files Structure

```
frontend/src/
├── context/
│   └── __tests__/
│       ├── ThemeContext.test.js
│       ├── CartContext.test.js
│       └── AuthContext.test.js
├── components/
│   └── __tests__/
│       ├── AppNavbar.test.jsx
│       └── ProtectedRoute.test.jsx
├── pages/
│   └── __tests__/
│       └── ProductListingPage.test.jsx
├── api/
│   └── __tests__/
│       ├── productApi.test.js
│       ├── orderApi.test.js
│       ├── cartApi.test.js
│       └── addressApi.test.js
└── utils/
    └── __tests__/
        ├── productUtils.test.js
        ├── orderUtils.test.js
        └── addressUtils.test.js
```

## What's Being Tested

### 1. ThemeContext Tests (`ThemeContext.test.js`)
- ✅ Theme initialization (light/dark mode)
- ✅ Theme persistence in localStorage
- ✅ Theme toggle functionality
- ✅ Error handling when used outside provider

**Run this test:**
```bash
npm test ThemeContext.test.js
```

### 2. CartContext Tests (`CartContext.test.js`)
- ✅ Cart initialization
- ✅ Loading cart from API
- ✅ Guest cart from localStorage
- ✅ Adding items to cart
- ✅ Refreshing cart count
- ✅ Error handling

**Run this test:**
```bash
npm test CartContext.test.js
```

### 3. AppNavbar Tests (`AppNavbar.test.jsx`)
- ✅ Logo rendering
- ✅ Navigation links
- ✅ Dark mode toggle button
- ✅ Theme toggle functionality
- ✅ Login/Signup buttons visibility

**Run this test:**
```bash
npm test AppNavbar.test.jsx
```

### 4. Product API Tests (`productApi.test.js`)
- ✅ Fetch products
- ✅ Get product by ID
- ✅ Create product
- ✅ Update product
- ✅ Delete product
- ✅ Error handling

**Run this test:**
```bash
npm test productApi.test.js
```

### 5. Product Utilities Tests (`productUtils.test.js`)
- ✅ Price calculations (discount, subtotal, total)
- ✅ Image URL handling
- ✅ Stock validation
- ✅ Category/Vendor handling
- ✅ Tags processing

**Run this test:**
```bash
npm test productUtils.test.js
```

### 6. AuthContext Tests (`AuthContext.test.js`)
- ✅ Authentication initialization
- ✅ Login functionality
- ✅ Logout functionality
- ✅ Guest cart merging on login
- ✅ Error handling
- ✅ localStorage persistence

**Run this test:**
```bash
npm test AuthContext.test.js
```

### 7. ProtectedRoute Tests (`ProtectedRoute.test.jsx`)
- ✅ Redirect to login when not authenticated
- ✅ Allow access when authenticated
- ✅ Role-based access control
- ✅ Case-insensitive role matching
- ✅ String and object role handling

**Run this test:**
```bash
npm test ProtectedRoute.test.jsx
```

### 8. Order API Tests (`orderApi.test.js`)
- ✅ Create order
- ✅ Get orders list
- ✅ Get order by ID
- ✅ Update order status
- ✅ Error handling

**Run this test:**
```bash
npm test orderApi.test.js
```

### 9. Cart API Tests (`cartApi.test.js`)
- ✅ Get cart
- ✅ Add to cart
- ✅ Update cart item
- ✅ Remove from cart
- ✅ Clear cart
- ✅ Error handling

**Run this test:**
```bash
npm test cartApi.test.js
```

### 10. Address API Tests (`addressApi.test.js`)
- ✅ Get addresses
- ✅ Create address
- ✅ Update address
- ✅ Delete address
- ✅ Set default address

**Run this test:**
```bash
npm test addressApi.test.js
```

### 11. Order Utilities Tests (`orderUtils.test.js`)
- ✅ Order status validation
- ✅ Order number generation
- ✅ Order total calculation
- ✅ Date formatting
- ✅ Invoice number generation
- ✅ Status transitions

**Run this test:**
```bash
npm test orderUtils.test.js
```

### 12. Address Utilities Tests (`addressUtils.test.js`)
- ✅ Address validation
- ✅ Default address management
- ✅ Address formatting
- ✅ Address label validation

**Run this test:**
```bash
npm test addressUtils.test.js
```

### 13. ProductListingPage Tests (`ProductListingPage.test.jsx`)
- ✅ Loading state
- ✅ Display products
- ✅ Empty state
- ✅ Navigation to product details
- ✅ Product filtering

**Run this test:**
```bash
npm test ProductListingPage.test.jsx
```

## Writing New Tests

### Example: Testing a Component

```javascript
import { render, screen, fireEvent } from '@testing-library/react';
import MyComponent from '../MyComponent';

describe('MyComponent', () => {
  it('should render correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('should handle user interaction', () => {
    render(<MyComponent />);
    const button = screen.getByRole('button');
    fireEvent.click(button);
    expect(screen.getByText('Clicked')).toBeInTheDocument();
  });
});
```

### Example: Testing a Context

```javascript
import { render, screen } from '@testing-library/react';
import { MyContextProvider, useMyContext } from '../MyContext';

const TestComponent = () => {
  const { value } = useMyContext();
  return <div>{value}</div>;
};

describe('MyContext', () => {
  it('should provide context value', () => {
    render(
      <MyContextProvider>
        <TestComponent />
      </MyContextProvider>
    );
    expect(screen.getByText('expected value')).toBeInTheDocument();
  });
});
```

## Test Coverage

To see test coverage report:

```bash
npm test -- --coverage
```

This will generate a coverage report showing:
- Which files are tested
- Line coverage percentage
- Branch coverage
- Function coverage

## Best Practices

1. **Test Behavior, Not Implementation**
   - Test what the component does, not how it does it
   - Focus on user interactions and outcomes

2. **Use Descriptive Test Names**
   ```javascript
   // Good
   it('should display error message when API call fails', () => {});
   
   // Bad
   it('test error', () => {});
   ```

3. **Keep Tests Isolated**
   - Each test should be independent
   - Use `beforeEach` to set up clean state

4. **Mock External Dependencies**
   - Mock API calls
   - Mock localStorage
   - Mock router

5. **Test Edge Cases**
   - Empty states
   - Error states
   - Loading states
   - Invalid inputs

## Common Testing Patterns

### Testing API Calls
```javascript
jest.mock('../api/client');
import api from '../api/client';

it('should fetch data', async () => {
  api.get.mockResolvedValue({ data: { items: [] } });
  // ... test code
});
```

### Testing localStorage
```javascript
beforeEach(() => {
  localStorage.clear();
});

it('should save to localStorage', () => {
  localStorage.setItem('key', 'value');
  expect(localStorage.getItem('key')).toBe('value');
});
```

### Testing User Events
```javascript
import userEvent from '@testing-library/user-event';

it('should handle input', async () => {
  const user = userEvent.setup();
  const input = screen.getByRole('textbox');
  await user.type(input, 'test');
  expect(input).toHaveValue('test');
});
```

## Troubleshooting

### Tests not running?
- Make sure you're in the `frontend` directory
- Run `npm install` if dependencies are missing

### Tests failing?
- Check the error message in the terminal
- Make sure mocks are set up correctly
- Verify component props and context providers

### Coverage not showing?
- Make sure you're using the `--coverage` flag
- Check that test files are in the correct location

## Common Issues and Fixes

### Issue: "Cannot use import statement outside a module"
**Fix:** Make sure to mock the API client before importing components that use it:
```javascript
jest.mock('../../api/client', () => ({
  __esModule: true,
  default: { /* mock axios instance */ },
  setAuthToken: jest.fn(),
}));
```

### Issue: "setAuthToken is not a function"
**Fix:** Include `setAuthToken` in your API client mock:
```javascript
jest.mock('../../api/client', () => ({
  __esModule: true,
  default: { /* ... */ },
  setAuthToken: jest.fn(), // Add this
}));
```

### Issue: Async tests not waiting properly
**Fix:** Use `waitFor` with proper async handling:
```javascript
await waitFor(() => {
  expect(screen.getByTestId('element')).toHaveTextContent('expected');
}, { timeout: 3000 });
```

### 14. Pincode Management Tests (To Be Added)
- ✅ Pincode API endpoints
- ✅ Pincode validation
- ✅ Shipping charge calculation
- ✅ Notification system
- ✅ Admin pincode management page
- ✅ Customer signup with pincode

**Test files to create:**
- `frontend/src/api/__tests__/pincodeApi.test.js`
- `frontend/src/pages/__tests__/PincodesPage.test.jsx`
- `frontend/src/pages/__tests__/SignupPage.test.jsx` (update for pincode field)

## Next Steps

Consider adding tests for:
- ✅ Pincode management (API and UI)
- ✅ Customer signup with pincode validation
- Product listing page
- Product details page
- Checkout flow
- Order management
- Authentication flow

Happy Testing! 🧪

