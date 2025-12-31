// Delivery Assignment Routes
import express, { Response } from 'express';
import { pool as db } from '../lib/db';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = express.Router();

/**
 * GET /api/delivery-assignments/active
 * Get active delivery assignments for partner
 */
router.get('/active', authenticate, async (req: AuthRequest, res: Response) => {
    const userId = req.userId;

    try {
        // Get partner ID
        const partner = await db.query(
            'SELECT id FROM delivery_partners WHERE user_id = $1',
            [userId]
        );

        if (partner.rows.length === 0) {
            return res.status(404).json({ error: 'Partner not found' });
        }

        const partnerId = partner.rows[0].id;

        // Get active assignments
        const result = await db.query(
            `SELECT da.*, o.order_number, o.items, o.total_amount
      FROM delivery_assignments da
      JOIN orders o ON da.order_id = o.id
      WHERE da.assigned_to = $1
      AND da.status IN ('accepted', 'on_way_to_pickup', 'reached_shop', 'picked_up', 'on_way_to_delivery', 'reached_customer')
      ORDER BY da.created_at DESC`,
            [partnerId]
        );

        res.json(result.rows);
    } catch (error) {
        console.error('Get active assignments error:', error);
        res.status(500).json({ error: 'Failed to fetch assignments' });
    }
});

/**
 * GET /api/delivery-assignments/history
 * Get delivery history for partner
 */
router.get('/history', authenticate, async (req: AuthRequest, res: Response) => {
    const userId = req.userId;
    const { limit = 50, offset = 0 } = req.query;

    try {
        const partner = await db.query(
            'SELECT id FROM delivery_partners WHERE user_id = $1',
            [userId]
        );

        if (partner.rows.length === 0) {
            return res.status(404).json({ error: 'Partner not found' });
        }

        const partnerId = partner.rows[0].id;

        const result = await db.query(
            `SELECT da.*, o.order_number, o.total_amount
      FROM delivery_assignments da
      JOIN orders o ON da.order_id = o.id
      WHERE da.assigned_to = $1
      AND da.status IN ('delivered', 'cancelled')
      ORDER BY da.created_at DESC
      LIMIT $2 OFFSET $3`,
            [partnerId, limit, offset]
        );

        res.json(result.rows);
    } catch (error) {
        console.error('Get delivery history error:', error);
        res.status(500).json({ error: 'Failed to fetch history' });
    }
});

/**
 * PUT /api/delivery-assignments/:id/status
 * Update delivery status
 */
router.put('/:id/status', authenticate, async (req: AuthRequest, res: Response) => {
    const userId = req.userId;
    const { id } = req.params;
    const { status, location, note } = req.body;

    try {
        // Get partner ID
        const partner = await db.query(
            'SELECT id FROM delivery_partners WHERE user_id = $1',
            [userId]
        );

        if (partner.rows.length === 0) {
            return res.status(404).json({ error: 'Partner not found' });
        }

        const partnerId = partner.rows[0].id;

        // Get current assignment
        const assignment = await db.query(
            'SELECT * FROM delivery_assignments WHERE id = $1 AND assigned_to = $2',
            [id, partnerId]
        );

        if (assignment.rows.length === 0) {
            return res.status(404).json({ error: 'Assignment not found' });
        }

        const current = assignment.rows[0];

        // Update status history
        const statusHistory = current.status_history || [];
        statusHistory.push({
            status,
            timestamp: new Date().toISOString(),
            location,
            note
        });

        // Determine timestamp column to update
        let timestampUpdate = '';
        switch (status) {
            case 'accepted':
                timestampUpdate = 'accepted_at = NOW()';
                break;
            case 'reached_shop':
                timestampUpdate = 'reached_shop_at = NOW()';
                break;
            case 'picked_up':
                timestampUpdate = 'picked_up_at = NOW()';
                break;
            case 'on_way_to_delivery':
                timestampUpdate = 'on_way_at = NOW()';
                break;
            case 'reached_customer':
                timestampUpdate = 'reached_customer_at = NOW()';
                break;
            case 'delivered':
                timestampUpdate = 'delivered_at = NOW()';
                break;
            case 'cancelled':
                timestampUpdate = 'cancelled_at = NOW()';
                break;
        }

        // Update assignment
        const result = await db.query(
            `UPDATE delivery_assignments SET
        status = $1,
        status_history = $2,
        ${timestampUpdate}
      WHERE id = $3
      RETURNING *`,
            [status, JSON.stringify(statusHistory), id]
        );

        // Update order status if delivered
        if (status === 'delivered') {
            await db.query(
                `UPDATE orders SET
          status = 'delivered',
          actual_delivery_time = NOW()
        WHERE id = $1`,
                [current.order_id]
            );
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Update status error:', error);
        res.status(500).json({ error: 'Failed to update status' });
    }
});

/**
 * POST /api/delivery-assignments/:id/verify-pickup
 * Verify pickup with OTP
 */
router.post('/:id/verify-pickup', authenticate, async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { otp } = req.body;

    try {
        const assignment = await db.query(
            'SELECT * FROM delivery_assignments WHERE id = $1',
            [id]
        );

        if (assignment.rows.length === 0) {
            return res.status(404).json({ error: 'Assignment not found' });
        }

        if (assignment.rows[0].pickup_otp !== otp) {
            return res.status(400).json({ error: 'Invalid OTP' });
        }

        // Update status to picked_up
        const result = await db.query(
            `UPDATE delivery_assignments SET
        status = 'picked_up',
        picked_up_at = NOW()
      WHERE id = $1
      RETURNING *`,
            [id]
        );

        res.json({ message: 'Pickup verified', assignment: result.rows[0] });
    } catch (error) {
        console.error('Verify pickup error:', error);
        res.status(500).json({ error: 'Failed to verify pickup' });
    }
});

/**
 * POST /api/delivery-assignments/:id/verify-delivery
 * Verify delivery with OTP
 */
router.post('/:id/verify-delivery', authenticate, async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { otp } = req.body;

    try {
        const assignment = await db.query(
            'SELECT * FROM delivery_assignments WHERE id = $1',
            [id]
        );

        if (assignment.rows.length === 0) {
            return res.status(404).json({ error: 'Assignment not found' });
        }

        if (assignment.rows[0].delivery_otp !== otp) {
            return res.status(400).json({ error: 'Invalid OTP' });
        }

        // Update status to delivered
        const result = await db.query(
            `UPDATE delivery_assignments SET
        status = 'delivered',
        delivered_at = NOW()
      WHERE id = $1
      RETURNING *`,
            [id]
        );

        // Update order status
        await db.query(
            `UPDATE orders SET
        status = 'delivered',
        actual_delivery_time = NOW()
      WHERE id = $1`,
            [assignment.rows[0].order_id]
        );

        // Update partner stats
        await db.query(
            `UPDATE delivery_partners SET
        total_deliveries = total_deliveries + 1,
        successful_deliveries = successful_deliveries + 1,
        total_earnings = total_earnings + $1
      WHERE id = $2`,
            [assignment.rows[0].partner_earnings, assignment.rows[0].assigned_to]
        );

        res.json({ message: 'Delivery verified', assignment: result.rows[0] });
    } catch (error) {
        console.error('Verify delivery error:', error);
        res.status(500).json({ error: 'Failed to verify delivery' });
    }
});

/**
 * POST /api/delivery-assignments/:id/upload-photo
 * Upload pickup/delivery photo
 */
router.post('/:id/upload-photo', authenticate, async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { photo_url, type } = req.body; // type: 'pickup' or 'delivery'

    try {
        const field = type === 'pickup' ? 'pickup_photo_url' : 'delivery_photo_url';

        const result = await db.query(
            `UPDATE delivery_assignments SET
        ${field} = $1
      WHERE id = $2
      RETURNING *`,
            [photo_url, id]
        );

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Upload photo error:', error);
        res.status(500).json({ error: 'Failed to upload photo' });
    }
});

export default router;
