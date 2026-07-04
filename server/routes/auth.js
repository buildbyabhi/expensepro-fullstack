const express = require('express');
const router  = express.Router();
const { register, verifyOTP, resendOTP, login, verifyEmail, forgotPassword, resetPassword, enableTfa, verifyTfa, verifyLoginTfa, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.post('/register',   register);
router.post('/verify-otp', verifyOTP);
router.post('/resend-otp', resendOTP);
router.post('/login',      login);
router.post('/forgot-password', forgotPassword);
router.put('/reset-password/:token', resetPassword);

// 2FA
router.post('/enable-2fa', protect, enableTfa);
router.post('/verify-2fa', protect, verifyTfa);
router.post('/verify-login-2fa', verifyLoginTfa);

router.get('/me',          protect, getMe);

module.exports = router;
