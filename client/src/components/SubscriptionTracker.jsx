import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCurrency } from '../context/CurrencyContext';
import { Repeat, Plus, Trash2, Calendar, DollarSign, Loader } from 'lucide-react';
import toast from 'react-hot-toast';

const SubscriptionTracker = () => {
  const { api } = useAuth();
  const { formatAmount } = useCurrency();
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [formData, setFormData] = useState({ title: '', amount: '', cycle: 'monthly', nextBillingDate: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const fetchSubscriptions = async () => {
    try {
      const { data } = await api.get('/subscriptions');
      if (data.success) {
        setSubscriptions(data.data);
      }
    } catch (err) {
      toast.error('Failed to load subscriptions');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.amount || !formData.nextBillingDate) {
      return toast.error('Please fill all fields');
    }
    setIsSubmitting(true);
    try {
      const { data } = await api.post('/subscriptions', {
        ...formData,
        amount: Number(formData.amount)
      });
      if (data.success) {
        setSubscriptions(prev => [...prev, data.data].sort((a,b) => new Date(a.nextBillingDate) - new Date(b.nextBillingDate)));
        setAdding(false);
        setFormData({ title: '', amount: '', cycle: 'monthly', nextBillingDate: '' });
        toast.success('Subscription added!');
      }
    } catch (err) {
      toast.error('Failed to add subscription');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this subscription?')) return;
    try {
      await api.delete(`/subscriptions/${id}`);
      setSubscriptions(prev => prev.filter(s => s._id !== id));
      toast.success('Subscription removed');
    } catch (err) {
      toast.error('Failed to remove');
    }
  };

  // Calculate Monthly Burn (yearly gets divided by 12)
  const monthlyBurn = subscriptions.reduce((sum, sub) => {
    const amt = sub.cycle === 'yearly' ? sub.amount / 12 : sub.amount;
    return sum + amt;
  }, 0);

  return (
    <div className="budget-card">
      {/* Header */}
      <div className="budget-header">
        <div className="budget-title-row">
          <div className="budget-icon" style={{ background: 'rgba(99, 102, 241, 0.15)', color: 'var(--accent)' }}>
            <Repeat size={18} />
          </div>
          <h2 className="budget-title">Subscriptions</h2>
        </div>
        {!adding && (
          <button className="budget-edit-btn" onClick={() => setAdding(true)}>
            <Plus size={14} /> Add New
          </button>
        )}
      </div>

      {/* Burn Rate */}
      <div className="budget-total-section" style={{ background: 'rgba(239, 68, 68, 0.05)', borderColor: 'rgba(239, 68, 68, 0.15)' }}>
        <div className="budget-total-row">
          <div>
            <div className="budget-label" style={{ color: 'var(--expense)' }}>Total Monthly Burn</div>
            <div className="budget-amounts">
              <span className="budget-spent" style={{ color: 'var(--expense)' }}>
                {formatAmount(monthlyBurn)}
              </span>
              <span className="budget-sub" style={{ fontSize: '11px', color: 'var(--text-secondary)', marginLeft: '8px' }}>
                fixed cost / mo
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Add Form */}
      {adding && (
        <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '16px', padding: '16px', background: 'var(--bg-elevated)', borderRadius: '12px' }}>
          <input type="text" placeholder="Title (e.g. Netflix)" className="form-input" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
          <div style={{ display: 'flex', gap: '10px' }}>
            <input type="number" placeholder="Amount" className="form-input" style={{ flex: 1 }} value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} />
            <select className="form-input" style={{ flex: 1 }} value={formData.cycle} onChange={e => setFormData({...formData, cycle: e.target.value})}>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>
          <input type="date" className="form-input" value={formData.nextBillingDate} onChange={e => setFormData({...formData, nextBillingDate: e.target.value})} />
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '8px' }}>
            <button type="button" className="btn-reset" onClick={() => setAdding(false)}>Cancel</button>
            <button type="submit" className="btn-submit btn-submit--expense" disabled={isSubmitting}>
              {isSubmitting ? 'Adding...' : 'Save'}
            </button>
          </div>
        </form>
      )}

      {/* List */}
      <div className="budget-categories" style={{ marginTop: '20px' }}>
        <div className="budget-cat-title">
          <Calendar size={14} /> Active Subscriptions
        </div>
        <div className="budget-cat-list">
          {loading && <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}><Loader size={12} className="animate-spin"/> Loading...</p>}
          {!loading && subscriptions.length === 0 && !adding && (
            <p className="budget-empty">No active subscriptions tracking. 🔁</p>
          )}
          {subscriptions.map(sub => (
            <div key={sub._id} className="budget-cat-item" style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--glass-border)' }}>
              <div>
                <div style={{ fontWeight: '600', fontSize: '14px', color: 'var(--text-primary)' }}>{sub.title}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  {formatAmount(sub.amount)} / {sub.cycle === 'yearly' ? 'yr' : 'mo'}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ textAlign: 'right', fontSize: '12px', color: 'var(--text-secondary)' }}>
                  Next: <br/>
                  <span style={{ color: 'var(--text-primary)', fontWeight: '500' }}>
                    {new Date(sub.nextBillingDate).toLocaleDateString()}
                  </span>
                </div>
                <button onClick={() => handleDelete(sub._id)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }} title="Remove">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SubscriptionTracker;
