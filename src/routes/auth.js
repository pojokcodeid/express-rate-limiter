import express from "express";
import { rateLimit } from "express-rate-limit";
import { RedisStore } from "rate-limit-redis";
import { createClient } from "redis";

const router = express.Router();
const redisClient = createClient({ url: process.env.REDIS_URL });
await redisClient.connect();

// limiter untuk aksi login (lebih ketat)
const loginLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 menit
  max: 5, // hanya 5 percobaan login per 10 menit per IP
  message: {
    status: 429,
    error: "Terlalu banyak percobaan login — coba lagi nanti.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore({
    sendCommand: (...args) => redisClient.sendCommand(args),
  }),
});

// gunakan limiter hanya untuk endpoint ini
router.post("/login", loginLimiter, (req, res) => {
  const data = req.body;
  if (
    data == undefined ||
    data.username == undefined ||
    data.password == undefined
  ) {
    return res.status(401).json({ ok: false, error: "Invalid credentials" });
  }
  // contoh login dummy
  if (data.username === "admin" && data.password === "12345") {
    return res.json({ ok: true, token: "fake-jwt-token" });
  }
  return res.status(401).json({ ok: false, error: "Invalid credentials" });
});

export default router;
