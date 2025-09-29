// api/approve.js
import clientPromise from "../utils/db.js";
import jwt from "jsonwebtoken";
import { ObjectId } from "mongodb";

export default async function handler(req, res) {
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

    await db.collection("appointments").updateOne(
      { _id: new ObjectId(id) },
      { $set: { status: "approved" } }
    );

    res.status(200).json({ message: "Appointment approved successfully" });
  } catch (err) {
    console.error("Error approving appointment:", err);
    res.status(500).json({ message: "Failed to approve appointment" });
  }
}
