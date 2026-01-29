# Currency System Implementation Guide

## Overview
The currency management system has been implemented to allow admins to configure and manage multiple currencies for the eCommerce platform.

## Backend Implementation

### Files Created:
1. **`demobackend/src/models/currency.model.js`** - Currency model with fields:
   - `code`: 3-letter ISO code (e.g., USD, INR, EUR)
   - `name`: Full currency name
   - `symbol`: Currency symbol ($, ₹, €, etc.)
   - `position`: 'before' or 'after' the amount
   - `decimalPlaces`: Number of decimal places (0-4)
   - `isDefault`: Boolean flag for default currency
   - `isActive`: Boolean flag for active status

2. **`demobackend/src/controllers/currency.controller.js`** - Controller with CRUD operations:
   - `getAllCurrencies` - Get all currencies (admin only)
   - `getActiveCurrencies` - Get active currencies (public)
   - `getDefaultCurrency` - Get default currency (public)
   - `createCurrency` - Create new currency
   - `updateCurrency` - Update existing currency
   - `deleteCurrency` - Delete currency
   - `setDefaultCurrency` - Set default currency

3. **`demobackend/src/routes/currency.routes.js`** - Routes:
   - `GET /api/currencies/active` - Public route
   - `GET /api/currencies/default` - Public route
   - `GET /api/currencies` - Admin only
   - `POST /api/currencies` - Admin only
   - `PUT /api/currencies/:id` - Admin only
   - `DELETE /api/currencies/:id` - Admin only
   - `PATCH /api/currencies/:id/set-default` - Admin only

## Frontend Implementation

### Files Created:
1. **`frontend/src/context/CurrencyContext.js`** - Currency context provider:
   - Fetches default currency on mount
   - Provides `formatPrice()` function
   - Updates currency when changed

2. **`frontend/src/pages/CurrencySettingsPage.jsx`** - Admin page for managing currencies:
   - List all currencies
   - Add/Edit/Delete currencies
   - Set default currency
   - Popular currencies quick-select

3. **`frontend/src/utils/formatPrice.js`** - Utility function for formatting prices

### Files Updated:
1. **`frontend/src/App.js`** - Added CurrencyProvider wrapper
2. **`frontend/src/components/AppNavbar.jsx`** - Added "Currencies" link in Master dropdown
3. **`frontend/src/components/ProductCard.jsx`** - Updated to use `formatPrice()`
4. **`frontend/src/pages/ProductDetailsPage.jsx`** - Updated to use `formatPrice()`
5. **`frontend/src/pages/CartPage.jsx`** - Updated to use `formatPrice()`

### Files Still Need Update:
The following files still need to be updated to use `formatPrice()`:
- `frontend/src/pages/CheckoutPage.jsx`
- `frontend/src/pages/OrdersPage.jsx`
- `frontend/src/pages/OrderDetailPage.jsx`
- `frontend/src/pages/ProductsPage.jsx`
- `frontend/src/pages/PincodesPage.jsx`

## How to Use

### For Admins:
1. Navigate to **Admin Panel → Master → Currencies**
2. Click **"+ Add Currency"** to add a new currency
3. Use popular currencies quick-select or enter manually
4. Set one currency as default
5. All prices will automatically update across the site

### For Developers:
```javascript
import { useCurrency } from '../context/CurrencyContext';

const MyComponent = () => {
  const { formatPrice, currency } = useCurrency();
  
  return (
    <div>
      <p>Price: {formatPrice(100.50)}</p>
      <p>Current currency: {currency.code}</p>
    </div>
  );
};
```

## Popular Currencies Included:
- USD - US Dollar ($)
- INR - Indian Rupee (₹)
- EUR - Euro (€)
- GBP - British Pound (£)
- JPY - Japanese Yen (¥)
- AUD - Australian Dollar (A$)
- CAD - Canadian Dollar (C$)
- CNY - Chinese Yuan (¥)
- AED - UAE Dirham (د.إ)
- SGD - Singapore Dollar (S$)

## Next Steps:
1. Update remaining pages to use `formatPrice()`
2. Add currency conversion rates (optional)
3. Add currency selector for customers (optional)
4. Seed initial currencies in database

