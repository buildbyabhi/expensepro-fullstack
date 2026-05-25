const express  = require('express');
const router   = express.Router();
const { protect } = require('../middleware/auth');
const { getBudget, setBudget } = require('../controllers/budgetController');

router.use(protect);
router.get('/',  getBudget);
router.post('/', setBudget);

module.exports = router;
