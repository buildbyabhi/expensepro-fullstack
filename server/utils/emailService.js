const { Resend } = require('resend');

// Initialize Resend with the API key from environment variables
const resend = new Resend(process.env.RESEND_API_KEY);

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

const sendEmailAPI = async (toEmail, toName, subject, htmlContent) => {
  if (!process.env.RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY is missing in environment variables');
  }

  const { data, error } = await resend.emails.send({
    from: 'XpensePro <onboarding@resend.dev>',
    to: toEmail,
    subject: subject,
    html: htmlContent
  });

  if (error) {
    throw new Error(`Resend API Error: ${error.message}`);
  }

  return data;
};

// Send OTP email
const sendOTPEmail = async (email, name, otp) => {
  const html = `
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
  await sendEmailAPI(email, name, '🔐 Verify Your XpensePro Account', html);
};

// Send Password Reset Email
const sendResetPasswordEmail = async (email, name, resetUrl) => {
  const html = `
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
  await sendEmailAPI(email, name, '🔒 Reset Your XpensePro Password', html);
};

module.exports = { generateOTP, sendOTPEmail, sendResetPasswordEmail };
