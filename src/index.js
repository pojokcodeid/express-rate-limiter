import express from "express";
import dotenv from "dotenv";
import { rateLimit } from "express-rate-limit";
import { RedisStore } from "rate-limit-redis";
import { createClient } from "redis";
import authRouter from "./routes/auth.js";

dotenv.config();
const app = express();
app.use(express.json());

// sangat penting jika memakai reverse proxy (nginx, load balancer, cloudflare)
app.set("trust proxy", 1);

// 🔥 Redis Client
const redisClient = createClient({
  url: process.env.REDIS_URL,
});
redisClient.on("error", (err) => console.error("❌ Redis Error:", err));
await redisClient.connect();

// 🔥 Global rate limit menggunakan Redis sebagai store
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 menit
  max: 100, // setiap IP maksimal 100 request per 15 menit
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore({
    sendCommand: (...args) => redisClient.sendCommand(args),
  }),
  message: {
    status: 429,
    error: "Too many requests — please slow down 1.",
  },
});

// contoh route bebas (tanpa limiter)
app.get("/", (req, res) => {
  res.json({ message: "Hello from Express + Redis rate limit" });
});

// auth route (punya limiter khusus)
app.use("/api/auth", authRouter);
// pasang global limiter untuk semua route /api/*
app.use("/api/", globalLimiter);

// RESET RATE LIMIT (membersihkan semua key redis rate-limit)
app.post("/api/rate-limit/reset", async (req, res) => {
  try {
    // key yang digunakan express-rate-limit diawali "rl:" (default)
    const keys = await redisClient.keys("rl:*");

    if (keys.length > 0) {
      await redisClient.del(keys);
    }

    res.json({
      ok: true,
      message: "Rate limit Redis berhasil di-reset",
      deletedKeys: keys.length,
    });
  } catch (err) {
    console.error("Reset Redis Error:", err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// error handler
app.use((err, req, res, next) => {
  console.error("💥 Error:", err);
  res
    .status(err.status || 500)
    .json({ error: err.message || "Internal Server Error" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`🚀 Server running at http://localhost:${PORT}`),
);
