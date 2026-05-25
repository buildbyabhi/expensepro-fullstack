export const CATEGORIES = {
  expense: [
    { name: 'Food & Dining', icon: '🍽️', color: '#f97316' },
    { name: 'Transportation', icon: '🚗', color: '#3b82f6' },
    { name: 'Shopping', icon: '🛍️', color: '#ec4899' },
    { name: 'Entertainment', icon: '🎬', color: '#a855f7' },
    { name: 'Bills & Utilities', icon: '💡', color: '#eab308' },
    { name: 'Healthcare', icon: '🏥', color: '#ef4444' },
    { name: 'Education', icon: '📚', color: '#06b6d4' },
    { name: 'Travel', icon: '✈️', color: '#14b8a6' },
    { name: 'Personal Care', icon: '💅', color: '#f43f5e' },
    { name: 'Groceries', icon: '🛒', color: '#84cc16' },
    { name: 'Rent & Housing', icon: '🏠', color: '#8b5cf6' },
    { name: 'EMI & Loans', icon: '🏦', color: '#64748b' },
    { name: 'Pocket Money', icon: '👛', color: '#f59e0b' },
    { name: 'Other', icon: '📦', color: '#94a3b8' },
  ],
  income: [
    { name: 'Salary', icon: '💼', color: '#22c55e' },
    { name: 'Freelance', icon: '💻', color: '#10b981' },
    { name: 'Business', icon: '🏢', color: '#059669' },
    { name: 'Investment', icon: '📈', color: '#34d399' },
    { name: 'Gift', icon: '🎁', color: '#6ee7b7' },
    { name: 'Bonus', icon: '⭐', color: '#a7f3d0' },
    { name: 'Pocket Money', icon: '👛', color: '#f59e0b' },
    { name: 'Other', icon: '💰', color: '#94a3b8' },
  ],
};

export const getCategoryMeta = (categoryName) => {
  const all = [...CATEGORIES.expense, ...CATEGORIES.income];
  return all.find((c) => c.name === categoryName) || { icon: '📦', color: '#94a3b8' };
};

export const CHART_COLORS = [
  '#818cf8', '#f472b6', '#fb923c', '#34d399', '#60a5fa',
  '#a78bfa', '#fbbf24', '#4ade80', '#f87171', '#38bdf8',
  '#c084fc', '#2dd4bf',
];
