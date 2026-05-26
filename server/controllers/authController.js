const User = require('../models/User');
const jwt  = require('jsonwebtoken');
const { generateOTP, sendOTPEmail } = require('../utils/emailService');

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

    if (user && !user.isVerified) {
      // If user exists but was not verified, verify them now and update password/name
      user.name = name;
      user.password = password;
      user.isVerified = true;
      user.otp = undefined;
      user.otpExpiry = undefined;
      await user.save();
    } else {
      // Create a brand new verified user
      user = await User.create({
        name,
        email,
        password,
        isVerified: true,
      });
    }

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'Registration successful!',
      token,
      user: userPayload(user),
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

module.exports = { register, verifyOTP, resendOTP, login, getMe };
