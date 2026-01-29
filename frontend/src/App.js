import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { ThemeProvider } from './context/ThemeContext';
import { CurrencyProvider } from './context/CurrencyContext';
import ProductsPage from './pages/ProductsPage';
import ProductListingPage from './pages/ProductListingPage';
import ProductDetailsPage from './pages/ProductDetailsPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import OrdersPage from './pages/OrdersPage';
import OrderDetailPage from './pages/OrderDetailPage';
import InvoicePage from './pages/InvoicePage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import ProfilePage from './pages/ProfilePage';
import AddressesPage from './pages/AddressesPage';
import VendorsPage from './pages/VendorsPage';
import CategoriesPage from './pages/CategoriesPage';
import UsersPage from './pages/UsersPage';
import StatesPage from './pages/StatesPage';
import WeightUnitsPage from './pages/WeightUnitsPage';
import SizesPage from './pages/SizesPage';
import BrandsPage from './pages/BrandsPage';
import PincodesPage from './pages/PincodesPage';
import CurrencySettingsPage from './pages/CurrencySettingsPage';
import ContactSettingsPage from './pages/ContactSettingsPage';
import CustomerActivityLogsPage from './pages/CustomerActivityLogsPage';
import ErrorLogsPage from './pages/ErrorLogsPage';
import SupportRequestsPage from './pages/SupportRequestsPage';
import ActiveUsersReportPage from './pages/ActiveUsersReportPage';
import HighestSellingProductsPage from './pages/HighestSellingProductsPage';
import OrdersStatusReportPage from './pages/OrdersStatusReportPage';
import PosOrderPage from './pages/PosOrderPage';
import UnauthorizedPage from './pages/UnauthorizedPage';
import SupportPage from './pages/SupportPage';
import AdminRedirect from './components/AdminRedirect';
import DefaultRedirect from './components/DefaultRedirect';

import './App.css';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <CurrencyProvider>
          <CartProvider>
            <BrowserRouter
            future={{
              v7_startTransition: true,
              v7_relativeSplatPath: true,
            }}
          >
        <Routes>
          <Route path="/" element={<AdminRedirect><ProductListingPage /></AdminRedirect>} />
          <Route path="/products/:id" element={<AdminRedirect><ProductDetailsPage /></AdminRedirect>} />
          <Route path="/admin" element={<Navigate to="/admin/products" replace />} />
          <Route path="/admin/users" element={<UsersPage />} />
          <Route path="/admin/products" element={<ProductsPage />} />
          <Route path="/admin/vendors" element={<VendorsPage />} />
          <Route path="/admin/categories" element={<CategoriesPage />} />
          <Route path="/admin/states" element={<StatesPage />} />
          <Route path="/admin/weight-units" element={<WeightUnitsPage />} />
          <Route path="/admin/sizes" element={<SizesPage />} />
          <Route path="/admin/brands" element={<BrandsPage />} />
          <Route path="/admin/pincodes" element={<PincodesPage />} />
          <Route path="/admin/currencies" element={<CurrencySettingsPage />} />
          <Route path="/admin/contact-settings" element={<ContactSettingsPage />} />
          <Route path="/admin/customer-activity-logs" element={<CustomerActivityLogsPage />} />
          <Route path="/admin/error-logs" element={<ErrorLogsPage />} />
          <Route path="/admin/support-requests" element={<SupportRequestsPage />} />
          <Route path="/admin/reports/active-users" element={<ActiveUsersReportPage />} />
          <Route path="/admin/reports/highest-selling-products" element={<HighestSellingProductsPage />} />
          <Route path="/admin/reports/orders-status" element={<OrdersStatusReportPage />} />
          <Route path="/admin/orders" element={<OrdersPage />} />
          <Route path="/admin/pos" element={<PosOrderPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/orders/:id" element={<OrderDetailPage />} />
          <Route path="/admin/orders/:id" element={<OrderDetailPage />} />
          <Route path="/invoices/:id" element={<InvoicePage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/addresses" element={<AddressesPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/support" element={<SupportPage />} />
          <Route path="/unauthorized" element={<UnauthorizedPage />} />
          <Route path="*" element={<DefaultRedirect />} />
        </Routes>
          </BrowserRouter>
          </CartProvider>
        </CurrencyProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
