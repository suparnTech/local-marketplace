// backend/src/routes/addresses.ts
// API routes for address management

import express from 'express';
import { pool } from '../lib/db';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// GET /api/addresses - Get user's addresses
router.get('/', async (req, res) => {
    try {
        const userId = (req as any).userId;

        const result = await pool.query(
            `SELECT * FROM addresses 
       WHERE user_id = $1 AND is_deleted = false 
       ORDER BY is_default DESC, created_at DESC`,
            [userId]
        );

        res.json(result.rows);
    } catch (error: any) {
        console.error('Get addresses error:', error);
        res.status(500).json({ error: 'Failed to fetch addresses' });
    }
});

// POST /api/addresses - Create new address
router.post('/', async (req, res) => {
    try {
        const userId = (req as any).userId;
        const {
            name,
            phone,
            address_line1,
            address_line2,
            city,
            state,
            pincode,
            is_default,
        } = req.body;

        // If this is set as default, unset other defaults
        if (is_default) {
            await pool.query(
                'UPDATE addresses SET is_default = false WHERE user_id = $1',
                [userId]
            );
        }

        const result = await pool.query(
            `INSERT INTO addresses 
       (user_id, name, phone, address_line1, address_line2, city, state, pincode, is_default, latitude, longitude)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NULL, NULL)
       RETURNING *`,
            [userId, name, phone, address_line1, address_line2, city, state, pincode, is_default || false]
        );

        res.status(201).json(result.rows[0]);
    } catch (error: any) {
        console.error('Create address error:', error);
        res.status(500).json({ error: 'Failed to create address' });
    }
});

// PUT /api/addresses/:id - Update address
router.put('/:id', async (req, res) => {
    try {
        const userId = (req as any).userId;
        const { id } = req.params;
        const {
            name,
            phone,
            address_line1,
            address_line2,
            city,
            state,
            pincode,
            is_default,
        } = req.body;

        // If this is set as default, unset other defaults
        if (is_default) {
            await pool.query(
                'UPDATE addresses SET is_default = false WHERE user_id = $1 AND id != $2',
                [userId, id]
            );
        }

        const result = await pool.query(
            `UPDATE addresses 
       SET name = $1, phone = $2, address_line1 = $3, address_line2 = $4,
           city = $5, state = $6, pincode = $7, is_default = $8, updated_at = NOW()
       WHERE id = $9 AND user_id = $10
       RETURNING *`,
            [name, phone, address_line1, address_line2, city, state, pincode, is_default, id, userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Address not found' });
        }

        res.json(result.rows[0]);
    } catch (error: any) {
        console.error('Update address error:', error);
        res.status(500).json({ error: 'Failed to update address' });
    }
});

// DELETE /api/addresses/:id - Delete address (soft delete)
router.delete('/:id', async (req, res) => {
    try {
        const userId = (req as any).userId;
        const { id } = req.params;

        const result = await pool.query(
            `UPDATE addresses 
       SET is_deleted = true, updated_at = NOW()
       WHERE id = $1 AND user_id = $2
       RETURNING *`,
            [id, userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Address not found' });
        }

        res.json({ message: 'Address deleted successfully' });
    } catch (error: any) {
        console.error('Delete address error:', error);
        res.status(500).json({ error: 'Failed to delete address' });
    }
});

// PUT /api/addresses/:id/default - Set address as default
router.put('/:id/default', async (req, res) => {
    try {
        const userId = (req as any).userId;
        const { id } = req.params;

        // Unset all defaults
        await pool.query(
            'UPDATE addresses SET is_default = false WHERE user_id = $1',
            [userId]
        );

        // Set this one as default
        const result = await pool.query(
            `UPDATE addresses 
       SET is_default = true, updated_at = NOW()
       WHERE id = $1 AND user_id = $2
       RETURNING *`,
            [id, userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Address not found' });
        }

        res.json(result.rows[0]);
    } catch (error: any) {
        console.error('Set default address error:', error);
        res.status(500).json({ error: 'Failed to set default address' });
    }
});

export default router;
