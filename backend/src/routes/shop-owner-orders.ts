import express from 'express';
import { pool } from '../lib/db';
import { emitOrderStatusUpdate } from '../lib/socket';
import { authenticate } from '../middleware/auth';

const router = express.Router();

router.use(authenticate);

// Middleware to ensure user has a shop
const ensureShop = async (req: any, res: any, next: any) => {
    try {
        const userId = req.userId;
        const shopResult = await pool.query(
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

// GET /api/shop-owner/orders - List all orders
router.get('/', async (req: any, res) => {
    try {
        const { status, limit } = req.query;
        let query = `
            SELECT o.*, u.name as customer_name, u.phone as customer_phone
            FROM orders o
            LEFT JOIN users u ON o.customer_id = u.id
            WHERE o.store_id = $1
        `;
        const params: any[] = [req.shopId];

        if (status) {
            params.push(status);
            query += ` AND o.status = $${params.length}`;
        }

        query += ' ORDER BY o.created_at DESC';

        if (limit) {
            params.push(limit);
            query += ` LIMIT $${params.length}`;
        }

        const result = await pool.query(query, params);
        res.json({ orders: result.rows });
    } catch (error) {
        console.error('Fetch orders error:', error);
        res.status(500).json({ error: 'Failed to fetch orders' });
    }
});

// GET /api/shop-owner/orders/:id - Order details
router.get('/:id', async (req: any, res) => {
    try {
        const { id } = req.params;

        // Fetch Order Basic Info
        const orderResult = await pool.query(
            `SELECT o.*, 
            u.name as customer_name, 
            u.phone as customer_phone,
            a.address_line1, a.address_line2, a.city, a.state, a.pincode
            FROM orders o
            LEFT JOIN users u ON o.customer_id = u.id
            LEFT JOIN addresses a ON o.delivery_address_id = a.id
            WHERE o.id = $1 AND o.store_id = $2`,
            [id, req.shopId]
        );

        if (orderResult.rows.length === 0) {
            return res.status(404).json({ error: 'Order not found' });
        }

        const order = orderResult.rows[0];

        // Fetch Order Items
        const itemsResult = await pool.query(
            `SELECT oi.*, p.name, p.images
            FROM order_items oi
            LEFT JOIN products p ON oi.product_id = p.id
            WHERE oi.order_id = $1`,
            [id]
        );

        order.items = itemsResult.rows;
        res.json(order);
    } catch (error) {
        console.error('Fetch order details error:', error);
        res.status(500).json({ error: 'Failed to fetch order details' });
    }
});

// PUT /api/shop-owner/orders/:id/status - Update Status
router.put('/:id/status', async (req: any, res) => {
    const client = await pool.connect();
    try {
        const { id } = req.params;
        const { status } = req.body; // e.g., 'ACCEPTED', 'READY', 'COMPLETED', 'CANCELLED'

        const validStatuses = ['PENDING', 'ACCEPTED', 'READY', 'COMPLETED', 'CANCELLED'];
        if (!validStatuses.includes(status)) {
            client.release();
            return res.status(400).json({ error: 'Invalid status' });
        }

        // Map UI status to DB status
        const statusMap: { [key: string]: string } = {
            'ACCEPTED': 'CONFIRMED',
            'READY': 'OUT_FOR_DELIVERY',
            'COMPLETED': 'DELIVERED',
            'PENDING': 'PENDING',
            'CANCELLED': 'CANCELLED'
        };

        // Also allow direct DB status usage if needed
        const dbStatus = statusMap[status] || status;

        await client.query('BEGIN');

        // 1. Get current status to check if we should reduce inventory
        // Use FOR UPDATE to lock the row
        const currentOrderResult = await client.query(
            'SELECT status, customer_id FROM orders WHERE id = $1 AND store_id = $2 FOR UPDATE',
            [id, req.shopId]
        );

        if (currentOrderResult.rows.length === 0) {
            await client.query('ROLLBACK');
            client.release();
            return res.status(404).json({ error: 'Order not found' });
        }

        const currentStatus = currentOrderResult.rows[0].status;

        // 2. Reduce inventory if transitioning from PENDING to CONFIRMED (ACCEPTED)
        if (dbStatus === 'CONFIRMED' && currentStatus === 'PENDING') {
            console.log(`📦 Reducing inventory for Order #${id.slice(0, 8)}`);
            const itemsResult = await client.query(
                'SELECT product_id, quantity FROM order_items WHERE order_id = $1',
                [id]
            );

            for (const item of itemsResult.rows) {
                // Get current stock for logging
                const prodResult = await client.query('SELECT stock_quantity FROM products WHERE id = $1', [item.product_id]);
                const prevStock = prodResult.rows[0].stock_quantity;

                await client.query(
                    'UPDATE products SET stock_quantity = stock_quantity - $1 WHERE id = $2',
                    [item.quantity, item.product_id]
                );

                // Log to stock history
                await client.query(
                    `INSERT INTO stock_history (product_id, previous_stock, new_stock, change_reason, changed_by)
                     VALUES ($1, $2, $3, $4, $5)`,
                    [item.product_id, prevStock, prevStock - item.quantity, `Order Accepted #${id.slice(0, 8)}`, req.userId]
                );
            }
        }
        // 2b. Restore inventory if transitioning to CANCELLED from a non-pending state (where stock was likely deducted)
        else if (dbStatus === 'CANCELLED' && ['CONFIRMED', 'OUT_FOR_DELIVERY', 'READY'].includes(currentStatus)) {
            console.log(`📦 Restoring inventory for Order #${id.slice(0, 8)}`);
            const itemsResult = await client.query(
                'SELECT product_id, quantity FROM order_items WHERE order_id = $1',
                [id]
            );

            for (const item of itemsResult.rows) {
                // Get current stock for logging
                const prodResult = await client.query('SELECT stock_quantity FROM products WHERE id = $1', [item.product_id]);
                const prevStock = prodResult.rows[0].stock_quantity;

                await client.query(
                    'UPDATE products SET stock_quantity = stock_quantity + $1 WHERE id = $2',
                    [item.quantity, item.product_id]
                );

                // Log to stock history
                await client.query(
                    `INSERT INTO stock_history (product_id, previous_stock, new_stock, change_reason, changed_by)
                     VALUES ($1, $2, $3, $4, $5)`,
                    [item.product_id, prevStock, prevStock + item.quantity, `Order Cancelled #${id.slice(0, 8)}`, req.userId]
                );
            }
        }

        // 3. Update order status
        const result = await client.query(
            `UPDATE orders 
             SET status = $1, updated_at = NOW()
             WHERE id = $2 AND store_id = $3
             RETURNING id, status, customer_id`,
            [dbStatus, id, req.shopId]
        );

        await client.query('COMMIT');

        const updatedOrder = result.rows[0];

        // Create Notification for Customer (outside transaction is fine)
        try {
            const customerId = updatedOrder.customer_id;
            if (customerId) {
                let title = 'Order Update';
                let message = `Your order #${updatedOrder.id.slice(0, 8)} status is now ${dbStatus}`;

                if (dbStatus === 'CONFIRMED') {
                    title = 'Order Confirmed! 👨‍🍳';
                    message = `Your order is confirmed and is being prepared.`;
                } else if (dbStatus === 'OUT_FOR_DELIVERY') {
                    title = 'Out for Delivery 🛵';
                    message = `Your order is on the way!`;
                } else if (dbStatus === 'DELIVERED') {
                    title = 'Order Delivered 😋';
                    message = `Enjoy your meal! Please rate your experience.`;
                } else if (dbStatus === 'CANCELLED') {
                    title = 'Order Cancelled ❌';
                    message = `Your order was cancelled by the shop.`;
                }

                await pool.query(
                    `INSERT INTO notifications 
                    (user_id, type, title, message, data, is_read) 
                    VALUES ($1, 'order_update', $2, $3, $4, false)`,
                    [customerId, title, message, JSON.stringify({ orderId: id })]
                );

                // Real-time update via Socket.io
                emitOrderStatusUpdate(customerId, {
                    orderId: id,
                    status: dbStatus,
                    title,
                    message
                });
            }
        } catch (notifError) {
            console.error('Failed to send notification:', notifError);
        }

        res.json({ message: 'Order updated', order: updatedOrder });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Update status error:', error);
        res.status(500).json({ error: 'Failed to update order status' });
    } finally {
        client.release();
    }
});

export default router;
