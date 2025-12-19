import { Router } from "express";
import { query } from "../config/db";

const router = Router();

// GET /stores?city=Araria&category=GROCERY
router.get("/", async (req, res) => {
  try {
    const city = (req.query.city as string) || "Araria";
    const category = req.query.category as string | undefined;

    const params: any[] = [city];
    let sql = `
      SELECT id, name, address, city, pincode, category
      FROM stores
      WHERE city = $1
    `;

    if (category) {
      params.push(category.toUpperCase());
      sql += " AND category = $2";
    }

    const stores = await query(sql, params);
    res.json(stores);
  } catch (err) {
    console.error("GET /stores error", err);
    res.status(500).json({ message: "Failed to fetch stores" });
  }
});

// GET /stores/:id/products
router.get("/:id/products", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      return res.status(400).json({ message: "Invalid store id" });
    }

    const products = await query(
      `
      SELECT id, name, unit, app_price AS price
      FROM products
      WHERE store_id = $1
      ORDER BY id
    `,
      [id]
    );

    res.json(products);
  } catch (err) {
    console.error("GET /stores/:id/products error", err);
    res.status(500).json({ message: "Failed to fetch products" });
  }
});

export default router;
