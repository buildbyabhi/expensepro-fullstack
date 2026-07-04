import { useState } from 'react';
import { useTransactions } from '../context/TransactionContext';
import { useCurrency } from '../context/CurrencyContext';
import { formatDate } from '../utils/formatCurrency';
import CategoryBadge from './CategoryBadge';
import { Trash2, Search, Filter, TrendingUp, TrendingDown, Loader } from 'lucide-react';
import toast from 'react-hot-toast';

const TransactionList = () => {
  const { transactions, deleteTransaction, loading } = useTransactions();
  const { formatAmount } = useCurrency();
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [deleting, setDeleting] = useState(null);

  const filtered = transactions.filter((t) => {
    const matchesSearch =
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.category.toLowerCase().includes(search.toLowerCase());
    const matchesType = filterType === 'all' || t.type === filterType;
    return matchesSearch && matchesType;
  });

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Delete "${title}"?`)) return;
    setDeleting(id);
    try {
      await deleteTransaction(id);
      toast.success('Transaction deleted');
    } catch {
      toast.error('Failed to delete');
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="list-card">
      <div className="list-header">
        <h2 className="list-title">Transactions</h2>
        <span className="list-count">{filtered.length} records</span>
      </div>

      {/* Filters */}
      <div className="list-filters">
        <div className="search-wrapper">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            placeholder="Search transactions..."
            className="search-input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="filter-tabs">
          {['all', 'income', 'expense'].map((tab) => (
            <button
              key={tab}
              className={`filter-tab ${filterType === tab ? 'filter-tab--active' : ''}`}
              onClick={() => setFilterType(tab)}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="transaction-list">
        {loading && (
          <div className="list-empty">
            <Loader size={32} className="animate-spin" />
            <p>Loading transactions...</p>
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="list-empty">
            <span className="list-empty-icon">📭</span>
            <p>No transactions found</p>
            <span className="list-empty-sub">Add your first transaction above</span>
          </div>
        )}

        {!loading && filtered.map((t) => (
          <div
            key={t._id}
            className={`transaction-item transaction-item--${t.type}`}
          >
            <div className="transaction-left">
              <div className={`transaction-type-icon transaction-type-icon--${t.type}`}>
                {t.type === 'income'
                  ? <TrendingUp size={16} />
                  : <TrendingDown size={16} />}
              </div>
              <div className="transaction-info">
                <span className="transaction-title">{t.title}</span>
                <div className="transaction-meta">
                  <CategoryBadge category={t.category} />
                  <span className="transaction-date">{formatDate(t.date)}</span>
                </div>
                {t.note && <span className="transaction-note">{t.note}</span>}
              </div>
            </div>
            <div className="transaction-right">
              <span className={`transaction-amount transaction-amount--${t.type}`}>
                {t.type === 'income' ? '+' : '-'}{formatAmount(t.amount)}
              </span>
              <button
                className="delete-btn"
                onClick={() => handleDelete(t._id, t.title)}
                disabled={deleting === t._id}
                title="Delete"
              >
                {deleting === t._id
                  ? <Loader size={16} className="animate-spin" />
                  : <Trash2 size={16} />}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TransactionList;
