// backend/src/routes/towns.ts
// API routes for towns/cities

import express from 'express';
import { pool } from '../lib/db';

const router = express.Router();

// GET /api/towns - Get all active towns
router.get('/', async (req, res) => {
    try {
        const { state, search } = req.query;

        let query = 'SELECT * FROM towns WHERE is_active = true';
        const params: any[] = [];

        if (state) {
            params.push(state);
            query += ` AND state = $${params.length}`;
        }

        if (search) {
            params.push(`%${search}%`);
            query += ` AND name ILIKE $${params.length}`;
        }

        query += ' ORDER BY name ASC';

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (error: any) {
        console.error('Get towns error:', error);
        res.status(500).json({ error: 'Failed to fetch towns' });
    }
});

// GET /api/towns/nearby - Get towns near coordinates
router.get('/nearby', async (req, res) => {
    try {
        const { lat, lng, radius = 50 } = req.query;

        if (!lat || !lng) {
            return res.status(400).json({ error: 'Latitude and longitude required' });
        }

        // Calculate distance using Haversine formula
        const result = await pool.query(`
      SELECT *,
        (
          6371 * acos(
            cos(radians($1)) * cos(radians(latitude)) *
            cos(radians(longitude) - radians($2)) +
            sin(radians($1)) * sin(radians(latitude))
          )
        ) AS distance_km
      FROM towns
      WHERE is_active = true
      HAVING distance_km < $3
      ORDER BY distance_km ASC
      LIMIT 20
    `, [lat, lng, radius]);

        res.json(result.rows);
    } catch (error: any) {
        console.error('Get nearby towns error:', error);
        res.status(500).json({ error: 'Failed to fetch nearby towns' });
    }
});

// GET /api/towns/nearest - Find nearest town (MUST be before /:id)
router.get('/nearest', async (req, res) => {
    try {
        const { latitude, longitude } = req.query;

        if (!latitude || !longitude) {
            return res.status(400).json({ error: 'Latitude and longitude required' });
        }

        const lat = parseFloat(latitude as string);
        const lon = parseFloat(longitude as string);

        // Find nearest town using Haversine formula
        const result = await pool.query(`
            SELECT *, 
                (6371 * acos(cos(radians($1)) * cos(radians(latitude)) * 
                cos(radians(longitude) - radians($2)) + sin(radians($1)) * 
                sin(radians(latitude)))) AS distance
            FROM towns
            WHERE latitude IS NOT NULL AND longitude IS NOT NULL AND is_active = true
            ORDER BY distance
            LIMIT 1
        `, [lat, lon]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'No towns found' });
        }

        res.json(result.rows[0]);
    } catch (error: any) {
        console.error('Get nearest town error:', error);
        res.status(500).json({ error: 'Failed to find nearest town' });
    }
});

// GET /api/towns/:id - Get single town
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            'SELECT * FROM towns WHERE id = $1 AND is_active = true',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Town not found' });
        }

        res.json(result.rows[0]);
    } catch (error: any) {
        console.error('Get town error:', error);
        res.status(500).json({ error: 'Failed to fetch town' });
    }
});

export default router;
