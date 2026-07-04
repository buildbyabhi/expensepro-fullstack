import { useState } from 'react';
import { ShieldCheck, X, QrCode, Lock, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const SecurityModal = ({ isOpen, onClose }) => {
  const { api } = useAuth();
  const [loading, setLoading] = useState(false);
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [token, setToken] = useState('');
  const [step, setStep] = useState(1);

  if (!isOpen) return null;

  const handleEnable2FA = async () => {
    setLoading(true);
    try {
      const { data } = await api.post('/auth/enable-2fa');
      if (data.success) {
        setQrCode(data.qrCodeUrl);
        setSecret(data.secret);
        setStep(2);
      }
    } catch (err) {
      toast.error('Failed to initiate 2FA');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify2FA = async (e) => {
    e.preventDefault();
    if (!token) return toast.error('Please enter the 6-digit code');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/verify-2fa', { token });
      if (data.success) {
        toast.success('2FA enabled successfully!');
        setStep(3);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
      <div className="modal-content" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--glass-border)', borderRadius: '16px', padding: '24px', width: '90%', maxWidth: '400px', position: 'relative', boxShadow: '0 20px 40px rgba(0,0,0,0.3)' }}>
        
        <button onClick={onClose} style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
          <X size={20} />
        </button>

        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ display: 'inline-flex', padding: '12px', background: 'rgba(99, 102, 241, 0.1)', color: 'var(--accent)', borderRadius: '50%', marginBottom: '16px' }}>
            <ShieldCheck size={32} />
          </div>
          <h2 style={{ fontSize: '20px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '8px' }}>Security Settings</h2>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Protect your account with Two-Factor Authentication</p>
        </div>

        {step === 1 && (
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '14px', color: 'var(--text-primary)', marginBottom: '24px' }}>
              Adds an extra layer of security to your account. You'll need to enter a code from your authenticator app when logging in.
            </p>
            <button 
              className="auth-button" 
              onClick={handleEnable2FA} 
              disabled={loading}
              style={{ width: '100%' }}
            >
              {loading ? 'Initiating...' : 'Enable 2FA'}
            </button>
          </div>
        )}

        {step === 2 && (
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '14px', color: 'var(--text-primary)', marginBottom: '16px' }}>
              1. Scan this QR code with Google Authenticator or Authy
            </p>
            <div style={{ background: 'white', padding: '16px', borderRadius: '12px', display: 'inline-block', marginBottom: '16px' }}>
              <img src={qrCode} alt="2FA QR Code" style={{ width: '150px', height: '150px' }} />
            </div>
            
            <form onSubmit={handleVerify2FA}>
              <p style={{ fontSize: '14px', color: 'var(--text-primary)', marginBottom: '8px' }}>
                2. Enter the 6-digit code to verify
              </p>
              <div className="input-group" style={{ marginBottom: '16px' }}>
                <Lock size={18} className="input-icon" />
                <input
                  type="text"
                  placeholder="000000"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  maxLength="6"
                  required
                  style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-primary)', padding: '10px 10px 10px 40px', borderRadius: '8px', width: '100%', boxSizing: 'border-box' }}
                />
              </div>
              <button className="auth-button" type="submit" disabled={loading} style={{ width: '100%' }}>
                {loading ? 'Verifying...' : 'Verify & Enable'}
              </button>
            </form>
          </div>
        )}

        {step === 3 && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ color: 'var(--income)', marginBottom: '16px' }}>
              <CheckCircle2 size={48} style={{ margin: '0 auto' }} />
            </div>
            <h3 style={{ color: 'var(--text-primary)', marginBottom: '8px' }}>2FA is Enabled!</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '24px' }}>
              Your account is now more secure. You'll be prompted for a code on your next login.
            </p>
            <button className="auth-button" onClick={onClose} style={{ width: '100%' }}>
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SecurityModal;
