import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Users, Activity, Trash2, ShieldCheck, TrendingUp, LogOut, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

const AdminPanel = () => {
  const { api, user, logout } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    if (!user) return navigate('/login');
    if (!user.isAdmin) return navigate('/dashboard');
    fetchStats();
  }, [user]);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/stats');
      if (data.success) setStats(data);
    } catch {
      toast.error('Failed to load admin stats');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (userId, name) => {
    if (!window.confirm(`Delete user "${name}" and all their data?`)) return;
    setDeleting(userId);
    try {
      await api.delete(`/admin/users/${userId}`);
      toast.success(`User "${name}" deleted`);
      fetchStats();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    } finally {
      setDeleting(null);
    }
  };

  if (loading) return (
    <div className="admin-loading">
      <span className="loading-spinner" style={{ width: 40, height: 40, borderWidth: 4 }} />
      <p>Loading Admin Panel...</p>
    </div>
  );

  return (
    <div className="admin-page">
      {/* Header */}
      <div className="admin-header">
        <div className="admin-header-left">
          <div className="admin-logo">
            <ShieldCheck size={22} />
          </div>
          <div>
            <h1 className="admin-title">Admin Panel</h1>
            <p className="admin-subtitle">ExpensePro Management</p>
          </div>
        </div>
        <div className="admin-header-actions">
          <button className="admin-refresh-btn" onClick={fetchStats}>
            <RefreshCw size={16} /> Refresh
          </button>
          <button className="admin-logout-btn" onClick={() => { logout(); navigate('/login'); }}>
            <LogOut size={16} /> Logout
          </button>
        </div>
      </div>

      <div className="admin-body">
        {/* Stats Cards */}
        <div className="admin-stats-grid">
          {[
            { label: 'Total Users', value: stats?.stats.totalUsers, icon: <Users size={20} />, color: 'accent' },
            { label: 'Verified Users', value: stats?.stats.verifiedUsers, icon: <ShieldCheck size={20} />, color: 'income' },
            { label: 'Unverified', value: stats?.stats.unverifiedUsers, icon: <Activity size={20} />, color: 'expense' },
            { label: 'Total Transactions', value: stats?.stats.totalTransactions, icon: <TrendingUp size={20} />, color: 'accent' },
          ].map((card, i) => (
            <div className={`admin-stat-card admin-stat-card--${card.color}`} key={i}>
              <div className="admin-stat-icon">{card.icon}</div>
              <div className="admin-stat-value">{card.value ?? '—'}</div>
              <div className="admin-stat-label">{card.label}</div>
            </div>
          ))}
        </div>

        {/* Users Table */}
        <div className="admin-table-card">
          <div className="admin-table-header">
            <h2 className="admin-table-title">
              <Users size={18} /> All Users ({stats?.users.length})
            </h2>
          </div>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Status</th>
                  <th>Transactions</th>
                  <th>Joined</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {stats?.users.map((u, i) => (
                  <tr key={u.id}>
                    <td className="admin-td-num">{i + 1}</td>
                    <td className="admin-td-name">{u.name}</td>
                    <td className="admin-td-email">{u.email}</td>
                    <td>
                      <span className={`admin-badge admin-badge--${u.isVerified ? 'verified' : 'unverified'}`}>
                        {u.isVerified ? '✅ Verified' : '⏳ Unverified'}
                      </span>
                    </td>
                    <td className="admin-td-center">{u.transactions}</td>
                    <td className="admin-td-date">
                      {new Date(u.joinedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td>
                      <button
                        className="admin-delete-btn"
                        onClick={() => handleDelete(u.id, u.name)}
                        disabled={deleting === u.id}
                      >
                        {deleting === u.id ? <span className="loading-spinner loading-spinner--sm" /> : <Trash2 size={14} />}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
