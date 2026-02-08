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
import BackendLoginPage from './pages/BackendLoginPage';
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
import AdminProtectedRoute from './components/AdminProtectedRoute';
import BackendLayout from './components/BackendLayout';

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
          <Route path="/backend" element={<BackendLoginPage />} />
          <Route path="/admin" element={<AdminProtectedRoute><BackendLayout /></AdminProtectedRoute>}>
            <Route index element={<Navigate to="/admin/products" replace />} />
            <Route path="users" element={<UsersPage />} />
            <Route path="products" element={<ProductsPage />} />
            <Route path="vendors" element={<VendorsPage />} />
            <Route path="categories" element={<CategoriesPage />} />
            <Route path="states" element={<StatesPage />} />
            <Route path="weight-units" element={<WeightUnitsPage />} />
            <Route path="sizes" element={<SizesPage />} />
            <Route path="brands" element={<BrandsPage />} />
            <Route path="pincodes" element={<PincodesPage />} />
            <Route path="currencies" element={<CurrencySettingsPage />} />
            <Route path="contact-settings" element={<ContactSettingsPage />} />
            <Route path="customer-activity-logs" element={<CustomerActivityLogsPage />} />
            <Route path="error-logs" element={<ErrorLogsPage />} />
            <Route path="support-requests" element={<SupportRequestsPage />} />
            <Route path="reports/active-users" element={<ActiveUsersReportPage />} />
            <Route path="reports/highest-selling-products" element={<HighestSellingProductsPage />} />
            <Route path="reports/orders-status" element={<OrdersStatusReportPage />} />
            <Route path="orders" element={<OrdersPage />} />
            <Route path="orders/:id" element={<OrderDetailPage />} />
            <Route path="pos" element={<PosOrderPage />} />
          </Route>
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/orders/:id" element={<OrderDetailPage />} />
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
