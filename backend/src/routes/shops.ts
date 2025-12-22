// backend/src/routes/shops.ts
// API routes for shops

import express from 'express';
import { pool } from '../lib/db';

const router = express.Router();

// GET /api/shops - Get shops with filters
router.get('/', async (req, res) => {
    try {
        const { town_id, category_id, search, is_open, sort = 'rating' } = req.query;

        let query = `
      SELECT s.*, 
        t.name as town_name,
        c.name as category_name
      FROM shops s
      LEFT JOIN towns t ON s.town_id = t.id
      LEFT JOIN categories c ON s.category_id = c.id
      WHERE s.is_active = true AND s.is_approved = true
    `;
        const params: any[] = [];

        if (town_id) {
            params.push(town_id);
            query += ` AND s.town_id = $${params.length}`;
        }

        if (category_id) {
            // Check if category_id is a slug or UUID
            const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(category_id as string);

            if (isUUID) {
                params.push(category_id);
                query += ` AND s.category_id = $${params.length}`;
            } else {
                // It's a slug, join with categories table
                params.push(category_id);
                query += ` AND c.slug = $${params.length}`;
            }
        }

        if (search) {
            params.push(`%${search}%`);
            query += ` AND (s.name ILIKE $${params.length} OR s.description ILIKE $${params.length})`;
        }

        if (is_open === 'true') {
            query += ` AND s.is_open = true`;
        }

        // Sorting
        let orderBy = 's.is_featured DESC';
        if (sort === 'rating') {
            orderBy += ', s.rating DESC, s.total_reviews DESC';
        } else if (sort === 'orders') {
            orderBy += ', s.total_orders DESC';
        } else if (sort === 'name') {
            orderBy += ', s.name ASC';
        } else {
            orderBy += ', s.created_at DESC';
        }
        query += ` ORDER BY ${orderBy}`;

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (error: any) {
        console.error('Get shops error:', error);
        res.status(500).json({ error: 'Failed to fetch shops' });
    }
});

// GET /api/shops/:id - Get single shop with details
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(`
      SELECT s.*, 
        t.name as town_name,
        c.name as category_name,
        u.name as owner_name,
        u.email as owner_email
      FROM shops s
      LEFT JOIN towns t ON s.town_id = t.id
      LEFT JOIN categories c ON s.category_id = c.id
      LEFT JOIN users u ON s.owner_id = u.id
      WHERE s.id = $1 AND s.is_active = true AND s.is_approved = true
    `, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Shop not found' });
        }

        res.json(result.rows[0]);
    } catch (error: any) {
        console.error('Get shop error:', error);
        res.status(500).json({ error: 'Failed to fetch shop' });
    }
});

// GET /api/shops/:id/products - Get products for a shop
router.get('/:id/products', async (req, res) => {
    try {
        const { id } = req.params;
        const { category_id, search, in_stock, sort = 'featured' } = req.query;

        let query = `
      SELECT p.*, c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.shop_id = $1 AND p.is_available = true
    `;
        const params: any[] = [id];

        if (category_id) {
            params.push(category_id);
            query += ` AND p.category_id = $${params.length}`;
        }

        if (search) {
            params.push(`%${search}%`);
            query += ` AND (p.name ILIKE $${params.length} OR p.description ILIKE $${params.length})`;
        }

        if (in_stock === 'true') {
            query += ` AND p.stock_quantity > 0`;
        }

        // Sorting
        if (sort === 'featured') {
            query += ' ORDER BY p.is_featured DESC, p.rating DESC';
        } else if (sort === 'price_low') {
            query += ' ORDER BY p.price ASC';
        } else if (sort === 'price_high') {
            query += ' ORDER BY p.price DESC';
        } else if (sort === 'rating') {
            query += ' ORDER BY p.rating DESC';
        } else {
            query += ' ORDER BY p.created_at DESC';
        }

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (error: any) {
        console.error('Get shop products error:', error);
        res.status(500).json({ error: 'Failed to fetch products' });
    }
});

// GET /api/shops/:id/coupons - Get active coupons for a shop
router.get('/:id/coupons', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(`
            SELECT id, code, discount_type, discount_value, min_order_amount, valid_until
            FROM coupons
            WHERE shop_id = $1 
            AND is_active = true 
            AND (valid_until IS NULL OR valid_until > NOW())
            ORDER BY created_at DESC
        `, [id]);
        res.json(result.rows);
    } catch (error) {
        console.error('Get shop coupons error:', error);
        res.status(500).json({ error: 'Failed to fetch coupons' });
    }
});

export default router;
