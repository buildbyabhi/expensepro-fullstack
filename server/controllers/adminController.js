const User        = require('../models/User');
const Transaction = require('../models/Transaction');

// ── Admin Stats ───────────────────────────────────────────────────────────────
const getAdminStats = async (req, res) => {
  try {
    const [totalUsers, verifiedUsers, totalTransactions, recentUsers] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isVerified: true }),
      Transaction.countDocuments(),
      User.find().sort({ createdAt: -1 }).limit(50).select('name email isVerified createdAt'),
    ]);

    // Transaction count per user
    const txPerUser = await Transaction.aggregate([
      { $group: { _id: '$user', count: { $sum: 1 }, totalAmount: { $sum: '$amount' } } },
    ]);
    const txMap = {};
    txPerUser.forEach((t) => { txMap[t._id.toString()] = { count: t.count, total: t.totalAmount }; });

    const usersWithStats = recentUsers.map((u) => ({
      id: u._id,
      name: u.name,
      email: u.email,
      isVerified: u.isVerified,
      joinedAt: u.createdAt,
      transactions: txMap[u._id.toString()]?.count || 0,
      totalSpent: txMap[u._id.toString()]?.total || 0,
    }));

    res.json({
      success: true,
      stats: { totalUsers, verifiedUsers, unverifiedUsers: totalUsers - verifiedUsers, totalTransactions },
      users: usersWithStats,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── Delete User (Admin) ───────────────────────────────────────────────────────
const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (user.isAdmin) return res.status(403).json({ success: false, message: 'Cannot delete admin' });
    await Transaction.deleteMany({ user: user._id });
    await user.deleteOne();
    res.json({ success: true, message: 'User and all their data deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getAdminStats, deleteUser };
