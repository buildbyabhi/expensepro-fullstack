import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Users, Activity, Trash2, ShieldCheck, TrendingUp, LogOut, RefreshCw, Plus, Tag, ShieldAlert } from 'lucide-react';
import toast from 'react-hot-toast';

const AdminPanel = () => {
  const { api, user, logout } = useAuth();
  const navigate = useNavigate();
  
  const [stats, setStats] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);
  
  const [newCat, setNewCat] = useState({ name: '', type: 'expense', color: '#818cf8', icon: 'tag' });

  useEffect(() => {
    if (!user) return navigate('/login');
    if (!user.isAdmin) return navigate('/dashboard');
    fetchData();
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, catRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/categories')
      ]);
      if (statsRes.data.success) setStats(statsRes.data);
      if (catRes.data.success) setCategories(catRes.data.categories);
    } catch {
      toast.error('Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId, name) => {
    if (!window.confirm(`Delete user "${name}" and all their data?`)) return;
    setDeleting(userId);
    try {
      await api.delete(`/admin/users/${userId}`);
      toast.success(`User "${name}" deleted`);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    } finally {
      setDeleting(null);
    }
  };

  const handleToggleRole = async (userId) => {
    try {
      await api.put(`/admin/users/${userId}/role`);
      toast.success('User role updated');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    }
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    try {
      await api.post('/admin/categories', newCat);
      toast.success('Category added');
      fetchData();
      setNewCat({ name: '', type: 'expense', color: '#818cf8', icon: 'tag' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add category');
    }
  };

  const handleDeleteCategory = async (id) => {
    if (!window.confirm('Delete this category?')) return;
    try {
      await api.delete(`/admin/categories/${id}`);
      toast.success('Category deleted');
      fetchData();
    } catch (err) {
      toast.error('Delete failed');
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
            <p className="admin-subtitle">XpensePro Management</p>
          </div>
        </div>
        <div className="admin-header-actions">
          <button className="admin-refresh-btn" onClick={fetchData}>
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

        {/* Categories Section */}
        <div className="admin-table-card" style={{ marginBottom: '2rem' }}>
          <div className="admin-table-header">
            <h2 className="admin-table-title">
              <Tag size={18} /> Global Categories ({categories.length})
            </h2>
          </div>
          <div style={{ padding: '1.5rem', display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
            {/* Add Category Form */}
            <form onSubmit={handleAddCategory} style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <input 
                type="text" 
                placeholder="Category Name" 
                className="form-input" 
                style={{ width: '200px', marginBottom: 0 }}
                value={newCat.name} 
                onChange={e => setNewCat({...newCat, name: e.target.value})} 
                required 
              />
              <select 
                className="form-input" 
                style={{ width: '120px', marginBottom: 0 }}
                value={newCat.type} 
                onChange={e => setNewCat({...newCat, type: e.target.value})}
              >
                <option value="expense">Expense</option>
                <option value="income">Income</option>
              </select>
              <input 
                type="color" 
                value={newCat.color} 
                onChange={e => setNewCat({...newCat, color: e.target.value})}
                style={{ height: '42px', width: '42px', cursor: 'pointer', background: 'transparent', border: 'none' }}
              />
              <button type="submit" className="btn btn-primary" style={{ padding: '0.6rem 1rem' }}>
                <Plus size={18} /> Add
              </button>
            </form>

            {/* List Categories */}
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', flex: 1 }}>
              {categories.map(c => (
                <div key={c._id} style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.05)', padding: '0.5rem 1rem', borderRadius: '20px', border: `1px solid ${c.color}` }}>
                  <span style={{ color: c.color, marginRight: '0.5rem', fontSize: '0.9rem' }}>{c.name}</span>
                  <button onClick={() => handleDeleteCategory(c._id)} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', display: 'flex' }}>
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
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
                  <th>Role</th>
                  <th>Status</th>
                  <th>Transactions</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {stats?.users.map((u, i) => (
                  <tr key={u.id}>
                    <td className="admin-td-num">{i + 1}</td>
                    <td className="admin-td-name">
                      {u.name} {u.id === user.id && <span style={{fontSize: '0.7rem', color: '#818cf8'}}>(You)</span>}
                    </td>
                    <td className="admin-td-email">{u.email}</td>
                    <td>
                      <span className={`admin-badge admin-badge--${u.isAdmin ? 'verified' : 'unverified'}`}>
                        {u.isAdmin ? 'Admin' : 'User'}
                      </span>
                    </td>
                    <td>
                      <span className={`admin-badge admin-badge--${u.isVerified ? 'verified' : 'unverified'}`}>
                        {u.isVerified ? '✅ Verified' : '⏳ Unverified'}
                      </span>
                    </td>
                    <td className="admin-td-center">{u.transactions}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          title="Toggle Admin Role"
                          className="admin-delete-btn"
                          style={{ background: 'rgba(129, 140, 248, 0.1)', color: '#818cf8' }}
                          onClick={() => handleToggleRole(u.id)}
                          disabled={u.id === user.id} // prevent demoting self
                        >
                          <ShieldAlert size={14} />
                        </button>
                        <button
                          title="Delete User"
                          className="admin-delete-btn"
                          onClick={() => handleDeleteUser(u.id, u.name)}
                          disabled={deleting === u.id || u.isAdmin}
                        >
                          {deleting === u.id ? <span className="loading-spinner loading-spinner--sm" /> : <Trash2 size={14} />}
                        </button>
                      </div>
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
