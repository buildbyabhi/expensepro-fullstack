import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { CATEGORIES } from '../utils/categories';
import { Target, Edit3, Check, X, TrendingUp, AlertTriangle } from 'lucide-react';
import { useCurrency } from '../context/CurrencyContext';
import toast from 'react-hot-toast';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const BudgetTracker = () => {
  const { api } = useAuth();
  const { formatAmount } = useCurrency();
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year,  setYear]  = useState(now.getFullYear());
  const [budget, setBudgetData] = useState(null);
  const [totalSpent, setTotalSpent] = useState(0);
  const [spentByCategory, setSpentByCategory] = useState({});
  const [editing, setEditing] = useState(false);
  const [totalInput, setTotalInput] = useState('');
  const [catInputs, setCatInputs] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => { fetchBudget(); }, [month, year]);

  const fetchBudget = async () => {
    try {
      const { data } = await api.get(`/budget?month=${month}&year=${year}`);
      if (data.success) {
        setBudgetData(data.budget);
        setTotalSpent(data.totalSpent);
        setSpentByCategory(data.spentByCategory);
        setTotalInput(data.budget.totalBudget || '');
        const catMap = {};
        (data.budget.categoryBudgets || []).forEach(cb => { catMap[cb.category] = cb.amount; });
        setCatInputs(catMap);
      }
    } catch { /* silent */ }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const categoryBudgets = Object.entries(catInputs)
        .filter(([, v]) => v > 0)
        .map(([category, amount]) => ({ category, amount: Number(amount) }));

      const { data } = await api.post('/budget', {
        month, year,
        totalBudget: Number(totalInput) || 0,
        categoryBudgets,
      });
      if (data.success) {
        setBudgetData(data.budget);
        toast.success('Budget saved! 🎯');
        setEditing(false);
      }
    } catch { toast.error('Failed to save budget'); }
    finally { setLoading(false); }
  };

  const totalBudget = budget?.totalBudget || 0;
  const totalPct    = totalBudget > 0 ? Math.min((totalSpent / totalBudget) * 100, 100) : 0;
  const overBudget  = totalSpent > totalBudget && totalBudget > 0;

  const expenseCategories = CATEGORIES.expense;

  return (
    <div className="budget-card">
      {/* Header */}
      <div className="budget-header">
        <div className="budget-title-row">
          <div className="budget-icon"><Target size={18} /></div>
          <h2 className="budget-title">Budget Tracker</h2>
        </div>
        <div className="budget-controls">
          <select className="budget-select" value={month} onChange={e => setMonth(Number(e.target.value))}>
            {MONTHS.map((m, i) => <option key={i} value={i+1}>{m}</option>)}
          </select>
          <select className="budget-select" value={year} onChange={e => setYear(Number(e.target.value))}>
            {[2024,2025,2026,2027].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          {!editing ? (
            <button className="budget-edit-btn" onClick={() => setEditing(true)}>
              <Edit3 size={14} /> Set Budget
            </button>
          ) : (
            <div style={{ display:'flex', gap: 6 }}>
              <button className="budget-save-btn" onClick={handleSave} disabled={loading}>
                <Check size={14} /> {loading ? 'Saving...' : 'Save'}
              </button>
              <button className="budget-cancel-btn" onClick={() => setEditing(false)}>
                <X size={14} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Total Budget Progress */}
      <div className="budget-total-section">
        {editing ? (
          <div className="budget-input-row">
            <label className="budget-label">Monthly Budget (₹)</label>
            <input
              type="number"
              className="form-input budget-input"
              placeholder="Enter total budget"
              value={totalInput}
              onChange={e => setTotalInput(e.target.value)}
            />
          </div>
        ) : (
          <>
            <div className="budget-total-row">
              <div>
                <div className="budget-label">Total Budget</div>
                <div className="budget-amounts">
                  <span className={`budget-spent ${overBudget ? 'budget-over' : ''}`}>
                    {formatAmount(totalSpent)}
                  </span>
                  <span className="budget-slash"> / </span>
                  <span className="budget-limit">
                    {totalBudget > 0 ? formatAmount(totalBudget) : '—'}
                  </span>
                </div>
              </div>
              {overBudget && (
                <div className="budget-alert">
                  <AlertTriangle size={16} /> Over Budget!
                </div>
              )}
              {!overBudget && totalBudget > 0 && (
                <div className="budget-remaining">
                  {formatAmount(totalBudget - totalSpent)} left
                </div>
              )}
            </div>
            <div className="budget-bar-bg">
              <div
                className={`budget-bar-fill ${overBudget ? 'budget-bar-over' : totalPct > 80 ? 'budget-bar-warn' : 'budget-bar-ok'}`}
                style={{ width: `${totalPct}%` }}
              />
            </div>
            <div className="budget-pct">{Math.round(totalPct)}% used</div>
          </>
        )}
      </div>

      {/* Category Budgets */}
      <div className="budget-categories">
        <div className="budget-cat-title">
          <TrendingUp size={14} /> Category Wise
        </div>
        <div className="budget-cat-list">
          {expenseCategories.map(cat => {
            const catBudget = catInputs[cat.name] || 0;
            const catSpent  = spentByCategory[cat.name] || 0;
            const catPct    = catBudget > 0 ? Math.min((catSpent / catBudget) * 100, 100) : 0;
            const catOver   = catSpent > catBudget && catBudget > 0;

            if (!editing && catBudget === 0 && catSpent === 0) return null;

            return (
              <div key={cat.name} className="budget-cat-item">
                <div className="budget-cat-info">
                  <span className="budget-cat-icon">{cat.icon}</span>
                  <span className="budget-cat-name">{cat.name}</span>
                  {editing ? (
                    <input
                      type="number"
                      className="budget-cat-input"
                      placeholder="0"
                      value={catInputs[cat.name] || ''}
                      onChange={e => setCatInputs(prev => ({ ...prev, [cat.name]: e.target.value }))}
                    />
                  ) : (
                    <span className={`budget-cat-spent ${catOver ? 'budget-over' : ''}`}>
                      {formatAmount(catSpent)}
                      {catBudget > 0 && <span className="budget-cat-limit"> / {formatAmount(Number(catBudget))}</span>}
                    </span>
                  )}
                </div>
                {!editing && catBudget > 0 && (
                  <div className="budget-cat-bar-bg">
                    <div
                      className={`budget-cat-bar-fill ${catOver ? 'budget-bar-over' : catPct > 80 ? 'budget-bar-warn' : 'budget-bar-ok'}`}
                      style={{ width: `${catPct}%` }}
                    />
                  </div>
                )}
              </div>
            );
          })}
          {!editing && Object.keys(spentByCategory).length === 0 && totalBudget === 0 && (
            <p className="budget-empty">Click "Set Budget" to get started! 🎯</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default BudgetTracker;
