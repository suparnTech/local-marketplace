// backend/src/routes/shop-owner.ts
// Shop Owner Portal APIs

import { S3Client } from '@aws-sdk/client-s3';
import express, { Request, Response } from 'express';
import multer from 'multer';
import { pool as db } from '../lib/db';
import { authenticate } from '../middleware/auth';

import shopOwnerAnalyticsRouter from './shop-owner-analytics';
import shopOwnerGrowthRouter from './shop-owner-growth';
import shopOwnerKycRouter from './shop-owner-kyc';
import shopOwnerOrdersRouter from './shop-owner-orders';
import shopOwnerProductsRouter from './shop-owner-products';

const router = express.Router();

// Mount sub-routers
router.use('/kyc', shopOwnerKycRouter);
router.use('/orders', shopOwnerOrdersRouter);
router.use('/products', shopOwnerProductsRouter);
router.use('/analytics', shopOwnerAnalyticsRouter);
router.use('/growth', shopOwnerGrowthRouter);

// Configure multer for file uploads
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only JPEG, PNG, and PDF are allowed.'));
        }
    },
});

// S3 Client (if using AWS S3 for file storage)
const s3Client = new S3Client({
    region: process.env.AWS_REGION || 'ap-south-1',
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    },
});

// ============================================
// 1. SHOP OWNER REGISTRATION
// ============================================

/**
 * POST /api/shop-owner/register
 * Register a new shop owner
 */
router.post('/register', authenticate, async (req: Request, res: Response) => {
    const userId = (req as any).userId;

    try {
        const {
            businessName,
            ownerName,
            phone,
            whatsappNumber,
            email,
            addressLine1,
            addressLine2,
            city,
            state,
            pincode,
            landmark,
            categoryId,
            openingTime,
            closingTime,
            weeklyOff,
            deliveryRadius,
            minimumOrderValue,
        } = req.body;

        // Validate required fields
        if (!businessName || !ownerName || !phone || !addressLine1 || !city || !state || !pincode) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Check if user already has a shop
        const existingShop = await db.query(
            'SELECT id FROM shops WHERE owner_id = $1',
            [userId]
        );

        if (existingShop.rows.length > 0) {
            return res.status(400).json({ error: 'You already have a registered shop' });
        }

        // Create shop
        const result = await db.query(
            `INSERT INTO shops (
        owner_id, name, phone, email, address_line1, address_line2,
        pincode, category_id, opening_hours, delivery_radius_km,
        min_order_amount, whatsapp_number, weekly_off,
        is_approved, is_active, verification_status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, false, true, 'pending')
      RETURNING id, name, verification_status`,
            [
                userId,
                businessName,
                phone,
                email,
                addressLine1,
                addressLine2,
                pincode,
                categoryId,
                JSON.stringify({
                    opening: openingTime || '09:00',
                    closing: closingTime || '21:00',
                }),
                deliveryRadius || 5,
                minimumOrderValue || 0,
                whatsappNumber,
                weeklyOff || ['Sunday'],
            ]
        );

        const shop = result.rows[0];

        res.status(201).json({
            message: 'Shop registered successfully',
            shop: {
                id: shop.id,
                name: shop.name,
                verificationStatus: shop.verification_status,
            },
        });
    } catch (error) {
        console.error('Shop registration error:', error);
        res.status(500).json({ error: 'Failed to register shop' });
    }
});

// ============================================
// 2. GET SHOP OWNER PROFILE
// ============================================

/**
 * GET /api/shop-owner/profile
 * Get shop owner's shop details
 */
router.get('/profile', authenticate, async (req: Request, res: Response) => {
    const userId = (req as any).userId;

    try {
        const result = await db.query(
            `SELECT 
        s.*,
        c.name as category_name,
        c.slug as category_slug
      FROM shops s
      LEFT JOIN categories c ON s.category_id = c.id
      WHERE s.owner_id = $1`,
            [userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Shop not found' });
        }

        const shop = result.rows[0];

        res.json({
            id: shop.id,
            isOpen: shop.is_open,
            businessName: shop.name,
            ownerName: shop.owner_name,
            phone: shop.phone,
            whatsappNumber: shop.whatsapp_number,
            email: shop.email,
            address: {
                line1: shop.address_line1,
                line2: shop.address_line2,
                city: shop.city,
                state: shop.state,
                pincode: shop.pincode,
                landmark: shop.landmark,
            },
            category: {
                id: shop.category_id,
                name: shop.category_name,
                slug: shop.category_slug,
            },
            operational: {
                openingHours: shop.opening_hours,
                weeklyOff: shop.weekly_off,
                deliveryRadius: shop.delivery_radius_km,
                minimumOrderValue: shop.min_order_amount,
            },
            media: {
                logo: shop.logo_url,
                cover: shop.cover_image_url,
                photos: shop.images,
            },
            verification: {
                status: shop.verification_status,
                isApproved: shop.is_approved,
                isActive: shop.is_active,
                verifiedAt: shop.verified_at,
            },
            stats: {
                rating: parseFloat(shop.rating) || 0,
                totalReviews: shop.total_reviews || 0,
                totalOrders: shop.total_orders || 0,
            },
        });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ error: 'Failed to fetch profile' });
    }
});

// ============================================
// 3. UPDATE SHOP PROFILE
// ============================================

/**
 * PUT /api/shop-owner/profile
 * Update shop owner's shop details
 */
router.put('/profile', authenticate, async (req: Request, res: Response) => {
    const userId = (req as any).userId;

    try {
        const {
            businessName,
            phone,
            whatsappNumber,
            email,
            addressLine1,
            addressLine2,
            city,
            state,
            pincode,
            landmark,
            openingTime,
            closingTime,
            weeklyOff,
            deliveryRadius,
            minimumOrderValue,
        } = req.body;

        // Get shop ID
        const shopResult = await db.query(
            'SELECT id FROM shops WHERE owner_id = $1',
            [userId]
        );

        if (shopResult.rows.length === 0) {
            return res.status(404).json({ error: 'Shop not found' });
        }

        const shopId = shopResult.rows[0].id;

        // Update shop
        await db.query(
            `UPDATE shops SET
        name = COALESCE($1, name),
        phone = COALESCE($2, phone),
        whatsapp_number = COALESCE($3, whatsapp_number),
        email = COALESCE($4, email),
        address_line1 = COALESCE($5, address_line1),
        address_line2 = COALESCE($6, address_line2),
        pincode = COALESCE($7, pincode),
        opening_hours = COALESCE($8, opening_hours),
        delivery_radius_km = COALESCE($9, delivery_radius_km),
        min_order_amount = COALESCE($10, min_order_amount),
        weekly_off = COALESCE($11, weekly_off),
        updated_at = NOW()
      WHERE id = $12`,
            [
                businessName,
                phone,
                whatsappNumber,
                email,
                addressLine1,
                addressLine2,
                pincode,
                openingTime && closingTime ? JSON.stringify({ opening: openingTime, closing: closingTime }) : null,
                deliveryRadius,
                minimumOrderValue,
                weeklyOff,
                shopId,
            ]
        );

        res.json({ message: 'Profile updated successfully' });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ error: 'Failed to update profile' });
    }
});

// ============================================
// 4. UPLOAD SHOP PHOTOS
// ============================================

/**
 * POST /api/shop-owner/upload-photo
 * Upload shop logo, cover, or photos
 */
router.post('/upload-photo', authenticate, upload.single('photo'), async (req: Request, res: Response) => {
    const userId = (req as any).userId;
    const file = req.file;
    const photoType = req.body.photoType; // 'logo', 'cover', 'photo'

    if (!file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    try {
        // Get shop ID
        const shopResult = await db.query(
            'SELECT id FROM shops WHERE owner_id = $1',
            [userId]
        );

        if (shopResult.rows.length === 0) {
            return res.status(404).json({ error: 'Shop not found' });
        }

        const shopId = shopResult.rows[0].id;

        // For now, store as base64 (in production, upload to S3)
        const fileUrl = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;

        // Update based on photo type
        if (photoType === 'logo') {
            await db.query('UPDATE shops SET logo_url = $1 WHERE id = $2', [fileUrl, shopId]);
        } else if (photoType === 'cover') {
            await db.query('UPDATE shops SET cover_image_url = $1 WHERE id = $2', [fileUrl, shopId]);
        } else {
            // Add to images array
            await db.query(
                'UPDATE shops SET images = array_append(COALESCE(images, ARRAY[]::text[]), $1) WHERE id = $2',
                [fileUrl, shopId]
            );
        }

        res.json({
            message: 'Photo uploaded successfully',
            url: fileUrl,
        });
    } catch (error) {
        console.error('Upload photo error:', error);
        res.status(500).json({ error: 'Failed to upload photo' });
    }
});

// ============================================
// 5. OPERATIONAL SETTINGS & TOGGLES
// ============================================

/**
 * PUT /api/shop-owner/profile/operational
 * Update operational settings (timings, radius, etc.)
 */
router.put('/profile/operational', authenticate, async (req: Request, res: Response) => {
    const userId = (req as any).userId;

    try {
        const {
            openingTime,
            closingTime,
            weeklyOff,
            deliveryRadius,
            minimumOrderValue,
            deliveryCharge
        } = req.body;

        // Get shop ID
        const shopResult = await db.query(
            'SELECT id FROM shops WHERE owner_id = $1',
            [userId]
        );

        if (shopResult.rows.length === 0) {
            return res.status(404).json({ error: 'Shop not found' });
        }

        const shopId = shopResult.rows[0].id;

        // Update operational fields
        await db.query(
            `UPDATE shops SET
                opening_hours = COALESCE($1, opening_hours),
                weekly_off = COALESCE($2, weekly_off),
                delivery_radius_km = COALESCE($3, delivery_radius_km),
                min_order_amount = COALESCE($4, min_order_amount),
                delivery_charge = COALESCE($5, delivery_charge),
                updated_at = NOW()
            WHERE id = $6`,
            [
                openingTime && closingTime ? JSON.stringify({ opening: openingTime, closing: closingTime }) : null,
                weeklyOff,
                deliveryRadius,
                minimumOrderValue,
                deliveryCharge,
                shopId
            ]
        );

        res.json({ message: 'Operational settings updated successfully' });
    } catch (error) {
        console.error('Update operational settings error:', error);
        res.status(500).json({ error: 'Failed to update operational settings' });
    }
});

/**
 * POST /api/shop-owner/profile/toggle-status
 * Toggle shop open/closed status
 */
router.post('/profile/toggle-status', authenticate, async (req: Request, res: Response) => {
    const userId = (req as any).userId;

    try {
        const { isOpen } = req.body;

        if (typeof isOpen !== 'boolean') {
            return res.status(400).json({ error: 'Invalid status value' });
        }

        const result = await db.query(
            `UPDATE shops SET 
                is_open = $1, 
                updated_at = NOW() 
            WHERE owner_id = $2 
            RETURNING id, is_open`,
            [isOpen, userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Shop not found' });
        }

        res.json({
            message: `Shop is now ${isOpen ? 'Open' : 'Closed'}`,
            isOpen: result.rows[0].is_open
        });
    } catch (error) {
        console.error('Toggle status error:', error);
        res.status(500).json({ error: 'Failed to toggle shop status' });
    }
});

/**
 * PUT /api/shop-owner/profile/payouts
 * Update shop payout settings
 */
router.put('/profile/payouts', authenticate, async (req: Request, res: Response) => {
    const userId = (req as any).userId;
    const {
        accountHolderName,
        bankAccountNumber,
        ifscCode,
        upiId,
        payoutFrequency
    } = req.body;

    try {
        const result = await db.query(
            `UPDATE shops SET
                account_holder_name = COALESCE($1, account_holder_name),
                bank_account_number = COALESCE($2, bank_account_number),
                ifsc_code = COALESCE($3, ifsc_code),
                upi_id = COALESCE($4, upi_id),
                payout_frequency = COALESCE($5, payout_frequency),
                updated_at = NOW()
            WHERE owner_id = $6
            RETURNING id`,
            [accountHolderName, bankAccountNumber, ifscCode, upiId, payoutFrequency, userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Shop not found' });
        }

        res.json({ message: 'Payout settings updated successfully' });
    } catch (error) {
        console.error('Update payout settings error:', error);
        res.status(500).json({ error: 'Failed to update payout settings' });
    }
});

/**
 * GET /api/shop-owner/diagnostics/test-signal
 * Emits a test order signal to the shop for verification
 */
router.get('/diagnostics/test-signal', async (req: Request, res: Response) => {
    const { shopId } = req.query;
    if (!shopId) return res.status(400).json({ error: 'shopId required' });

    const { emitNewOrder } = require('../lib/socket');
    emitNewOrder(shopId as string, {
        orderId: 'TEST-ORDER-777',
        totalAmount: 999,
        customerName: 'Diagnostic Tester',
        itemsCount: 1
    });

    res.json({ message: 'Test signal emitted!' });
});

export default router;
