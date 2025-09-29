// api/approve.js
import clientPromise from "../utils/db.js";
import { ObjectId } from "mongodb";
import { sendEmail } from "../utils/email.js";
import jwt from "jsonwebtoken";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Only POST requests allowed" });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
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
    const appointments = db.collection("appointments");

    const appointment = await appointments.findOne({ _id: new ObjectId(id) });
    if (!appointment) return res.status(404).json({ message: "Appointment not found" });

    await appointments.updateOne(
      { _id: appointment._id },
      { $set: { status: "approved" } }
    );

    // Send email to patient
    await sendEmail(
      appointment.email,
      "Appointment Approved",
      "Your healthcare appointment has been approved.",
      `<h2>Appointment Approved</h2>
       <p>Dear ${appointment.name},</p>
       <p>Your appointment on ${appointment.date} at ${appointment.time} has been approved.</p>`
    );

    res.status(200).json({ message: "Appointment approved and email sent" });

  } catch (err) {
    console.error("Error approving appointment:", err);
    res.status(401).json({ message: "Invalid or expired token" });
  }
}
