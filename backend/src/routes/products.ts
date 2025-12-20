// backend/src/routes/products.ts
// API routes for products

import express from 'express';
import { pool } from '../lib/db';

const router = express.Router();

// GET /api/products - Search products globally
router.get('/', async (req, res) => {
    try {
        const { town_id, category_id, search, min_price, max_price, sort = 'relevance' } = req.query;

        let query = `
      SELECT p.*, 
        s.name as shop_name,
        s.town_id,
        c.name as category_name
      FROM products p
      LEFT JOIN shops s ON p.shop_id = s.id
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.is_available = true 
        AND s.is_active = true 
        AND s.is_approved = true
    `;
        const params: any[] = [];

        if (town_id) {
            params.push(town_id);
            query += ` AND s.town_id = $${params.length}`;
        }

        if (category_id) {
            params.push(category_id);
            query += ` AND p.category_id = $${params.length}`;
        }

        if (search) {
            params.push(`%${search}%`);
            query += ` AND (p.name ILIKE $${params.length} OR p.description ILIKE $${params.length} OR p.tags::text ILIKE $${params.length})`;
        }

        if (min_price) {
            params.push(min_price);
            query += ` AND p.price >= $${params.length}`;
        }

        if (max_price) {
            params.push(max_price);
            query += ` AND p.price <= $${params.length}`;
        }

        // Sorting
        if (sort === 'price_low') {
            query += ' ORDER BY p.price ASC';
        } else if (sort === 'price_high') {
            query += ' ORDER BY p.price DESC';
        } else if (sort === 'rating') {
            query += ' ORDER BY p.rating DESC';
        } else if (sort === 'popular') {
            query += ' ORDER BY p.total_sales DESC';
        } else {
            query += ' ORDER BY p.is_featured DESC, p.rating DESC';
        }

        query += ' LIMIT 100';

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (error: any) {
        console.error('Search products error:', error);
        res.status(500).json({ error: 'Failed to search products' });
    }
});

// GET /api/products/:id - Get single product with full details
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(`
      SELECT p.*, 
        s.name as shop_name,
        s.id as shop_id,
        s.rating as shop_rating,
        s.delivery_charge,
        s.min_order_amount,
        c.name as category_name
      FROM products p
      LEFT JOIN shops s ON p.shop_id = s.id
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.id = $1 AND p.is_available = true
    `, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }

        // Increment view count
        await pool.query(
            'UPDATE products SET view_count = view_count + 1 WHERE id = $1',
            [id]
        );

        res.json(result.rows[0]);
    } catch (error: any) {
        console.error('Get product error:', error);
        res.status(500).json({ error: 'Failed to fetch product' });
    }
});

// GET /api/products/:id/reviews - Get product reviews
router.get('/:id/reviews', async (req, res) => {
    try {
        const { id } = req.params;
        const { limit = 10, offset = 0 } = req.query;

        const result = await pool.query(`
      SELECT r.*, u.name as user_name
      FROM reviews r
      LEFT JOIN users u ON r.user_id = u.id
      WHERE r.product_id = $1 AND r.is_approved = true
      ORDER BY r.created_at DESC
      LIMIT $2 OFFSET $3
    `, [id, limit, offset]);

        res.json(result.rows);
    } catch (error: any) {
        console.error('Get product reviews error:', error);
        res.status(500).json({ error: 'Failed to fetch reviews' });
    }
});

export default router;
