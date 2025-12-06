// index.js
import express from "express";
import { rateLimit } from "express-rate-limit";
import authRouter from "./routes/auth.js";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());

// jika aplikasi berjalan di belakang proxy (nginx, cloud provider), set ini
// supaya express dapat membaca IP klien yang benar
app.set("trust proxy", 1);

/**
 * Global limiter (contoh):
 * - windowMs: durasi window (ms)
 * - max: maks request per IP per window
 */
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 menit
  max: 100, // limit setiap IP => 100 request per 15 menit
  standardHeaders: true, // kirim RateLimit-* headers
  legacyHeaders: false, // matikan X-RateLimit-* headers lama
  message: {
    status: 429,
    error: "Too many requests, please try again later.",
  },
});

// Pasang limiter global untuk semua route API
app.use("/api/", globalLimiter);

// route contoh tanpa limiter tambahan
app.get("/", (req, res) => {
  res.json({ message: "Hello from Express 5 + express-rate-limit" });
});

// route auth memiliki limiter sendiri (lebih ketat)
app.use("/api/auth", authRouter);

// error handler sederhana
app.use((err, req, res, next) => {
  console.error(err);
  res
    .status(err.status || 500)
    .json({ error: err.message || "internal error" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server listening on :${PORT}`));
