import { useState, useMemo } from 'react';
import { useTransactions } from '../context/TransactionContext';
import { PlusCircle, DollarSign, Tag, FileText, Calendar, X } from 'lucide-react';
import toast from 'react-hot-toast';

const ExpenseForm = () => {
  const { addTransaction, globalCategories } = useTransactions();
  const [type, setType] = useState('expense');
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);

  const categories = useMemo(() => {
    return globalCategories.filter(c => c.type === type) || [];
  }, [globalCategories, type]);

  const resetForm = () => {
    setTitle('');
    setAmount('');
    setCategory('');
    setNote('');
    setDate(new Date().toISOString().split('T')[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return toast.error('Please enter a title');
    if (!amount || parseFloat(amount) <= 0) return toast.error('Please enter a valid amount');
    if (!category) return toast.error('Please select a category');

    setLoading(true);
    try {
      await addTransaction({ title: title.trim(), amount: parseFloat(amount), type, category, note, date });
      toast.success(`${type === 'income' ? '💰 Income' : '💸 Expense'} added successfully!`);
      resetForm();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add transaction');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-card">
      <div className="form-header">
        <h2 className="form-title">Add Transaction</h2>
        {/* Type Toggle */}
        <div className="type-toggle">
          <button
            type="button"
            className={`type-btn ${type === 'income' ? 'type-btn--active-income' : ''}`}
            onClick={() => { setType('income'); setCategory(''); }}
          >
            💰 Income
          </button>
          <button
            type="button"
            className={`type-btn ${type === 'expense' ? 'type-btn--active-expense' : ''}`}
            onClick={() => { setType('expense'); setCategory(''); }}
          >
            💸 Expense
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="expense-form">
        {/* Title */}
        <div className="form-group">
          <label className="form-label">
            <Tag size={14} /> Title
          </label>
          <input
            type="text"
            className="form-input"
            placeholder="e.g. Zomato order, Salary..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={100}
          />
        </div>

        {/* Amount */}
        <div className="form-group">
          <label className="form-label">
            <DollarSign size={14} /> Amount (₹)
          </label>
          <input
            type="number"
            className="form-input"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            min="0.01"
            step="0.01"
          />
        </div>

        {/* Category */}
        <div className="form-group">
          <label className="form-label">
            <Tag size={14} /> Category
          </label>
          <div className="category-grid">
            {categories.length === 0 ? <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>No categories found</p> : categories.map((cat) => (
              <button
                key={cat.name}
                type="button"
                className={`category-chip ${category === cat.name ? 'category-chip--selected' : ''}`}
                style={category === cat.name ? { borderColor: cat.color, backgroundColor: `${cat.color}22` } : {}}
                onClick={() => setCategory(cat.name)}
              >
                <Tag size={12} style={{ color: cat.color, marginRight: '4px' }} />
                <span className="category-chip-label">{cat.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Date */}
        <div className="form-group">
          <label className="form-label">
            <Calendar size={14} /> Date
          </label>
          <input
            type="date"
            className="form-input"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>

        {/* Note */}
        <div className="form-group">
          <label className="form-label">
            <FileText size={14} /> Note (optional)
          </label>
          <textarea
            className="form-input form-textarea"
            placeholder="Add a note..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            maxLength={200}
          />
        </div>

        {/* Actions */}
        <div className="form-actions">
          <button type="button" onClick={resetForm} className="btn-reset">
            <X size={16} /> Clear
          </button>
          <button
            type="submit"
            className={`btn-submit btn-submit--${type}`}
            disabled={loading}
          >
            {loading ? (
              <span className="loading-spinner" />
            ) : (
              <>
                <PlusCircle size={18} />
                Add {type === 'income' ? 'Income' : 'Expense'}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ExpenseForm;
