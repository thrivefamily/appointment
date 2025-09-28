"" 
// utils/email.js
import nodemailer from "nodemailer";

export async function sendEmail(to, subject, text, html) {
  const transporter = nodemailer.createTransport({
    service: "gmail", // You can switch to SMTP if needed
    auth: {
      user: process.env.EMAIL_USER, // your Gmail
      pass: process.env.EMAIL_PASS, // app password
    },
  });

  const mailOptions = {
    from: `"Healthcare Booking" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    text,
    html,
  };

  await transporter.sendMail(mailOptions);
}
