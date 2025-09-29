// api/book.js
import clientPromise from "../utils/db.js";
import { sendEmail } from "../utils/email.js";

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*'); // allow any frontend origin
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ message: "Only POST requests allowed" });
  }
try {
  const data = req.body;

  // DEBUG: log the incoming booking data
  console.log("Booking data received:", data);

  const client = await clientPromise;
  const db = client.db("healthcare");
  const appointments = db.collection("appointments");

  // Save to MongoDB
  await appointments.insertOne({
    ...data,
    status: "pending",
    createdAt: new Date(),
  });

  // Send notification to two admin emails
  const adminEmails = ["ayomikunleadejuwon@gmail.com", "adejuwonayomikunle@gmail.com"];
  await sendEmail(
    adminEmails,
    "New Appointment Booking",
    `A new appointment has been booked by ${data.name}`,
    `<h2>New Appointment</h2>
     <p><b>Name:</b> ${data.name}</p>
     <p><b>Email:</b> ${data.email}</p>
     <p><b>Phone:</b> ${data.phone}</p>
     <p><b>Occupation:</b> ${data.occupation}</p>
     <p><b>Allergies:</b> ${data.allergies}</p>
     <p><b>Date:</b> ${data.date}</p>
     <p><b>Time:</b> ${data.time}</p>
     <p><b>Message:</b> ${data.message}</p>`
  );

  res.status(201).json({ message: "Appointment booked successfully!" });
} catch (error) {
  console.error("Error booking appointment:", error);
  res.status(500).json({ message: "Error booking appointment" });
}
  }

