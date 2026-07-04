import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff, Mail, Lock, Wallet } from 'lucide-react';
import toast from 'react-hot-toast';

const Login = () => {
  const { login, completeLogin, api } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [show2FA, setShow2FA] = useState(false);
  const [tfaCode, setTfaCode] = useState('');
  const [loginEmail, setLoginEmail] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (show2FA) {
      if (!tfaCode) return toast.error('Please enter 2FA code');
      setLoading(true);
      try {
        const { data } = await api.post('/auth/verify-login-2fa', { email: loginEmail, token: tfaCode });
        if (data.success) {
          completeLogin(data.user, data.token);
          toast.success('Login successful!');
          navigate('/dashboard');
        }
      } catch (err) {
        toast.error(err.response?.data?.message || 'Invalid 2FA code');
      } finally {
        setLoading(false);
      }
      return;
    }

    if (!email || !password) return toast.error('Please fill in all fields');
    setLoading(true);
    try {
      const data = await login(email, password);
      if (data.requires2FA) {
        setLoginEmail(email);
        setShow2FA(true);
        toast.success('Please enter 2FA code');
      } else {
        toast.success('Welcome back! 👋');
        navigate('/dashboard');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-blob auth-blob--1" />
      <div className="auth-blob auth-blob--2" />

      <div className="auth-card">
        <div className="auth-logo">
          <div className="auth-logo-icon">
            <Wallet size={28} className="text-white" />
          </div>
          <h1 className="auth-logo-text">
            Xpense<span className="text-accent">Pro</span>
          </h1>
        </div>

        <h2 className="auth-title">Welcome Back</h2>
        <p className="auth-subtitle">Sign in to manage your finances</p>

        {!show2FA ? (
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label className="form-label">
                <Mail size={14} /> Email
              </label>
              <input
                type="email"
                className="form-input"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                <Lock size={14} /> Password
              </label>
              <div className="password-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="form-input"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div style={{ textAlign: 'right', marginBottom: '24px' }}>
              <Link to="/forgot-password" style={{ color: 'var(--accent)', fontSize: '13px', fontWeight: '500', textDecoration: 'none' }}>
                Forgot Password?
              </Link>
            </div>

            <button type="submit" className="auth-submit-btn" disabled={loading}>
              {loading ? <span className="loading-spinner" /> : 'Sign In'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label className="form-label">
                <Lock size={14} /> 2FA Code
              </label>
              <input
                type="text"
                className="form-input"
                placeholder="6-digit code"
                value={tfaCode}
                onChange={(e) => setTfaCode(e.target.value)}
                maxLength="6"
              />
            </div>
            <button type="submit" className="auth-submit-btn" disabled={loading}>
              {loading ? <span className="loading-spinner" /> : 'Verify Code'}
            </button>
          </form>
        )}

        <p className="auth-switch">
          Don't have an account?{' '}
          <Link to="/register" className="auth-switch-link">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
