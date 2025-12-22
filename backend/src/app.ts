import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { pool } from "./lib/db";
import adminRouter from "./routes/admin";
import authRouter from "./routes/auth";
import categoriesRouter from "./routes/categories";
import cognitoAuthRouter from "./routes/cognito-auth";
import productsRouter from "./routes/products";
import shopOwnerRouter from "./routes/shop-owner";
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

import { cacheMiddleware } from "./middleware/cache";

app.use("/auth", authRouter); // Old JWT auth (for existing users)
app.use("/cognito-auth", cognitoAuthRouter); // New Cognito auth
app.use("/upload", uploadRouter);
app.use("/admin", adminRouter); // Admin routes
app.use("/api/towns", cacheMiddleware(3600), townsRouter); // Towns API (1hr cache)
app.use("/api/categories", cacheMiddleware(3600), categoriesRouter); // Categories API (1hr cache)
app.use("/api/shops", cacheMiddleware(300), shopsRouter); // Shops API (5min cache)
app.use("/api/products", productsRouter); // Products API
app.use("/api/addresses", require("./routes/addresses").default); // Addresses API
app.use("/api/orders", require("./routes/orders").default); // Orders API

// Shop Owner Portal APIs
app.use("/api/shop-owner", shopOwnerRouter); // Shop owner profile & registration (and sub-routes)

import { createServer } from "http";
import { initSocket } from "./lib/socket";

// ... existing code ...
const httpServer = createServer(app);

// Initialize Socket.io
initSocket(httpServer);

const PORT = Number(process.env.PORT) || 4000;
httpServer.listen(PORT, "0.0.0.0", () => {
  console.log(`Backend running on http://0.0.0.0:${PORT}`);
  console.log(`🚀 Real-time sync portal active`);
});
