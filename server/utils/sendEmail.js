const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  // 1. Create a transporter
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'sandbox.smtp.mailtrap.io',
    port: process.env.EMAIL_PORT || 2525,
    auth: {
      user: process.env.EMAIL_USER || 'placeholder_user',
      pass: process.env.EMAIL_PASS || 'placeholder_pass',
    },
  });

  // 2. Define email options
  const message = {
    from: `${process.env.FROM_NAME || 'Team Task Manager'} <${process.env.FROM_EMAIL || 'noreply@teamtaskmanager.com'}>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
  };

  // 3. Send email
  await transporter.sendMail(message);
};

module.exports = sendEmail;
