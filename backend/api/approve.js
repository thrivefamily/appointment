// api/approve.js
import clientPromise from "../utils/db.js";
import { sendEmail } from "../utils/email.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Only POST requests allowed" });
  }

  try {
    const { id } = req.body;

    const client = await clientPromise;
    const db = client.db("healthcare");
    const appointments = db.collection("appointments");

    const appointment = await appointments.findOne({ _id: new ObjectId(id) });

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

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
  } catch (error) {
    console.error("Error approving appointment:", error);
    res.status(500).json({ message: "Error approving appointment" });
  }
}
