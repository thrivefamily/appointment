// api/decline.js
import clientPromise from "../utils/db.js";
import jwt from "jsonwebtoken";
import { ObjectId } from "mongodb";
import nodemailer from "nodemailer";

export default async function handler(req, res) {
  // 🔹 Add CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  // 🔹 Handle preflight requests
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ message: "Only POST requests allowed" });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Missing or invalid token" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== "admin") {
      return res.status(403).json({ message: "Forbidden" });
    }

    const { id } = req.body;
    if (!id) return res.status(400).json({ message: "Appointment ID required" });

    const client = await clientPromise;
    const db = client.db("healthcare");

    // Find the appointment first
    const appointment = await db.collection("appointments").findOne({ _id: new ObjectId(id) });
    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    // Update status to declined
    const result = await db.collection("appointments").updateOne(
      { _id: new ObjectId(id) },
      { $set: { status: "declined", updatedAt: new Date() } }
    );

    if (result.modifiedCount === 0) {
      return res.status(500).json({ message: "Failed to decline appointment" });
    }

    // 🔹 Setup Nodemailer
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER, // your Gmail
        pass: process.env.EMAIL_PASS, // your App Password
      },
    });

    // 🔹 Decline Email Template
    const mailOptions = {
      from: `"Healthcare Team" <${process.env.EMAIL_USER}>`,
      to: appointment.email,
      subject: "❌ Appointment Update – Your Request Has Been Declined",
      html: `
        <div style="font-family: Arial, sans-serif; line-height:1.6; color:#333; padding:20px;">
          <h2 style="color:#dc2626;">Dear ${appointment.name},</h2>

          <p>We regret to inform you that your appointment request has been 
          <strong style="color:#dc2626;">declined</strong>.</p>

          <div style="margin:20px 0; padding:15px; border:1px solid #ddd; border-radius:8px; background:#f9f9f9;">
            <h3 style="margin-top:0; color:#dc2626;">📅 Appointment Details</h3>
            <p><strong>Date:</strong> ${appointment.date}</p>
            <p><strong>Time:</strong> ${appointment.time}</p>
            <p><strong>Service:</strong> ${appointment.service}</p>
          </div>

          <p>If you believe this was a mistake or would like to reschedule, please contact us at 
          <a href="mailto:${process.env.EMAIL_USER}">${process.env.EMAIL_USER}</a>.</p>

          <br/>
          <p style="margin:0;">We appreciate your understanding,</p>
          <p style="margin:0; font-weight:bold; color:#0d6efd;">Healthcare Team</p>
        </div>
      `,
    };

    // 🔹 Send email
    await transporter.sendMail(mailOptions);

    res.status(200).json({ message: "Appointment declined and email sent successfully" });
  } catch (err) {
    console.error("Error declining appointment:", err);
    res.status(500).json({ message: "Failed to decline appointment" });
  }
}
