// api/appointments.js
import clientPromise from "../utils/db.js";
import jwt from "jsonwebtoken";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Only GET requests allowed" });
  }

  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Missing or invalid token" });
    }

    const token = authHeader.split(" ")[1];

    // Verify JWT token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ message: "Invalid or expired token" });
    }

    // Check admin role
    if (decoded.role !== "admin") {
      return res.status(403).json({ message: "Unauthorized" });
    }

    // Fetch appointments from MongoDB
    const client = await clientPromise;
    const db = client.db("healthcare");
    const appointmentsCollection = db.collection("appointments");

    const appointments = await appointmentsCollection
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    res.status(200).json(appointments);
  } catch (error) {
    console.error("Error fetching appointments:", error);
    res.status(500).json({ message: "Failed to fetch appointments" });
  }
}
