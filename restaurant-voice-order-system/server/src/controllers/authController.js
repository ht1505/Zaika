import jwt from "jsonwebtoken";

export const loginAdmin = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  const adminEmail = process.env.ADMIN_EMAIL || "admin@zaika.local";
  const adminPassword = process.env.ADMIN_PASSWORD || "ChangeMe123!";

  if (email !== adminEmail || password !== adminPassword) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const jwtSecret = process.env.JWT_SECRET;

  if (!jwtSecret) {
    return res.status(500).json({ message: "JWT_SECRET is not configured" });
  }

  const token = jwt.sign({ sub: adminEmail, role: "admin" }, jwtSecret, {
    expiresIn: "12h",
  });

  return res.status(200).json({ token });
};

export const getCurrentAdmin = async (req, res) => {
  return res.status(200).json({
    user: {
      email: req.user?.sub,
      role: req.user?.role || "admin",
    },
  });
};
