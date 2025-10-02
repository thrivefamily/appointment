// api/book.js
import clientPromise from "../utils/db.js";
import { sendEmail } from "../utils/email.js";

export default async function handler(req, res) {
  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Handle preflight OPTIONS request
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ message: "Only POST requests allowed" });
  }

  try {
    // Make sure the body is parsed as JSON
    let data;
    if (req.body && typeof req.body === "object") {
      data = req.body;
    } else {
      // parse JSON string
      data = JSON.parse(req.body);
    }

    console.log("Booking data received:", data);

    const client = await clientPromise;
    const db = client.db("healthcare");
    const appointments = db.collection("appointments");

    await appointments.insertOne({
      ...data,
      status: "pending",
      createdAt: new Date(),
    });

    const adminEmails = [
      "ayomikunleadejuwon@gmail.com",
      "adejuwonayomikunle@gmail.com",
    ];

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
       <p><b>Service:</b> ${data.service}</p>
       <p><b>Date:</b> ${data.date}</p>
       <p><b>Time:</b> ${data.time}</p>
       <p><b>Message:</b> ${data.message}</p>`
    );

    return res.status(201).json({ message: "Appointment booked successfully!" });
  } catch (error) {
    console.error("Error booking appointment:", error);
    return res.status(500).json({ message: "Error booking appointment" });
  }
}
