import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from './AuthContext';

const TransactionContext = createContext(null);

export const TransactionProvider = ({ children, isAuthenticated }) => {
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState({ totalIncome: 0, totalExpense: 0, balance: 0 });
  const [monthlyData, setMonthlyData] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [globalCategories, setGlobalCategories] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const changeMonth = useCallback((offset) => {
    setSelectedDate((prev) => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() + offset);
      return newDate;
    });
  }, []);

  const fetchTransactions = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      const year = selectedDate.getFullYear();
      const month = selectedDate.getMonth();
      const startDate = new Date(year, month, 1).toISOString();
      const endDate = new Date(year, month + 1, 0, 23, 59, 59).toISOString();
      const { data } = await api.get(`/transactions?limit=200&startDate=${startDate}&endDate=${endDate}`);
      if (data.success) {
        setTransactions(data.data);
        setSummary(data.summary);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load transactions');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const fetchMonthlyStats = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const year = selectedDate.getFullYear();
      const { data } = await api.get(`/transactions/stats/monthly?year=${year}`);
      if (data.success) setMonthlyData(data.data);
    } catch {}
  }, [isAuthenticated]);

  const fetchCategoryStats = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const { data } = await api.get('/transactions/stats/categories?type=expense');
      if (data.success) setCategoryData(data.data);
    } catch {}
  }, [isAuthenticated]);

  const fetchCategoriesList = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const { data } = await api.get('/categories');
      if (data.success) setGlobalCategories(data.categories);
    } catch {}
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchTransactions();
      fetchMonthlyStats();
      fetchCategoryStats();
      fetchCategoriesList();
    } else {
      setTransactions([]);
      setSummary({ totalIncome: 0, totalExpense: 0, balance: 0 });
      setGlobalCategories([]);
    }
  }, [isAuthenticated, selectedDate, fetchTransactions, fetchMonthlyStats, fetchCategoryStats, fetchCategoriesList]);

  const addTransaction = useCallback(async (transactionData) => {
    const { data } = await api.post('/transactions', transactionData);
    if (data.success) {
      await fetchTransactions();
      await fetchMonthlyStats();
      await fetchCategoryStats();
      return data.data;
    }
    throw new Error(data.message);
  }, [fetchTransactions, fetchMonthlyStats, fetchCategoryStats]);

  const deleteTransaction = useCallback(async (id) => {
    const { data } = await api.delete(`/transactions/${id}`);
    if (data.success) {
      await fetchTransactions();
      await fetchMonthlyStats();
      await fetchCategoryStats();
    } else {
      throw new Error(data.message);
    }
  }, [fetchTransactions, fetchMonthlyStats, fetchCategoryStats]);

  return (
    <TransactionContext.Provider
      value={{
        transactions,
        summary,
        monthlyData,
        categoryData,
        globalCategories,
        selectedDate,
        changeMonth,
        loading,
        error,
        addTransaction,
        deleteTransaction,
        refreshAll: () => {
          fetchTransactions();
          fetchMonthlyStats();
          fetchCategoryStats();
          fetchCategoriesList();
        },
      }}
    >
      {children}
    </TransactionContext.Provider>
  );
};

export const useTransactions = () => {
  const ctx = useContext(TransactionContext);
  if (!ctx) throw new Error('useTransactions must be used inside TransactionProvider');
  return ctx;
};
