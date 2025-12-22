// backend/src/routes/shop-owner-analytics.ts
import express from 'express';
import { pool as db } from '../lib/db';
import { authenticate } from '../middleware/auth';

const router = express.Router();

router.use(authenticate);

// Middleware to ensure user has a shop
const ensureShop = async (req: any, res: any, next: any) => {
    try {
        const userId = req.userId;
        const shopResult = await db.query(
            'SELECT id FROM shops WHERE owner_id = $1',
            [userId]
        );

        if (shopResult.rows.length === 0) {
            return res.status(404).json({ error: 'Shop not found' });
        }

        req.shopId = shopResult.rows[0].id;
        next();
    } catch (error) {
        console.error('Shop verification error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

router.use(ensureShop);

/**
 * GET /api/shop-owner/analytics
 * Get comprehensive shop insights
 */
router.get('/', async (req: any, res) => {
    try {
        const shopId = req.shopId;

        // 1. Lifecycle Revenue & Orders
        const statsResult = await db.query(
            `SELECT 
                COUNT(*) as total_orders,
                COALESCE(SUM(shop_earnings), 0) as total_revenue,
                COUNT(CASE WHEN status = 'DELIVERED' THEN 1 END) as completed_orders,
                COUNT(CASE WHEN status = 'PENDING' THEN 1 END) as pending_orders,
                COUNT(CASE WHEN status = 'CANCELLED' THEN 1 END) as cancelled_orders
            FROM orders 
            WHERE store_id = $1`,
            [shopId]
        );

        // 2. Today's Stats
        const todayStatsResult = await db.query(
            `SELECT 
                COUNT(*) as today_orders,
                COALESCE(SUM(shop_earnings), 0) as today_revenue
            FROM orders 
            WHERE store_id = $1 
            AND created_at >= CURRENT_DATE`,
            [shopId]
        );

        // 3. Last 7 Days Revenue Trend (for chart)
        const trendResult = await db.query(
            `SELECT 
                d.day::date as date,
                COALESCE(SUM(o.shop_earnings), 0) as revenue
            FROM (
                SELECT generate_series(CURRENT_DATE - INTERVAL '6 days', CURRENT_DATE, '1 day') as day
            ) d
            LEFT JOIN orders o ON d.day::date = o.created_at::date AND o.store_id = $1
            GROUP BY d.day
            ORDER BY d.day ASC`,
            [shopId]
        );

        // 4. Top 5 Selling Products
        const topProductsResult = await db.query(
            `SELECT 
                p.id, 
                p.name, 
                SUM(oi.quantity) as total_quantity,
                SUM(oi.price_at_purchase * oi.quantity) as total_sales
            FROM order_items oi
            JOIN products p ON oi.product_id = p.id
            JOIN orders o ON oi.order_id = o.id
            WHERE o.store_id = $1 AND o.status != 'CANCELLED'
            GROUP BY p.id, p.name
            ORDER BY total_quantity DESC
            LIMIT 5`,
            [shopId]
        );

        const stats = statsResult.rows[0];
        const today = todayStatsResult.rows[0];

        res.json({
            summary: {
                totalRevenue: parseFloat(stats.total_revenue) || 0,
                totalOrders: parseInt(stats.total_orders) || 0,
                completedOrders: parseInt(stats.completed_orders) || 0,
                pendingOrders: parseInt(stats.pending_orders) || 0,
                cancelledOrders: parseInt(stats.cancelled_orders) || 0,
                todayRevenue: parseFloat(today.today_revenue) || 0,
                todayOrders: parseInt(today.today_orders) || 0,
            },
            revenueTrend: trendResult.rows.map(row => ({
                date: row.date,
                revenue: parseFloat(row.revenue)
            })),
            topProducts: topProductsResult.rows.map(row => ({
                id: row.id,
                name: row.name,
                quantity: parseInt(row.total_quantity),
                sales: parseFloat(row.total_sales)
            }))
        });

    } catch (error) {
        console.error('Analytics error:', error);
        res.status(500).json({ error: 'Failed to fetch analytics' });
    }
});

export default router;
