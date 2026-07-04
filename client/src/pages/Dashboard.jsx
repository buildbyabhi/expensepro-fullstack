import Navbar from '../components/Navbar';
import BalanceCard from '../components/BalanceCard';
import ExpenseForm from '../components/ExpenseForm';
import TransactionList from '../components/TransactionList';
import ChartSection from '../components/ChartSection';
import ImportExport from '../components/ImportExport';
import BudgetTracker from '../components/BudgetTracker';
import SubscriptionTracker from '../components/SubscriptionTracker';
import { useTransactions } from '../context/TransactionContext';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

const Dashboard = () => {
  const { summary, selectedDate, changeMonth } = useTransactions();

  return (
    <div className="dashboard-layout">
      <Navbar />
      <main className="dashboard-main">
        <div className="dashboard-container">
          {/* Header */}
          <div className="dashboard-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h1 className="dashboard-heading">Financial Dashboard</h1>
              <p className="dashboard-subheading">Track, analyze, and grow your savings</p>
            </div>
            
            {/* Month Navigator */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'var(--surface)', padding: '8px 16px', borderRadius: '12px', border: '1px solid var(--border)' }}>
              <button 
                onClick={() => changeMonth(-1)}
                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px' }}
                onMouseOver={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
                onMouseOut={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
              >
                <ChevronLeft size={20} />
              </button>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)', fontWeight: '600', minWidth: '120px', justifyContent: 'center' }}>
                <Calendar size={16} style={{ color: 'var(--accent)' }} />
                <span>
                  {selectedDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                </span>
              </div>

              <button 
                onClick={() => changeMonth(1)}
                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px' }}
                onMouseOver={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
                onMouseOut={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>

          {/* Balance Hero Section */}
          <BalanceCard summary={summary} selectedDate={selectedDate} />

          {/* Main Grid */}
          <div className="dashboard-grid">
            {/* Left Column: Form + Transactions */}
            <div className="dashboard-left">
              <ExpenseForm />
              <TransactionList />
              <ImportExport />
            </div>

            {/* Right Column: Charts + Budget */}
            <div className="dashboard-right">
              <ChartSection />
              <BudgetTracker />
              <SubscriptionTracker />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
