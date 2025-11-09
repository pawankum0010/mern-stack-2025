import { createContext, useContext, useEffect, useMemo, useState } from 'react';

import api, { setAuthToken } from '../api/client';

const AuthContext = createContext(null);

const getStoredAuth = () => {
  try {
    const raw = localStorage.getItem('auth');
    if (!raw) {
      return { token: null, user: null };
    }
    const parsed = JSON.parse(raw);
    return {
      token: parsed.token || null,
      user: parsed.user || null,
    };
  } catch {
    return { token: null, user: null };
  }
};

export const AuthProvider = ({ children }) => {
  const [{ token, user }, setAuthState] = useState(() => {
    const stored = getStoredAuth();
    if (stored.token) {
      setAuthToken(stored.token);
    }
    return stored;
  });
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    if (token) {
      setAuthToken(token);
    }
  }, [token]);

  const persistAuth = (nextState) => {
    setAuthState(nextState);
    if (nextState.token) {
      localStorage.setItem('auth', JSON.stringify(nextState));
      setAuthToken(nextState.token);
    } else {
      localStorage.removeItem('auth');
      setAuthToken(null);
    }
  };

  const login = async (credentials) => {
    setLoading(true);
    setAuthError(null);
    try {
      const { data } = await api.post('/auth/login', credentials);
      persistAuth({
        token: data?.data?.token,
        user: data?.data?.user,
      });
      return data;
    } catch (error) {
      setAuthError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      if (token) {
        await api.post('/auth/logout');
      }
    } catch (error) {
      console.warn('Logout error', error.message);
    } finally {
      persistAuth({ token: null, user: null });
    }
  };

  const value = useMemo(
    () => ({
      token,
      user,
      isAuthenticated: Boolean(token),
      loading,
      authError,
      login,
      logout,
      setUser: (nextUser) => persistAuth({ token, user: nextUser }),
    }),
    [token, user, loading, authError]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

