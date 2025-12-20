import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { pool } from "./lib/db";
import adminRouter from "./routes/admin";
import authRouter from "./routes/auth";
import categoriesRouter from "./routes/categories";
import cognitoAuthRouter from "./routes/cognito-auth";
import productsRouter from "./routes/products";
import shopsRouter from "./routes/shops";
import townsRouter from "./routes/towns";
import uploadRouter from "./routes/upload";

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

app.use("/auth", authRouter); // Old JWT auth (for existing users)
app.use("/cognito-auth", cognitoAuthRouter); // New Cognito auth
app.use("/upload", uploadRouter);
app.use("/admin", adminRouter); // Admin routes
app.use("/api/towns", townsRouter); // Towns API
app.use("/api/categories", categoriesRouter); // Categories API
app.use("/api/shops", shopsRouter); // Shops API
app.use("/api/products", productsRouter); // Products API
app.use("/api/addresses", require("./routes/addresses").default); // Addresses API
app.use("/api/orders", require("./routes/orders").default); // Orders API

const PORT = Number(process.env.PORT) || 4000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Backend running on http://0.0.0.0:${PORT}`);
});
