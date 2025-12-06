// routes/auth.js
import express from "express";
import { rateLimit } from "express-rate-limit";

const router = express.Router();

// Limit khusus untuk route login: 5 percobaan per 10 menit dari 1 IP
const loginLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 menit
  max: 5,
  message: {
    status: 429,
    error: "Terlalu banyak percobaan login. Coba lagi nanti.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// gunakan limiter hanya di endpoint login
router.post("/login", loginLimiter, (req, res) => {
  const { username, password } = req.body;
  // contoh dummy auth
  if (username === "admin" && password === "password") {
    return res.json({ ok: true, token: "fake-jwt-token" });
  }
  return res.status(401).json({ ok: false, error: "Invalid credentials" });
});

export default router;
