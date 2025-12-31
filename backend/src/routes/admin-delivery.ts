// Admin routes for delivery partner management
import express, { Response } from 'express';
import { pool as db } from '../lib/db';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = express.Router();

/**
 * GET /api/admin/delivery-partners/pending
 * Get pending delivery partner verifications
 */
router.get('/delivery-partners/pending', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const result = await db.query(
            `SELECT dp.*, u.email as user_email
      FROM delivery_partners dp
      JOIN users u ON dp.user_id = u.id
      WHERE dp.verification_status = 'pending'
      ORDER BY dp.created_at DESC`
        );

        res.json(result.rows);
    } catch (error) {
        console.error('Get pending partners error:', error);
        res.status(500).json({ error: 'Failed to fetch pending partners' });
    }
});

/**
 * GET /api/admin/delivery-partners
 * Get all delivery partners with filters
 */
router.get('/delivery-partners', authenticate, async (req: AuthRequest, res: Response) => {
    const { status, city, verification_status } = req.query;

    try {
        let query = `SELECT dp.*, u.email as user_email
                 FROM delivery_partners dp
                 JOIN users u ON dp.user_id = u.id
                 WHERE 1=1`;
        const params: any[] = [];
        let paramIndex = 1;

        if (verification_status) {
            query += ` AND dp.verification_status = $${paramIndex}`;
            params.push(verification_status);
            paramIndex++;
        }

        if (city) {
            query += ` AND dp.city = $${paramIndex}`;
            params.push(city);
            paramIndex++;
        }

        query += ' ORDER BY dp.created_at DESC';

        const result = await db.query(query, params);
        res.json(result.rows);
    } catch (error) {
        console.error('Get partners error:', error);
        res.status(500).json({ error: 'Failed to fetch partners' });
    }
});

/**
 * PUT /api/admin/delivery-partners/:id/verify
 * Approve or reject delivery partner
 */
router.put('/delivery-partners/:id/verify', authenticate, async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { verification_status, rejection_reason } = req.body; // 'approved' or 'rejected'
    const adminId = req.userId;

    try {
        const result = await db.query(
            `UPDATE delivery_partners SET
        verification_status = $1,
        verified_by = $2,
        verified_at = NOW(),
        rejection_reason = $3,
        is_active = CASE WHEN $1 = 'approved' THEN true ELSE false END,
        updated_at = NOW()
      WHERE id = $4
      RETURNING *`,
            [verification_status, adminId, rejection_reason, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Partner not found' });
        }

        res.json({
            message: `Partner ${verification_status}`,
            partner: result.rows[0]
        });
    } catch (error) {
        console.error('Verify partner error:', error);
        res.status(500).json({ error: 'Failed to verify partner' });
    }
});

/**
 * PUT /api/admin/delivery-partners/:id/suspend
 * Suspend or activate delivery partner
 */
router.put('/delivery-partners/:id/suspend', authenticate, async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { is_active, reason } = req.body;

    try {
        const result = await db.query(
            `UPDATE delivery_partners SET
        is_active = $1,
        updated_at = NOW()
      WHERE id = $2
      RETURNING *`,
            [is_active, id]
        );

        res.json({
            message: is_active ? 'Partner activated' : 'Partner suspended',
            partner: result.rows[0]
        });
    } catch (error) {
        console.error('Suspend partner error:', error);
        res.status(500).json({ error: 'Failed to update partner status' });
    }
});

/**
 * GET /api/admin/delivery-analytics
 * Get delivery analytics
 */
router.get('/delivery-analytics', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        // Total partners
        const totalPartners = await db.query(
            'SELECT COUNT(*) as count FROM delivery_partners WHERE verification_status = $1',
            ['approved']
        );

        // Active partners (online now)
        const activePartners = await db.query(
            'SELECT COUNT(*) as count FROM delivery_partners WHERE is_online = true AND is_available = true'
        );

        // Today's deliveries
        const today = new Date().toISOString().split('T')[0];
        const todayDeliveries = await db.query(
            `SELECT COUNT(*) as count, COALESCE(SUM(delivery_fee), 0) as revenue
      FROM delivery_assignments
      WHERE DATE(delivered_at) = $1 AND status = 'delivered'`,
            [today]
        );

        // Pending deliveries
        const pendingDeliveries = await db.query(
            `SELECT COUNT(*) as count
      FROM delivery_assignments
      WHERE status IN ('pending', 'accepted', 'on_way_to_pickup', 'picked_up', 'on_way_to_delivery')`
        );

        // Average delivery time (in minutes)
        const avgDeliveryTime = await db.query(
            `SELECT AVG(EXTRACT(EPOCH FROM (delivered_at - accepted_at))/60) as avg_minutes
      FROM delivery_assignments
      WHERE status = 'delivered' AND delivered_at IS NOT NULL`
        );

        res.json({
            total_partners: parseInt(totalPartners.rows[0].count),
            active_partners: parseInt(activePartners.rows[0].count),
            today_deliveries: parseInt(todayDeliveries.rows[0].count),
            today_revenue: parseFloat(todayDeliveries.rows[0].revenue),
            pending_deliveries: parseInt(pendingDeliveries.rows[0].count),
            avg_delivery_time_minutes: parseFloat(avgDeliveryTime.rows[0].avg_minutes) || 0
        });
    } catch (error) {
        console.error('Get delivery analytics error:', error);
        res.status(500).json({ error: 'Failed to fetch analytics' });
    }
});

/**
 * GET /api/admin/daily-settlements
 * Get daily settlements for approval
 */
router.get('/daily-settlements', authenticate, async (req: AuthRequest, res: Response) => {
    const { status = 'pending', date } = req.query;

    try {
        let query = `SELECT pds.*, dp.full_name, dp.phone, dp.upi_id
                 FROM partner_daily_settlements pds
                 JOIN delivery_partners dp ON pds.partner_id = dp.id
                 WHERE pds.payment_status = $1`;
        const params: any[] = [status];

        if (date) {
            query += ' AND pds.settlement_date = $2';
            params.push(date);
        }

        query += ' ORDER BY pds.settlement_date DESC, pds.net_amount DESC';

        const result = await db.query(query, params);
        res.json(result.rows);
    } catch (error) {
        console.error('Get settlements error:', error);
        res.status(500).json({ error: 'Failed to fetch settlements' });
    }
});

/**
 * PUT /api/admin/daily-settlements/:id/process
 * Process payment for daily settlement
 */
router.put('/daily-settlements/:id/process', authenticate, async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { payment_method, payment_reference } = req.body;

    try {
        const result = await db.query(
            `UPDATE partner_daily_settlements SET
        payment_status = 'paid',
        payment_method = $1,
        payment_reference = $2,
        paid_at = NOW(),
        updated_at = NOW()
      WHERE id = $3
      RETURNING *`,
            [payment_method, payment_reference, id]
        );

        res.json({
            message: 'Payment processed',
            settlement: result.rows[0]
        });
    } catch (error) {
        console.error('Process payment error:', error);
        res.status(500).json({ error: 'Failed to process payment' });
    }
});

/**
 * GET /api/admin/feedback-complaints
 * Get all feedback and complaints
 */
router.get('/feedback-complaints', authenticate, async (req: AuthRequest, res: Response) => {
    const { status = 'pending', type } = req.query;

    try {
        let query = `SELECT fc.*,
                 r.name as reporter_name,
                 s.name as subject_name
                 FROM feedback_complaints fc
                 JOIN users r ON fc.reporter_id = r.id
                 JOIN users s ON fc.subject_id = s.id
                 WHERE fc.status = $1`;
        const params: any[] = [status];

        if (type) {
            query += ' AND fc.type = $2';
            params.push(type);
        }

        query += ' ORDER BY fc.priority DESC, fc.created_at DESC';

        const result = await db.query(query, params);
        res.json(result.rows);
    } catch (error) {
        console.error('Get feedback error:', error);
        res.status(500).json({ error: 'Failed to fetch feedback' });
    }
});

/**
 * PUT /api/admin/feedback-complaints/:id/resolve
 * Resolve feedback/complaint
 */
router.put('/feedback-complaints/:id/resolve', authenticate, async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { resolution, admin_notes, status } = req.body;
    const adminId = req.userId;

    try {
        const result = await db.query(
            `UPDATE feedback_complaints SET
        status = $1,
        resolution = $2,
        admin_notes = $3,
        resolved_by = $4,
        resolved_at = NOW(),
        updated_at = NOW()
      WHERE id = $5
      RETURNING *`,
            [status, resolution, admin_notes, adminId, id]
        );

        res.json({
            message: 'Feedback resolved',
            feedback: result.rows[0]
        });
    } catch (error) {
        console.error('Resolve feedback error:', error);
        res.status(500).json({ error: 'Failed to resolve feedback' });
    }
});

export default router;
