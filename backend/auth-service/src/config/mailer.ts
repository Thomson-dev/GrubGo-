import nodemailer from 'nodemailer';

// Works with Gmail, Outlook, or any SMTP provider
// For Gmail: enable App Passwords (2FA required) and use as SMTP_PASS
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT ?? 587),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const sendOtpEmail = async (to: string, otp: string): Promise<void> => {
  await transporter.sendMail({
    from: `"Food Ordering App" <${process.env.SMTP_USER}>`,
    to,
    subject: 'Your verification code',
    html: `
      <div style="font-family: sans-serif; max-width: 400px; margin: auto;">
        <h2>Verify your email</h2>
        <p>Your one-time verification code is:</p>
        <h1 style="letter-spacing: 8px; color: #e85d04;">${otp}</h1>
        <p>This code expires in <strong>10 minutes</strong>.</p>
        <p>If you didn't request this, ignore this email.</p>
      </div>
    `,
  });
};
