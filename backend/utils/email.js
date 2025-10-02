// utils/email.js
import nodemailer from "nodemailer";

export async function sendEmail(to, subject, text, html) {
  // Zoho SMTP transporter
  const transporter = nodemailer.createTransport({
    host: "smtp.zoho.com",
    port: 465,       // SSL port
    secure: true,    // true for port 465
    auth: {
      user: process.env.EMAIL_USER,  // your full Zoho email
      pass: process.env.EMAIL_PASS,  // Zoho app password
    },
  });

  const mailOptions = {
    from: `"Healthcare Booking" <${process.env.EMAIL_USER}>`, // must match Zoho email
    to,
    subject,
    text,
    html,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Email sent to ${to}`);
  } catch (error) {
    console.error("Error sending email:", error);
    throw error; // keeps 500 error in API if sending fails
  }
}
