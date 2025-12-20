// backend/src/routes/categories.ts
// API routes for categories

import express from 'express';
import { pool } from '../lib/db';

const router = express.Router();

// GET /api/categories - Get all active categories with shop counts
router.get('/', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                c.*,
                COUNT(DISTINCT s.id) as shop_count
            FROM categories c
            LEFT JOIN shops s ON s.category_id = c.id AND s.is_active = true
            WHERE c.is_active = true
            GROUP BY c.id
            ORDER BY c.display_order ASC, c.name ASC
        `);

        res.json(result.rows);
    } catch (error: any) {
        console.error('Get categories error:', error);
        res.status(500).json({ error: 'Failed to fetch categories' });
    }
});

// GET /api/categories/:slug - Get single category by slug
router.get('/:slug', async (req, res) => {
    try {
        const { slug } = req.params;

        const result = await pool.query(
            'SELECT * FROM categories WHERE slug = $1 AND is_active = true',
            [slug]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Category not found' });
        }

        res.json(result.rows[0]);
    } catch (error: any) {
        console.error('Get category error:', error);
        res.status(500).json({ error: 'Failed to fetch category' });
    }
});

export default router;
