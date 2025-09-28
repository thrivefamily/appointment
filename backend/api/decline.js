// api/decline.js
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
      { $set: { status: "declined" } }
    );

    // Send email to patient
    await sendEmail(
      appointment.email,
      "Appointment Declined",
      "Your healthcare appointment request has been declined.",
      `<h2>Appointment Declined</h2>
       <p>Dear ${appointment.name},</p>
       <p>Unfortunately, your appointment on ${appointment.date} at ${appointment.time} has been declined.</p>`
    );

    res.status(200).json({ message: "Appointment declined and email sent" });
  } catch (error) {
    console.error("Error declining appointment:", error);
    res.status(500).json({ message: "Error declining appointment" });
  }
}
