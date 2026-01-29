import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/client';

const CurrencyContext = createContext();

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};

export const CurrencyProvider = ({ children }) => {
  const [currency, setCurrency] = useState({
    code: 'USD',
    name: 'US Dollar',
    symbol: '$',
    position: 'before',
    decimalPlaces: 2,
    isDefault: true,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDefaultCurrency();
  }, []);

  const fetchDefaultCurrency = async () => {
    try {
      const { data } = await api.get('/currencies/default');
      if (data?.success && data?.data) {
        setCurrency(data.data);
      }
    } catch (error) {
      console.error('Error fetching default currency:', error);
      // Keep default USD if API fails
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (amount) => {
    if (amount === null || amount === undefined) {
      amount = 0;
    }
    
    const formattedAmount = Number(amount).toFixed(currency.decimalPlaces || 2);
    
    if (currency.position === 'after') {
      return `${formattedAmount} ${currency.symbol}`;
    } else {
      return `${currency.symbol}${formattedAmount}`;
    }
  };

  const updateCurrency = (newCurrency) => {
    setCurrency(newCurrency);
  };

  const value = {
    currency,
    loading,
    formatPrice,
    updateCurrency,
    fetchDefaultCurrency,
  };

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
};

