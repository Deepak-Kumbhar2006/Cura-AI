const nodemailer = require('nodemailer');

const transporter = process.env.SMTP_HOST
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })
  : null;

async function sendHighRiskAlert(alert) {
  if (!transporter || !process.env.ALERT_EMAIL_TO) return;

  await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: process.env.ALERT_EMAIL_TO,
    subject: `🚨 Cura AI High Risk Alert: ${alert.city}, ${alert.region}`,
    text: alert.message,
  });
}

module.exports = { sendHighRiskAlert };
