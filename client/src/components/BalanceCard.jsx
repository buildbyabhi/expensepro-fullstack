import { Wallet, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { useCurrency } from '../context/CurrencyContext';

const StatCard = ({ label, amount, type, icon: Icon, iconBg, change, monthName, formatAmount }) => (
  <div className={`stat-card stat-card--${type}`}>
    <div className="stat-card-header">
      <div className={`stat-icon stat-icon--${type}`}>
        <Icon size={22} />
      </div>
      <span className="stat-label">{label}</span>
    </div>
    <div className="stat-amount">{formatAmount(amount)}</div>
    <div className="stat-card-footer">
      <span className="stat-sub">In {monthName}</span>
    </div>
  </div>
);

const BalanceCard = ({ summary, selectedDate }) => {
  const { totalIncome = 0, totalExpense = 0, balance = 0 } = summary || {};
  const savingsRate = totalIncome > 0 ? ((balance / totalIncome) * 100).toFixed(1) : 0;
  
  const { formatAmount } = useCurrency();
  const monthName = selectedDate ? new Date(selectedDate).toLocaleString('default', { month: 'long' }) : 'this month';

  return (
    <div className="balance-section">
      {/* Main Balance Hero */}
      <div className="balance-hero">
        <div className="balance-hero-content">
          <div className="balance-label">
            <Wallet size={18} className="balance-wallet-icon" />
            Total Balance ({monthName})
          </div>
          <div className={`balance-amount ${balance < 0 ? 'balance-negative' : ''}`}>
            {formatAmount(Math.abs(balance))}
            {balance < 0 && <span className="balance-negative-label">Deficit</span>}
          </div>
          {totalIncome > 0 && (
            <div className="savings-rate">
              <div
                className="savings-bar"
                style={{ width: `${Math.max(0, Math.min(100, savingsRate))}%` }}
              />
              <span className="savings-text">
                {savingsRate}% savings rate
              </span>
            </div>
          )}
        </div>
        <div className="balance-orb" />
      </div>

      {/* Stat Cards */}
      <div className="stat-cards-grid">
        <StatCard
          label="Total Income"
          amount={totalIncome}
          type="income"
          icon={TrendingUp}
          monthName={monthName}
          formatAmount={formatAmount}
        />
        <StatCard
          label="Total Expense"
          amount={totalExpense}
          type="expense"
          icon={TrendingDown}
          monthName={monthName}
          formatAmount={formatAmount}
        />
      </div>
    </div>
  );
};

export default BalanceCard;
