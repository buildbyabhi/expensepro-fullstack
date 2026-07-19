const User = require('../models/User');
const jwt  = require('jsonwebtoken');
const crypto = require('crypto');
const { generateOTP, sendOTPEmail, sendResetPasswordEmail } = require('../utils/emailService');
const speakeasy = require('speakeasy');
const qrcode = require('qrcode');

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '30d' });

const userPayload = (user) => ({
  id: user._id, name: user.name, email: user.email,
  avatar: user.avatar, currency: user.currency, isAdmin: user.isAdmin,
});

// ── Register ─────────────────────────────────────────────────────────────────
const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ success: false, message: 'Please provide all fields' });

    let user = await User.findOne({ email });
    if (user && user.isVerified)
      return res.status(400).json({ success: false, message: 'Email already registered' });

    const otp = generateOTP();

    if (user && !user.isVerified) {
      // If user exists but was not verified, update password/name and send new OTP
      user.name = name;
      user.password = password;
      user.otp = otp;
      user.otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
      await user.save();
    } else {
      // Create a brand new unverified user
      user = await User.create({
        name,
        email,
        password,
        isVerified: false,
        otp,
        otpExpiry: new Date(Date.now() + 10 * 60 * 1000),
      });
    }

    // Send OTP Email
    await sendOTPEmail(user.email, user.name, otp);

    res.status(201).json({
      success: true,
      message: 'Registration successful! Please verify your email.',
      user: { email: user.email }, // Do not send token yet
    });
  } catch (error) {
    console.error('Register error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── Verify OTP ────────────────────────────────────────────────────────────────
const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp)
      return res.status(400).json({ success: false, message: 'Email and OTP are required' });

    const user = await User.findOne({ email }).select('+otp +otpExpiry');
    if (!user)
      return res.status(404).json({ success: false, message: 'User not found' });

    if (user.isVerified)
      return res.status(400).json({ success: false, message: 'Email already verified' });

    if (!user.otp || user.otp !== otp)
      return res.status(400).json({ success: false, message: 'Invalid OTP' });

    if (user.otpExpiry < new Date())
      return res.status(400).json({ success: false, message: 'OTP expired. Please register again.' });

    user.isVerified = true;
    user.otp        = undefined;
    user.otpExpiry  = undefined;
    await user.save();

    const token = generateToken(user._id);
    res.status(200).json({ success: true, token, user: userPayload(user) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── Resend OTP ────────────────────────────────────────────────────────────────
const resendOTP = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email }).select('+otp +otpExpiry');
    if (!user)
      return res.status(404).json({ success: false, message: 'User not found' });
    if (user.isVerified)
      return res.status(400).json({ success: false, message: 'Email already verified' });

    const otp = generateOTP();
    user.otp       = otp;
    user.otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();
    await sendOTPEmail(email, user.name, otp);

    res.json({ success: true, message: 'New OTP sent to your email' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── Login ─────────────────────────────────────────────────────────────────────
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ success: false, message: 'Please provide email and password' });

    const user = await User.findOne({ email }).select('+password');
    if (!user)
      return res.status(401).json({ success: false, message: 'Invalid credentials' });

    // Auto-verify old accounts that existed before OTP system
    if (!user.isVerified) {
      user.isVerified = true;
      await user.save();
    }


    const isMatch = await user.matchPassword(password);
    if (!isMatch)
      return res.status(401).json({ success: false, message: 'Invalid credentials' });

    if (user.isTfaEnabled) {
      return res.status(200).json({ success: true, requires2FA: true, email: user.email, message: '2FA code required' });
    }

    const token = generateToken(user._id);
    res.status(200).json({ success: true, token, user: userPayload(user) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── Get Me ────────────────────────────────────────────────────────────────────
const getMe = async (req, res) => {
  res.status(200).json({ success: true, user: userPayload(req.user) });
};

// ── Forgot Password ───────────────────────────────────────────────────────────
const forgotPassword = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      return res.status(404).json({ success: false, message: 'There is no user with that email' });
    }

    // Generate token
    const resetToken = crypto.randomBytes(20).toString('hex');
    
    // Hash token and set to resetPasswordToken field
    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes
    await user.save({ validateBeforeSave: false });

    // Create reset url
    const origin = req.headers.origin || process.env.ALLOWED_ORIGINS.split(',')[0] || 'http://localhost:5173';
    const resetUrl = `${origin}/reset-password/${resetToken}`;

    try {
      await sendResetPasswordEmail(user.email, user.name, resetUrl);
      res.status(200).json({ success: true, message: 'Email sent' });
    } catch (err) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save({ validateBeforeSave: false });
      return res.status(500).json({ success: false, message: 'Email could not be sent: ' + err.message });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── Reset Password ────────────────────────────────────────────────────────────
const resetPassword = async (req, res) => {
  try {
    const { password } = req.body;
    if (!password) {
      return res.status(400).json({ success: false, message: 'Please provide a new password' });
    }

    // Get hashed token
    const resetPasswordToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired reset token' });
    }

    // Set new password
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.status(200).json({ success: true, message: 'Password reset successful' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── Enable 2FA ───────────────────────────────────────────────────────────────
const enableTfa = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const secret = speakeasy.generateSecret({ name: `XpensePro (${user.email})` });
    
    user.tfaSecret = secret.base32;
    await user.save();

    qrcode.toDataURL(secret.otpauth_url, (err, data_url) => {
      if (err) return res.status(500).json({ success: false, message: 'QR Code generation failed' });
      res.json({ success: true, qrCodeUrl: data_url, secret: secret.base32 });
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Verify & Activate 2FA ────────────────────────────────────────────────────
const verifyTfa = async (req, res) => {
  try {
    const { token } = req.body;
    const user = await User.findById(req.user._id);
    
    const verified = speakeasy.totp.verify({
      secret: user.tfaSecret,
      encoding: 'base32',
      token
    });

    if (verified) {
      user.isTfaEnabled = true;
      await user.save();
      return res.json({ success: true, message: '2FA enabled successfully' });
    } else {
      return res.status(400).json({ success: false, message: 'Invalid 2FA code' });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Verify Login 2FA ─────────────────────────────────────────────────────────
const verifyLoginTfa = async (req, res) => {
  try {
    const { email, token } = req.body;
    const user = await User.findOne({ email });
    
    if (!user || !user.isTfaEnabled) {
      return res.status(400).json({ success: false, message: '2FA is not enabled for this user' });
    }

    const verified = speakeasy.totp.verify({
      secret: user.tfaSecret,
      encoding: 'base32',
      token
    });

    if (verified) {
      const jwtToken = generateToken(user._id);
      return res.json({ success: true, token: jwtToken, user: userPayload(user) });
    } else {
      return res.status(401).json({ success: false, message: 'Invalid 2FA code' });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { register, verifyOTP, resendOTP, login, getMe, forgotPassword, resetPassword, enableTfa, verifyTfa, verifyLoginTfa };
