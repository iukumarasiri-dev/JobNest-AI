import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

async function sendMail(to: string, subject: string, html: string) {
  try {
    await transporter.sendMail({
      from: `"JobNest AI" <${process.env.GMAIL_USER}>`,
      to,
      subject,
      html,
    });
  } catch (err) {
    console.error(`Failed to send email to ${to}:`, err);
  }
}

export function sendLoginNotificationEmail(to: string, name: string | null) {
  return sendMail(
    to,
    "New login to your JobNest AI account",
    `<p>Hi ${name ?? "there"},</p>
     <p>We noticed a new login to your JobNest AI account just now.</p>
     <p>If this was you, no action is needed. If you don't recognize this activity, please reset your password immediately.</p>`
  );
}

export function sendPasswordResetEmail(to: string, resetUrl: string) {
  return sendMail(
    to,
    "Reset your JobNest AI password",
    `<p>We received a request to reset your JobNest AI password.</p>
     <p><a href="${resetUrl}">Click here to reset your password</a>. This link expires in 15 minutes.</p>
     <p>If you didn't request this, you can safely ignore this email.</p>`
  );
}

export function sendPasswordChangedEmail(to: string) {
  return sendMail(
    to,
    "Your JobNest AI password was changed",
    `<p>Your JobNest AI password was just changed.</p>
     <p>If you didn't make this change, please contact support immediately.</p>`
  );
}
