import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Analytics } from '@vercel/analytics/react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { TransactionProvider } from './context/TransactionContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import VerifyEmail from './pages/VerifyEmail';
import AdminPanel from './pages/AdminPanel';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="page-loader">
        <div className="loader-orb" />
        <p>Loading ExpensePro...</p>
      </div>
    );
  }
  return user ? children : <Navigate to="/login" replace />;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? <Navigate to="/dashboard" replace /> : children;
};

const AppRoutes = () => {
  const { user } = useAuth();
  return (
    <TransactionProvider isAuthenticated={!!user}>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route
          path="/login"
          element={<PublicRoute><Login /></PublicRoute>}
        />
        <Route
          path="/register"
          element={<PublicRoute><Register /></PublicRoute>}
        />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route
          path="/dashboard"
          element={<ProtectedRoute><Dashboard /></ProtectedRoute>}
        />
        <Route
          path="/admin"
          element={<ProtectedRoute><AdminPanel /></ProtectedRoute>}
        />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </TransactionProvider>
  );
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#1e1e3a',
              color: '#e2e8f0',
              border: '1px solid rgba(129,140,248,0.2)',
              borderRadius: '12px',
              boxShadow: '0 10px 40px rgba(0,0,0,0.4)',
            },
            success: { iconTheme: { primary: '#22c55e', secondary: '#1e1e3a' } },
            error: { iconTheme: { primary: '#ef4444', secondary: '#1e1e3a' } },
          }}
        />
        <Analytics />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
