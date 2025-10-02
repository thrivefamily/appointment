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
      "careme2005@yahoo.com",
      "yk4me2002@yahoo.com",
    ];

   await sendEmail(
  adminEmails,
  "New Appointment Booking",
  `A new appointment has been booked by ${data.name}`,
  `
  <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <h2 style="color: #2255aa;">New Appointment Notification</h2>
    <p>Hello Admin,</p>
    <p>A new appointment has been booked. Here are the details:</p>
    
    <table style="border-collapse: collapse; width: 100%; max-width: 600px;">
      <tr>
        <td style="padding: 8px; border: 1px solid #ddd;"><b>Name</b></td>
        <td style="padding: 8px; border: 1px solid #ddd;">${data.name}</td>
      </tr>
      <tr>
        <td style="padding: 8px; border: 1px solid #ddd;"><b>Email</b></td>
        <td style="padding: 8px; border: 1px solid #ddd;">${data.email}</td>
      </tr>
      <tr>
        <td style="padding: 8px; border: 1px solid #ddd;"><b>Phone</b></td>
        <td style="padding: 8px; border: 1px solid #ddd;">${data.phone}</td>
      </tr>
      <tr>
        <td style="padding: 8px; border: 1px solid #ddd;"><b>Occupation</b></td>
        <td style="padding: 8px; border: 1px solid #ddd;">${data.occupation}</td>
      </tr>
      <tr>
        <td style="padding: 8px; border: 1px solid #ddd;"><b>Allergies</b></td>
        <td style="padding: 8px; border: 1px solid #ddd;">${data.allergies}</td>
      </tr>
      <tr>
        <td style="padding: 8px; border: 1px solid #ddd;"><b>Service</b></td>
        <td style="padding: 8px; border: 1px solid #ddd;">${data.service}</td>
      </tr>
      <tr>
        <td style="padding: 8px; border: 1px solid #ddd;"><b>Date</b></td>
        <td style="padding: 8px; border: 1px solid #ddd;">${data.date}</td>
      </tr>
      <tr>
        <td style="padding: 8px; border: 1px solid #ddd;"><b>Time</b></td>
        <td style="padding: 8px; border: 1px solid #ddd;">${data.time}</td>
      </tr>
      <tr>
        <td style="padding: 8px; border: 1px solid #ddd;"><b>Message</b></td>
        <td style="padding: 8px; border: 1px solid #ddd;">${data.message || "N/A"}</td>
      </tr>
    </table>

    <p style="margin-top: 20px;">
      You can <a href="https://thrivingfamilyservices.com/appaointment_booking/admin/admin-login.html" style="color: #2255aa; text-decoration: none;">login here</a> to view and manage all appointments.
    </p>

    <p>Regards,<br>Appointment System</p>
  </div>
  `
);


    return res.status(201).json({ message: "Appointment booked successfully!" });
  } catch (error) {
    console.error("Error booking appointment:", error);
    return res.status(500).json({ message: "Error booking appointment" });
  }
}
