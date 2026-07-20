const nodemailer = require('nodemailer');
const { Resend } = require('resend');

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.SMTP_EMAIL,
      pass: process.env.SMTP_PASSWORD,
    }
  });
};

// Helper function for Brevo HTTP API
const sendViaBrevo = async (to, subject, htmlContent) => {
  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': process.env.BREVO_API_KEY,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({
      sender: { name: 'XpensePro', email: process.env.SMTP_EMAIL || 'noreply@expensepro.com' },
      to: [{ email: to }],
      subject: subject,
      htmlContent: htmlContent
    })
  });
  
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Brevo API Error');
  }
};

// Generate 6-digit OTP
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// Send OTP email
const sendOTPEmail = async (email, name, otp) => {
  const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; background: #0f0f1e; color: #fff; border-radius: 12px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #818cf8, #a78bfa); padding: 30px; text-align: center;">
          <h1 style="margin: 0; font-size: 28px;">💰 XpensePro</h1>
          <p style="margin: 8px 0 0; opacity: 0.9;">Smart Expense Tracker</p>
        </div>
        <div style="padding: 30px;">
          <h2 style="color: #e2e8f0;">Hi ${name}! 👋</h2>
          <p style="color: #94a3b8;">Your one-time verification code is:</p>
          <div style="background: #1e1e3a; border: 2px solid #818cf8; border-radius: 12px; padding: 20px; text-align: center; margin: 20px 0;">
            <span style="font-size: 42px; font-weight: bold; letter-spacing: 12px; color: #818cf8;">${otp}</span>
          </div>
          <p style="color: #94a3b8;">⏰ This code expires in <strong style="color: #fff;">10 minutes</strong>.</p>
          <p style="color: #94a3b8;">If you didn't sign up for XpensePro, ignore this email.</p>
        </div>
        <div style="background: #1e1e3a; padding: 16px; text-align: center;">
          <p style="color: #64748b; margin: 0; font-size: 12px;">© 2026 XpensePro. All rights reserved.</p>
        </div>
      </div>
    `;

  if (process.env.BREVO_API_KEY) {
    await sendViaBrevo(email, '🔐 Verify Your XpensePro Account', htmlContent);
  } else if (resend) {
    const { data, error } = await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: email,
      subject: '🔐 Verify Your XpensePro Account',
      html: htmlContent
    });
    if (error) throw new Error(error.message || 'Resend API Error');
  } else {
    const transporter = createTransporter();
    await transporter.sendMail({
      from: `"XpensePro" <${process.env.SMTP_EMAIL}>`,
      to: email,
      subject: '🔐 Verify Your XpensePro Account',
      html: htmlContent
    });
  }
};

// Send Password Reset Email
const sendResetPasswordEmail = async (email, name, resetUrl) => {
  const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; background: #0f0f1e; color: #fff; border-radius: 12px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #f43f5e, #fb7185); padding: 30px; text-align: center;">
          <h1 style="margin: 0; font-size: 28px;">💰 XpensePro</h1>
          <p style="margin: 8px 0 0; opacity: 0.9;">Account Recovery</p>
        </div>
        <div style="padding: 30px;">
          <h2 style="color: #e2e8f0;">Hi ${name},</h2>
          <p style="color: #94a3b8;">You requested a password reset. Click the button below to set a new password:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background: #f43f5e; color: #fff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Reset Password</a>
          </div>
          <p style="color: #94a3b8;">⏰ This link expires in <strong style="color: #fff;">10 minutes</strong>.</p>
          <p style="color: #94a3b8;">If you didn't request a password reset, you can safely ignore this email.</p>
        </div>
        <div style="background: #1e1e3a; padding: 16px; text-align: center;">
          <p style="color: #64748b; margin: 0; font-size: 12px;">© 2026 XpensePro. All rights reserved.</p>
        </div>
      </div>
    `;

  if (process.env.BREVO_API_KEY) {
    await sendViaBrevo(email, '🔒 Reset Your XpensePro Password', htmlContent);
  } else if (resend) {
    const { data, error } = await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: email,
      subject: '🔒 Reset Your XpensePro Password',
      html: htmlContent
    });
    if (error) throw new Error(error.message || 'Resend API Error');
  } else {
    const transporter = createTransporter();
    await transporter.sendMail({
      from: `"XpensePro" <${process.env.SMTP_EMAIL}>`,
      to: email,
      subject: '🔒 Reset Your XpensePro Password',
      html: htmlContent
    });
  }
};

module.exports = { generateOTP, sendOTPEmail, sendResetPasswordEmail };
