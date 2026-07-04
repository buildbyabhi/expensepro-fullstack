import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useCurrency } from '../context/CurrencyContext';
import {
  LayoutDashboard, LogOut, Menu, X, Wallet, User, ShieldCheck, Sun, Moon, Settings
} from 'lucide-react';
import SecurityModal from './SecurityModal';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { currency, setCurrency, SUPPORTED_CURRENCIES } = useCurrency();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [securityModalOpen, setSecurityModalOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        {/* Logo */}
        <Link to="/dashboard" className="navbar-logo">
          <div className="logo-icon">
            <Wallet size={20} className="text-white" />
          </div>
          <span className="logo-text">
            Xpense<span className="logo-accent">Pro</span>
          </span>
        </Link>

        {/* Desktop Nav Links */}
        <div className="navbar-links">
          <Link to="/dashboard" className="nav-link">
            <LayoutDashboard size={16} />
            Dashboard
          </Link>
          {user?.isAdmin && (
            <Link to="/admin" className="nav-link admin-nav-link">
              <ShieldCheck size={16} />
              Admin
            </Link>
          )}
        </div>

        {/* User Section */}
        {user && (
          <div className="navbar-user">
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              style={{
                background: 'rgba(255,255,255,0.05)',
                color: 'var(--text-primary)',
                border: '1px solid var(--glass-border)',
                borderRadius: '8px',
                padding: '4px 8px',
                outline: 'none',
                cursor: 'pointer',
                marginRight: '8px'
              }}
            >
              {Object.keys(SUPPORTED_CURRENCIES).map(curr => (
                <option key={curr} value={curr} style={{ background: 'var(--bg-elevated)', color: 'var(--text-primary)' }}>
                  {curr}
                </option>
              ))}
            </select>
            
            <button 
              onClick={toggleTheme}  
              style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '6px', display: 'flex', alignItems: 'center' }}
              title="Toggle Theme"
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <div className="user-avatar" style={{ marginLeft: '8px' }}>
              <User size={16} />
            </div>
            <span className="user-name">{user.name}</span>
            <button 
              onClick={() => setSecurityModalOpen(true)}
              style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '6px', display: 'flex', alignItems: 'center', marginLeft: '4px' }}
              title="Security Settings"
            >
              <Settings size={18} />
            </button>
            <button onClick={handleLogout} className="logout-btn" title="Logout" style={{ marginLeft: '12px' }}>
              <LogOut size={18} />
            </button>
          </div>
        )}

        {/* Mobile Menu Toggle */}
        <button
          className="mobile-menu-btn"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile Dropdown */}
      {menuOpen && (
        <div className="mobile-menu">
          <Link to="/dashboard" onClick={() => setMenuOpen(false)} className="mobile-nav-link">
            <LayoutDashboard size={18} /> Dashboard
          </Link>
          {user?.isAdmin && (
            <Link to="/admin" onClick={() => setMenuOpen(false)} className="mobile-nav-link admin-mobile-link">
              <ShieldCheck size={18} /> Admin Panel
            </Link>
          )}
          {user && (
            <>
              <button onClick={() => { setSecurityModalOpen(true); setMenuOpen(false); }} className="mobile-nav-link" style={{ textAlign: 'left', width: '100%', background: 'none', border: 'none', color: 'var(--text-secondary)', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Settings size={18} /> Security Settings
              </button>
              <button onClick={handleLogout} className="mobile-nav-link logout-mobile">
                <LogOut size={18} /> Logout
              </button>
            </>
          )}
        </div>
      )}
      
      <SecurityModal isOpen={securityModalOpen} onClose={() => setSecurityModalOpen(false)} />
    </nav>
  );
};

export default Navbar;
