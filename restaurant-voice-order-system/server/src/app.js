import cors from "cors";
import express from "express";
import morgan from "morgan";
import "./config/env.js";

import authRoutes from "./routes/auth.js";
import orderRoutes from "./routes/orders.js";
import voiceRoutes from "./routes/twilio-webhook.js";

const app = express();
const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";

app.use(
  cors({
    origin: clientUrl,
    credentials: true,
  }),
);
app.use(morgan("dev"));
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

app.get("/api/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

app.use("/api/auth", authRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/voice", voiceRoutes);

app.use((_req, res) => {
  res.status(404).json({ message: "Route not found" });
});

app.use((err, _req, res, _next) => {
  console.error(err);

  if (res.headersSent) {
    return;
  }

  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal server error";

  res.status(statusCode).json({ message });
});

export default app;
