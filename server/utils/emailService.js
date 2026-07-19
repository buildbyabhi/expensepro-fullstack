// We removed Nodemailer because Render's free tier blocks SMTP (ports 465/587).
// Instead, we use an HTTP API (Brevo/Sendinblue) to send emails which uses port 443.

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

const sendEmailAPI = async (toEmail, toName, subject, htmlContent) => {
  // Use BREVO_API_KEY from env, or fallback to RESEND_API_KEY if you choose Resend
  const brevoKey = process.env.BREVO_API_KEY;
  const resendKey = process.env.RESEND_API_KEY;

  if (brevoKey) {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': brevoKey,
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        sender: { name: 'XpensePro', email: process.env.SMTP_EMAIL || 'support@xpensepro.com' },
        to: [{ email: toEmail, name: toName }],
        subject: subject,
        htmlContent: htmlContent
      })
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Brevo API Error: ${err}`);
    }
    return;
  } 
  
  if (resendKey) {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        // For Resend free tier, you MUST use onboarding@resend.dev unless you verify a custom domain
        from: 'XpensePro <onboarding@resend.dev>',
        to: [toEmail],
        subject: subject,
        html: htmlContent
      })
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Resend API Error: ${err}`);
    }
    return;
  }

  throw new Error('No Email API Key provided! Please set BREVO_API_KEY or RESEND_API_KEY in your environment variables.');
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
