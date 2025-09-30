// api/approve.js
import clientPromise from "../utils/db.js";
import jwt from "jsonwebtoken";
import { ObjectId } from "mongodb";
import nodemailer from "nodemailer";

export default async function handler(req, res) {
  // 🔹 Add CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

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

    // 🔹 Find appointment first (to get email + name)
    const appointment = await db.collection("appointments").findOne({
      _id: new ObjectId(id),
    });

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    // 🔹 Update status
    const result = await db.collection("appointments").updateOne(
      { _id: new ObjectId(id) },
      { $set: { status: "approved", updatedAt: new Date() } }
    );

    if (result.modifiedCount === 0) {
      return res.status(404).json({ message: "Failed to update appointment" });
    }

    // 🔹 Send email
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER, // your gmail
        pass: process.env.EMAIL_PASS, // your app password
      },
    });

    await transporter.sendMail({
      from: `"Healthcare Admin" <${process.env.EMAIL_USER}>`,
      to: appointment.email,
  subject: "✅ Appointment Confirmation – Your Booking Has Been Approved",

html: `
  <div style="font-family: Arial, sans-serif; line-height:1.6; color:#333; padding:20px;">
    <h2 style="color:#0d6efd;">Dear ${appointment.name},</h2>

    <p>We are pleased to inform you that your appointment request has been <strong style="color:green;">approved</strong>.</p>

    <div style="margin:20px 0; padding:15px; border:1px solid #ddd; border-radius:8px; background:#f9f9f9;">
      <h3 style="margin-top:0; color:#0d6efd;">📅 Appointment Details</h3>
      <p><strong>Date:</strong> ${appointment.date}</p>
      <p><strong>Time:</strong> ${appointment.time}</p>
   
    </div>

    <p>Please ensure to arrive at least <strong>10 minutes earlier</strong> to complete any required preparations.</p>

    <p>If you have any questions or need to reschedule, feel free to contact us at 
    <a href="mailto:${process.env.EMAIL_USER}">${process.env.EMAIL_USER}</a>.</p>

    <br/>
    <p style="margin:0;">Warm regards,</p>
    <p style="margin:0; font-weight:bold; color:#0d6efd;">Healthcare Team</p>
  </div>
`

    });

    res.status(200).json({ message: "Appointment approved and email sent!" });
  } catch (err) {
    console.error("Error approving appointment:", err);
    res.status(500).json({ message: "Failed to approve appointment" });
  }
}
