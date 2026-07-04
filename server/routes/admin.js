const express = require('express');
const router  = express.Router();
const { protect } = require('../middleware/auth');
const { getAdminStats, deleteUser, updateUserRole, addCategory, deleteCategory } = require('../controllers/adminController');

// Admin middleware
const adminOnly = (req, res, next) => {
  if (!req.user.isAdmin)
    return res.status(403).json({ success: false, message: 'Admin access required' });
  next();
};

router.use(protect, adminOnly);
router.get('/stats', getAdminStats);
router.delete('/users/:id', deleteUser);
router.put('/users/:id/role', updateUserRole);
router.post('/categories', addCategory);
router.delete('/categories/:id', deleteCategory);

module.exports = router;
