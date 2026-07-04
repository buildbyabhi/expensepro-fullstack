import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

// Dev: uses Vite proxy → /api → localhost:5000
// Prod: uses VITE_API_URL → https://your-backend.onrender.com/api
const BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT to all requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('expense_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('expense_token'));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load user from token on mount
  useEffect(() => {
    const initAuth = async () => {
      const savedToken = localStorage.getItem('expense_token');
      if (savedToken) {
        try {
          const { data } = await api.get('/auth/me');
          setUser(data.user);
        } catch {
          localStorage.removeItem('expense_token');
          setToken(null);
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  const register = useCallback(async (name, email, password) => {
    setError(null);
    const { data } = await api.post('/auth/register', { name, email, password });
    if (data.success) {
      localStorage.setItem('expense_token', data.token);
      setToken(data.token);
      setUser(data.user);
      return true;
    }
    throw new Error(data.message);
  }, []);

  const login = useCallback(async (email, password) => {
    setError(null);
    const { data } = await api.post('/auth/login', { email, password });
    if (data.success) {
      if (data.requires2FA) {
        return data; // Return the 2FA requirement to the component
      }
      localStorage.setItem('expense_token', data.token);
      setToken(data.token);
      setUser(data.user);
      return data;
    }
    throw new Error(data.message);
  }, []);

  const completeLogin = useCallback((userData, tokenData) => {
    localStorage.setItem('expense_token', tokenData);
    setToken(tokenData);
    setUser(userData);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('expense_token');
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, loading, error, register, login, completeLogin, logout, api }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};

export { api };
