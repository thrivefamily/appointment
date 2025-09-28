// api/admin-login.js
import jwt from "jsonwebtoken";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Only POST requests allowed" });
  }

  const { username, password } = req.body;

  // Check against env variables (can also use MongoDB users collection)
  if (
    username === process.env.ADMIN_USER &&
    password === process.env.ADMIN_PASS
  ) {
    // Sign JWT token
    const token = jwt.sign(
      { role: "admin", username },
      process.env.JWT_SECRET,
      { expiresIn: "2h" }
    );

    return res.status(200).json({ token });
  }

  return res.status(401).json({ message: "Invalid credentials" });
}
