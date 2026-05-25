import Navbar from '../components/Navbar';
import BalanceCard from '../components/BalanceCard';
import ExpenseForm from '../components/ExpenseForm';
import TransactionList from '../components/TransactionList';
import ChartSection from '../components/ChartSection';
import ImportExport from '../components/ImportExport';
import BudgetTracker from '../components/BudgetTracker';
import { useTransactions } from '../context/TransactionContext';

const Dashboard = () => {
  const { summary } = useTransactions();

  return (
    <div className="dashboard-layout">
      <Navbar />
      <main className="dashboard-main">
        <div className="dashboard-container">
          {/* Header */}
          <div className="dashboard-header">
            <div>
              <h1 className="dashboard-heading">Financial Dashboard</h1>
              <p className="dashboard-subheading">Track, analyze, and grow your savings</p>
            </div>
          </div>

          {/* Balance Hero Section */}
          <BalanceCard summary={summary} />

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
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
