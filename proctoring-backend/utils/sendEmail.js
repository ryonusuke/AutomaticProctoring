const nodemailer = require('nodemailer');

const sendEmail = async ({ to, subject, html }) => {
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com', // use hostname, not hardcoded IP
    port: 465,              // 465 is more reliable than 587 on cloud
    secure: true,           // true for 465
    family: 4,              // 👈 forces IPv4, fixes ENETUNREACH
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });

  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to,
    subject,
    html,
  });
};

module.exports = sendEmail;
