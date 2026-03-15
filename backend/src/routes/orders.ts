// backend/src/routes/orders.ts
// Order management with commission calculation

import express from 'express';
import { pool } from '../lib/db';
import { emitNewOrder, emitNewOrderToDeliveryPartners } from '../lib/socket';
import { authenticate } from '../middleware/auth';
import { createRazorpayOrder } from '../services/razorpay';

const router = express.Router();

// Helper functions for distance and delivery fee calculation
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lon2 - lon1);

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRadians(lat1)) *
        Math.cos(toRadians(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

function toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
}

function calculateDeliveryFee(distanceInKm: number): number {
    if (distanceInKm <= 0) return 0;

    const firstTierKm = Math.min(distanceInKm, 5);
    const secondTierKm = Math.max(0, distanceInKm - 5);

    const firstTierFee = firstTierKm * 10; // ₹10/km for first 5km
    const secondTierFee = secondTierKm * 5;  // ₹5/km after 5km

    return Math.round(firstTierFee + secondTierFee);
}

// All routes require authentication with custom JWT
router.use(authenticate);

// POST /api/orders - Place new order
router.post('/', async (req, res) => {
    const client = await pool.connect();

    try {
        const userId = (req as any).userId;
        const {
            items, // Array of cart items
            address_id,
            payment_method,
            coupon_code,
        } = req.body;

        console.log('📦 Order request - items:', JSON.stringify(items, null, 2));
        console.log('📍 Address ID:', address_id);
        console.log('💳 Payment method:', payment_method);

        await client.query('BEGIN');

        // Get platform commission percentage
        const settingsResult = await client.query(
            'SELECT commission_percentage FROM platform_settings LIMIT 1'
        );
        const commissionPercentage = settingsResult.rows[0]?.commission_percentage || 4.0;

        // Validate and apply coupon if provided
        let discountAmount = 0;
        if (coupon_code) {
            const couponResult = await client.query(
                `SELECT * FROM coupons 
         WHERE code = $1 AND is_active = true 
         AND valid_from <= NOW() 
         AND (valid_until IS NULL OR valid_until >= NOW())
         AND (usage_limit IS NULL OR used_count < usage_limit)`,
                [coupon_code]
            );

            if (couponResult.rows.length > 0) {
                const coupon = couponResult.rows[0];
                const subtotal = items.reduce((sum: number, item: any) =>
                    sum + (item.price * item.quantity), 0
                );

                if (subtotal >= coupon.min_order_amount) {
                    if (coupon.discount_type === 'percentage') {
                        discountAmount = (subtotal * coupon.discount_value) / 100;
                        if (coupon.max_discount_amount) {
                            discountAmount = Math.min(discountAmount, coupon.max_discount_amount);
                        }
                    } else {
                        discountAmount = coupon.discount_value;
                    }

                    // Update coupon usage
                    await client.query(
                        'UPDATE coupons SET used_count = used_count + 1 WHERE id = $1',
                        [coupon.id]
                    );
                }
            }
        }

        // Group items by store
        const storeGroups: { [key: string]: any[] } = {};
        items.forEach((item: any) => {
            const storeId = item.store_id || item.shop_id; // Support both
            if (!storeId || storeId === 'undefined') {
                console.error('Invalid store ID for item:', item);
                throw new Error('Cart items must have a valid store_id');
            }
            if (!storeGroups[storeId]) {
                storeGroups[storeId] = [];
            }
            storeGroups[storeId].push(item);
        });

        // Create orders for each store
        const orderIds = [];
        for (const [storeId, storeItems] of Object.entries(storeGroups)) {
            const itemsArray = storeItems as any[];

            console.log(`Processing order for store: ${storeId}`);

            // Get shop coordinates
            const storeResult = await client.query(
                'SELECT latitude, longitude FROM shops WHERE id = $1',
                [storeId]
            );
            const store = storeResult.rows[0];

            // Get delivery address with ALL fields
            const addressResult = await client.query(
                'SELECT * FROM addresses WHERE id = $1',
                [address_id]
            );
            const address = addressResult.rows[0];

            console.log('📍 Address data:', JSON.stringify(address, null, 2));

            // Calculate delivery fee based on distance
            let deliveryFee = 40; // Default fallback
            if (store?.latitude && store?.longitude && address?.latitude && address?.longitude) {
                const distance = calculateDistance(
                    store.latitude,
                    store.longitude,
                    address.latitude,
                    address.longitude
                );
                deliveryFee = calculateDeliveryFee(distance);
            }

            const subtotal = itemsArray.reduce((sum, item) =>
                sum + (item.price * item.quantity), 0
            );

            const tax = Math.round(subtotal * 0.05); // 5% tax

            // Refined discount logic: only apply if coupon matches THIS store
            let shopDiscount = 0;
            const couponResult = await client.query(
                `SELECT * FROM coupons WHERE code = $1 AND shop_id = $2`,
                [coupon_code, storeId]
            );

            if (couponResult.rows.length > 0) {
                const coupon = couponResult.rows[0];
                if (subtotal >= coupon.min_order_amount) {
                    if (coupon.discount_type === 'percentage') {
                        shopDiscount = (subtotal * coupon.discount_value) / 100;
                        if (coupon.max_discount_amount) {
                            shopDiscount = Math.min(shopDiscount, coupon.max_discount_amount);
                        }
                    } else {
                        shopDiscount = Math.min(subtotal, coupon.discount_value);
                    }

                    // Update usage only once per coupon per checkout 
                    // (Actually we should probably do this outside the loop if it's one coupon for the whole cart, 
                    // but here one coupon belongs to one shop)
                    await client.query(
                        'UPDATE coupons SET used_count = used_count + 1 WHERE id = $1',
                        [coupon.id]
                    );
                }
            }

            const totalAmount = subtotal + deliveryFee + tax - shopDiscount;

            // Calculate commission (4% of subtotal before discount)
            const commissionAmount = (subtotal * commissionPercentage) / 100;
            const platformFee = commissionAmount;
            const shopPayout = subtotal - commissionAmount;

            // Prepare order data
            const deliveryAddressText = `${address.address_line1}${address.address_line2 ? ', ' + address.address_line2 : ''}, ${address.city}, ${address.state} - ${address.pincode}`;
            const deliveryPhone = address.phone;

            console.log('💰 Order values:', {
                userId, storeId, address_id,
                deliveryAddressText, deliveryPhone,
                totalAmount, deliveryFee, tax,
                commissionAmount, platformFee, shopPayout
            });

            // Create order
            const orderResult = await client.query(
                `INSERT INTO orders 
         (customer_id, store_id, delivery_address, delivery_phone, delivery_address_id,
          total_amount, delivery_fee, tax_amount, discount_amount, 
          commission_amount, platform_fee, shop_payout,
          payment_method, payment_status, status, coupon_code,
          razorpay_order_id, razorpay_payment_id, razorpay_signature)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
         RETURNING *`,
                [
                    userId,
                    storeId,
                    deliveryAddressText,
                    deliveryPhone,
                    address_id,
                    totalAmount,
                    deliveryFee,
                    tax,
                    shopDiscount,
                    commissionAmount,
                    platformFee,
                    shopPayout,
                    payment_method,
                    payment_method === 'cod' ? 'PENDING' : 'PENDING',
                    'PENDING',
                    coupon_code || null,
                    (req.body as any).razorpay_order_id || null,
                    (req.body as any).razorpay_payment_id || null,
                    (req.body as any).razorpay_signature || null
                ]
            );

            const order = orderResult.rows[0];
            orderIds.push(order.id);

            // Create order items
            for (const item of itemsArray) {
                await client.query(
                    `INSERT INTO order_items 
           (order_id, product_id, quantity, price_at_purchase, selected_variant)
           VALUES ($1, $2, $3, $4, $5)`,
                    [order.id, item.product_id, item.quantity, item.price, item.selected_variant || null]
                );
            }

            // Track commission
            await client.query(
                `INSERT INTO order_commissions 
         (order_id, store_id, order_amount, commission_percentage, 
          commission_amount, store_payout, platform_earnings)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                [order.id, storeId, subtotal, commissionPercentage,
                    commissionAmount, shopPayout, platformFee]
            );

            // Notify shop owner in real-time
            emitNewOrder(storeId, {
                orderId: order.id,
                orderNumber: order.id.slice(-8).toUpperCase(),
                totalAmount,
                customerName: address.name || 'Customer',
                itemsCount: itemsArray.length,
                deliveryAddress: deliveryAddressText,
            });

            // Notify available delivery partners in the shop's city
            const shopCityResult = await client.query(
                'SELECT city FROM shops WHERE id = $1',
                [storeId]
            );
            const shopCity = shopCityResult.rows[0]?.city;
            if (shopCity) {
                emitNewOrderToDeliveryPartners(shopCity, {
                    orderId: order.id,
                    orderNumber: order.id.slice(-8).toUpperCase(),
                    shopName: storeId, // Will be enriched by frontend
                    shopCity,
                    deliveryAddress: deliveryAddressText,
                    deliveryFee,
                    totalAmount,
                    itemsCount: itemsArray.length,
                });
            }
        }

        await client.query('COMMIT');

        res.status(201).json({
            success: true,
            order_ids: orderIds,
            message: 'Orders placed successfully',
        });

    } catch (error: any) {
        await client.query('ROLLBACK');
        console.error('Place order error:', error);
        res.status(500).json({ error: 'Failed to place order' });
    } finally {
        client.release();
    }
});

// GET /api/orders - Get user's orders
router.get('/', async (req, res) => {
    try {
        const userId = (req as any).userId;
        const { status } = req.query;

        let query = `
      SELECT o.*, 
        s.name as shop_name,
        s.logo_url as shop_logo,
        a.address_line1, a.city, a.state
      FROM orders o
      LEFT JOIN shops s ON o.store_id = s.id
      LEFT JOIN addresses a ON o.delivery_address_id = a.id
      WHERE o.customer_id = $1
    `;
        const params: any[] = [userId];

        if (status) {
            params.push(status);
            query += ` AND o.status = $${params.length}`;
        }

        query += ' ORDER BY o.created_at DESC';

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (error: any) {
        console.error('Get orders error:', error);
        res.status(500).json({ error: 'Failed to fetch orders' });
    }
});

// GET /api/orders/:id - Get order details
router.get('/:id', async (req, res) => {
    try {
        const userId = (req as any).userId;
        const { id } = req.params;

        const orderResult = await pool.query(
            `SELECT o.*, 
        s.name as shop_name,
        s.logo_url as shop_logo,
        s.phone as shop_phone,
        a.*
      FROM orders o
      LEFT JOIN shops s ON o.store_id = s.id
      LEFT JOIN addresses a ON o.delivery_address_id = a.id
      WHERE o.id = $1 AND o.customer_id = $2`,
            [id, userId]
        );

        if (orderResult.rows.length === 0) {
            return res.status(404).json({ error: 'Order not found' });
        }

        const order = orderResult.rows[0];

        // Get order items
        const itemsResult = await pool.query(
            `SELECT oi.*, p.name, p.images
       FROM order_items oi
       LEFT JOIN products p ON oi.product_id = p.id
       WHERE oi.order_id = $1`,
            [id]
        );

        order.items = itemsResult.rows;

        res.json(order);
    } catch (error: any) {
        console.error('Get order error:', error);
        res.status(500).json({ error: 'Failed to fetch order' });
    }
});

// PUT /api/orders/:id/cancel - Cancel order
router.put('/:id/cancel', async (req, res) => {
    try {
        const userId = (req as any).userId;
        const { id } = req.params;

        const result = await pool.query(
            `UPDATE orders 
       SET status = 'cancelled', updated_at = NOW()
       WHERE id = $1 AND user_id = $2 AND status = 'pending'
       RETURNING *`,
            [id, userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: 'Order not found or cannot be cancelled'
            });
        }

        res.json(result.rows[0]);
    } catch (error: any) {
        console.error('Cancel order error:', error);
        res.status(500).json({ error: 'Failed to cancel order' });
    }
});

// POST /api/orders/validate-coupon - Validate a coupon code for cart items
router.post('/validate-coupon', async (req, res) => {
    try {
        const { code, items } = req.body;
        if (!code || !items || !items.length) {
            return res.status(400).json({ error: 'Code and items are required' });
        }

        const result = await pool.query(
            `SELECT * FROM coupons 
             WHERE code = $1 AND is_active = true 
             AND valid_from <= NOW() 
             AND (valid_until IS NULL OR valid_until >= NOW())
             AND (usage_limit IS NULL OR used_count < usage_limit)`,
            [code.toUpperCase()]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Invalid or expired coupon code' });
        }

        const coupon = result.rows[0];
        const shopId = coupon.shop_id;

        // Calculate subtotal for items belonging to this shop
        const shopItems = items.filter((item: any) => (item.store_id || item.shop_id) === shopId);
        if (shopItems.length === 0) {
            return res.status(400).json({ error: 'This coupon is not applicable to items in your cart' });
        }

        const subtotal = shopItems.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);

        if (subtotal < coupon.min_order_amount) {
            return res.status(400).json({
                error: `Minimum order amount of ₹${coupon.min_order_amount} required for this coupon`
            });
        }

        let discount = 0;
        if (coupon.discount_type === 'percentage') {
            discount = (subtotal * coupon.discount_value) / 100;
            if (coupon.max_discount_amount) {
                discount = Math.min(discount, coupon.max_discount_amount);
            }
        } else {
            discount = Math.min(subtotal, coupon.discount_value);
        }

        res.json({
            valid: true,
            coupon_id: coupon.id,
            discount_amount: Math.round(discount),
            shop_id: shopId,
            message: 'Coupon applied successfully!'
        });
    } catch (error) {
        console.error('Validate coupon error:', error);
        res.status(500).json({ error: 'Failed to validate coupon' });
    }
});

// POST /api/orders/create-razorpay-order - Create Razorpay order
router.post('/create-razorpay-order', async (req, res) => {
    try {
        const { amount, orderId } = req.body;

        // Create Razorpay order
        const razorpayOrder = await createRazorpayOrder({
            amount: Math.round(amount * 100), // Convert to paise
            currency: 'INR',
            receipt: `order_${orderId || Date.now()}`,
            notes: {
                order_id: orderId,
            },
        });

        res.json({
            razorpayOrderId: razorpayOrder.id,
            amount: razorpayOrder.amount,
            currency: razorpayOrder.currency,
        });
    } catch (error: any) {
        console.error('Create Razorpay order error:', error);
        res.status(500).json({ error: 'Failed to create Razorpay order' });
    }
});

export default router;
