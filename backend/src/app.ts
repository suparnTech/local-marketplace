import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { pool } from "./config/db";
import storesRouter from "./routes/stores";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", async (_req, res) => {
  try {
    const result = await pool.query("SELECT 1");
    res.json({ ok: true, db: result.rows[0] });
  } catch (e) {
    console.error("Health DB error", e);
    res.status(500).json({ ok: false });
  }
});

app.use("/stores", storesRouter);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});
