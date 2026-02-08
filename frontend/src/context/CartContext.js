import { createContext, useContext, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';
import api from '../api/client';

const CartContext = createContext(null);

const GUEST_CART_KEY = 'guest_cart';

const getGuestCart = () => {
  try {
    const cart = localStorage.getItem(GUEST_CART_KEY);
    return cart ? JSON.parse(cart) : { items: [] };
  } catch {
    return { items: [] };
  }
};

const saveGuestCart = (cart) => {
  try {
    localStorage.setItem(GUEST_CART_KEY, JSON.stringify(cart));
  } catch (error) {
    console.error('Failed to save guest cart:', error);
  }
};

const getGuestCartCount = () => {
  const cart = getGuestCart();
  return cart.items?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0;
};

export const CartProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  const [cartCount, setCartCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const isAdminPath = location.pathname.startsWith('/admin') || location.pathname.startsWith('/backend');

  const fetchCartCount = async () => {
    if (!isAuthenticated) {
      const count = getGuestCartCount();
      setCartCount(count);
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.get('/cart');
      const count = data?.data?.items?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0;
      setCartCount(count);
    } catch (error) {
      setCartCount(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdminPath) {
      setCartCount(0);
      return;
    }
    if (isAuthenticated) {
      const timer = setTimeout(() => fetchCartCount(), 500);
      return () => clearTimeout(timer);
    }
    fetchCartCount();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, isAdminPath]);

  // Also listen for custom event to refresh cart after merge
  useEffect(() => {
    const handleCartRefresh = () => {
      if (isAuthenticated && !isAdminPath) {
        fetchCartCount();
      }
    };
    window.addEventListener('cart:refresh', handleCartRefresh);
    return () => window.removeEventListener('cart:refresh', handleCartRefresh);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, isAdminPath]);

  const refreshCart = () => {
    fetchCartCount();
  };

  const value = {
    cartCount,
    refreshCart,
    loading,
    getGuestCart,
    saveGuestCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

