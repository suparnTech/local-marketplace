import { Response, Router } from 'express';
import { pool as db } from '../lib/db';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

/**
 * GET /api/shop-owner/growth/coupons
 * List all coupons for the shop
 */
router.get('/coupons', authenticate, async (req: AuthRequest, res: Response) => {
    const userId = req.userId;

    try {
        const result = await db.query(
            `SELECT c.* FROM coupons c
             JOIN shops s ON c.shop_id = s.id
             WHERE s.owner_id = $1
             ORDER BY c.created_at DESC`,
            [userId]
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Fetch coupons error:', error);
        res.status(500).json({ error: 'Failed to fetch coupons' });
    }
});

/**
 * POST /api/shop-owner/growth/coupons
 * Create a new coupon
 */
router.post('/coupons', authenticate, async (req: AuthRequest, res: Response) => {
    const userId = req.userId;
    const {
        code,
        discountType,
        discountValue,
        minOrderAmount,
        maxDiscount,
        validFrom,
        validUntil,
        usageLimit
    } = req.body;

    if (!code || !discountType || !discountValue) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        // Get shop ID first
        const shopResult = await db.query('SELECT id FROM shops WHERE owner_id = $1', [userId]);
        if (shopResult.rows.length === 0) {
            return res.status(404).json({ error: 'Shop not found' });
        }
        const shopId = shopResult.rows[0].id;

        const result = await db.query(
            `INSERT INTO coupons (
                shop_id, code, discount_type, discount_value, 
                min_order_amount, max_discount, valid_from, 
                valid_until, usage_limit
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING *`,
            [
                shopId, code.toUpperCase(), discountType, discountValue,
                minOrderAmount || 0, maxDiscount, validFrom || new Date(),
                validUntil, usageLimit
            ]
        );

        res.status(201).json(result.rows[0]);
    } catch (error: any) {
        console.error('Create coupon error:', error);
        if (error.code === '23505') {
            return res.status(400).json({ error: 'Coupon code already exists for this shop' });
        }
        res.status(500).json({ error: 'Failed to create coupon' });
    }
});

/**
 * PATCH /api/shop-owner/growth/coupons/:id
 * Toggle coupon status or update details
 */
router.patch('/coupons/:id', authenticate, async (req: AuthRequest, res: Response) => {
    const userId = req.userId;
    const { id } = req.params;
    const { isActive, validUntil, usageLimit } = req.body;

    try {
        const result = await db.query(
            `UPDATE coupons c
             SET is_active = COALESCE($1, c.is_active),
                 valid_until = COALESCE($2, c.valid_until),
                 usage_limit = COALESCE($3, c.usage_limit),
                 updated_at = NOW()
             FROM shops s
             WHERE c.shop_id = s.id AND s.owner_id = $4 AND c.id = $5
             RETURNING c.*`,
            [isActive, validUntil, usageLimit, userId, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Coupon not found or unauthorized' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Update coupon error:', error);
        res.status(500).json({ error: 'Failed to update coupon' });
    }
});

/**
 * DELETE /api/shop-owner/growth/coupons/:id
 * Delete a coupon
 */
router.delete('/coupons/:id', authenticate, async (req: AuthRequest, res: Response) => {
    const userId = req.userId;
    const { id } = req.params;

    try {
        const result = await db.query(
            `DELETE FROM coupons c
             USING shops s
             WHERE c.shop_id = s.id AND s.owner_id = $1 AND c.id = $2
             RETURNING c.id`,
            [userId, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Coupon not found or unauthorized' });
        }

        res.json({ message: 'Coupon deleted successfully' });
    } catch (error) {
        console.error('Delete coupon error:', error);
        res.status(500).json({ error: 'Failed to delete coupon' });
    }
});

export default router;
