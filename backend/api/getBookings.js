// api/getBooking.js
import clientPromise from "../utils/db.js";

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*'); 
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Preflight request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== "GET") {
    return res.status(405).json({ message: "Only GET requests allowed" });
  }

  try {
    const client = await clientPromise;
    const db = client.db("healthcare");
    const appointments = db.collection("appointments");

    const allAppointments = await appointments.find().sort({ createdAt: -1 }).toArray();

    res.status(200).json({ appointments: allAppointments });
  } catch (error) {
    console.error("Error fetching appointments:", error);
    res.status(500).json({ message: "Error fetching appointments" });
  }
}
