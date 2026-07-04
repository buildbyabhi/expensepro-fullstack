import { createContext, useContext, useState, useEffect } from 'react';

const CurrencyContext = createContext();

const SUPPORTED_CURRENCIES = {
  INR: { symbol: '₹', name: 'Indian Rupee' },
  USD: { symbol: '$', name: 'US Dollar' },
  EUR: { symbol: '€', name: 'Euro' },
  GBP: { symbol: '£', name: 'British Pound' }
};

export const CurrencyProvider = ({ children }) => {
  const [currency, setCurrency] = useState(localStorage.getItem('expense_currency') || 'INR');
  const [rates, setRates] = useState({ INR: 1, USD: 0.012, EUR: 0.011, GBP: 0.0094 }); // Fallback rates

  useEffect(() => {
    localStorage.setItem('expense_currency', currency);
  }, [currency]);

  useEffect(() => {
    const fetchRates = async () => {
      try {
        const res = await fetch('https://open.er-api.com/v6/latest/INR');
        const data = await res.json();
        if (data && data.rates) {
          setRates(data.rates);
        }
      } catch (err) {
        console.error('Failed to fetch exchange rates, using fallbacks.', err);
      }
    };
    fetchRates();
  }, []);

  const convertAmount = (amount) => {
    if (currency === 'INR') return amount;
    const rate = rates[currency];
    return amount * (rate || 1);
  };

  const formatAmount = (amount) => {
    const converted = convertAmount(amount);
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      maximumFractionDigits: 0,
    }).format(converted || 0);
  };

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, SUPPORTED_CURRENCIES, convertAmount, formatAmount }}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) throw new Error('useCurrency must be used within CurrencyProvider');
  return context;
};
