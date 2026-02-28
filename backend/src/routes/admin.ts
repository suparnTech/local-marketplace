// src/routes/admin.ts
import express from 'express';
import { pool } from '../lib/db';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Middleware to check if user is admin
const requireAdmin = (req: AuthRequest, res: any, next: any) => {
    if (req.userRole !== 'ADMIN') {
        return res.status(403).json({ error: 'Admin access required' });
    }
    next();
};

// Get pending shops with details
router.get('/pending-vendors', authenticate, requireAdmin, async (req, res) => {
    try {
        // Join users, shops, and towns to get full info
        const result = await pool.query(
            `SELECT 
                s.id as id,
                s.name as "businessName",
                u.name as "ownerName",
                u.phone,
                t.name as city,
                s.verification_status as status,
                s.updated_at as "submittedAt"
            FROM shops s
            JOIN users u ON s.owner_id = u.id
            LEFT JOIN towns t ON s.town_id = t.id
            WHERE s.verification_status = 'submitted' OR (u.role = 'STORE_OWNER' AND u.is_approved = false AND s.id IS NOT NULL)
            ORDER BY s.updated_at DESC`
        );

        res.json(result.rows);
    } catch (error: any) {
        console.error('Get pending vendors error:', error);
        res.status(500).json({ error: 'Failed to fetch pending vendors' });
    }
});

// Get pending delivery partners
router.get('/pending-delivery-partners', authenticate, requireAdmin, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT 
                id,
                full_name as "fullName",
                email,
                phone,
                city,
                vehicle_type as "vehicleType",
                verification_status as status,
                created_at as "submittedAt",
                aadhaar_front_url,
                driving_license_url
            FROM delivery_partners
            WHERE verification_status = 'pending'
            ORDER BY created_at DESC`
        );

        res.json(result.rows);
    } catch (error: any) {
        console.error('Get pending delivery partners error:', error);
        res.status(500).json({ error: 'Failed to fetch pending delivery partners' });
    }
});

// Verify delivery partner (Approve/Reject)
router.post('/delivery-partners/:partnerId/verify', authenticate, requireAdmin, async (req: AuthRequest, res) => {
    try {
        const { partnerId } = req.params;
        const { status, reason } = req.body; // status: 'approved' | 'rejected'

        if (!['approved', 'rejected'].includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }

        await pool.query(
            `UPDATE delivery_partners 
             SET verification_status = $1, 
                 rejection_reason = $2,
                 verified_at = NOW()
             WHERE id = $3`,
            [status, reason || null, partnerId]
        );

        res.json({ message: `Delivery partner ${status} successfully` });
    } catch (error: any) {
        console.error('Verify delivery partner error:', error);
        res.status(500).json({ error: 'Failed to verify delivery partner' });
    }
});

// Get delivery partner KYC details
router.get('/delivery-partners/:partnerId/kyc', authenticate, requireAdmin, async (req, res) => {
    try {
        const { partnerId } = req.params;

        const result = await pool.query(
            `SELECT * FROM delivery_partners WHERE id = $1`,
            [partnerId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Delivery partner not found' });
        }

        const partner = result.rows[0];

        // Convert S3 URLs to presigned URLs for viewing
        const { getDownloadUrl } = require('../lib/s3');

        const urlToPresigned = (url: string) => {
            if (!url) return null;
            // Extract key from URL (e.g., documents/uuid.jpg)
            const match = url.match(/amazonaws\.com\/(.+)$/);
            if (match && match[1]) {
                return getDownloadUrl(match[1]);
            }
            return url;
        };

        partner.aadhaar_front_url = urlToPresigned(partner.aadhaar_front_url);
        partner.aadhaar_back_url = urlToPresigned(partner.aadhaar_back_url);
        partner.driving_license_url = urlToPresigned(partner.driving_license_url);
        partner.vehicle_rc_url = urlToPresigned(partner.vehicle_rc_url);

        res.json(partner);
    } catch (error: any) {
        console.error('Get delivery partner KYC error:', error);
        res.status(500).json({ error: 'Failed to fetch delivery partner details' });
    }
});

// Get specific shop KYC details
router.get('/shops/:shopId/kyc', authenticate, requireAdmin, async (req, res) => {
    try {
        const { shopId } = req.params;

        const result = await pool.query(
            `SELECT 
                s.*,
                u.name as owner_name,
                u.email as owner_email,
                u.phone as owner_phone,
                t.name as town_name,
                t.state as town_state
            FROM shops s
            JOIN users u ON s.owner_id = u.id
            LEFT JOIN towns t ON s.town_id = t.id
            WHERE s.id = $1`,
            [shopId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Shop not found' });
        }

        const shop = result.rows[0];

        // Structure response for frontend
        const response = {
            businessName: shop.name,
            ownerName: shop.owner_name,
            phone: shop.owner_phone,
            email: shop.owner_email,
            address: `${shop.address_line1 || ''}, ${shop.town_name || ''}, ${shop.town_state || ''} - ${shop.pincode || ''}`,
            gstNumber: shop.gst_number,
            panNumber: shop.pan_number,
            aadhaarNumber: 'Not Stored', // Security best practice
            accountNumber: shop.bank_account_number,
            ifscCode: shop.ifsc_code,
            documents: {
                gst: shop.gst_document_url,
                pan: shop.pan_document_url,
                aadhaar: shop.aadhaar_document_url,
                shopLicense: shop.shop_license_url,
                cancelledCheque: shop.cancelled_cheque_url,
                shopPhotos: [], // TODO: Add multiple photos support if needed
            }
        };

        res.json(response);
    } catch (error: any) {
        console.error('Get shop KYC error:', error);
        res.status(500).json({ error: 'Failed to fetch shop details' });
    }
});

// Verify shop (Approve/Reject)
router.post('/shops/:shopId/verify', authenticate, requireAdmin, async (req: AuthRequest, res) => {
    const client = await pool.connect();
    try {
        const { shopId } = req.params;
        const { status, reason } = req.body; // status: 'approved' | 'rejected'
        const adminId = req.userId;

        if (!['approved', 'rejected'].includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }

        await client.query('BEGIN');

        // Update shop status
        await client.query(
            `UPDATE shops 
             SET verification_status = $1, 
                 is_approved = $2, 
                 rejection_reason = $3,
                 verified_at = NOW()
             WHERE id = $4`,
            [status, status === 'approved', reason || null, shopId]
        );

        // Get owner_id
        const shopRes = await client.query('SELECT owner_id FROM shops WHERE id = $1', [shopId]);
        if (shopRes.rows.length > 0) {
            const ownerId = shopRes.rows[0].owner_id;

            // Update user status
            await client.query(
                `UPDATE users 
                 SET is_approved = $1, 
                     approved_at = $2, 
                     approved_by = $3
                 WHERE id = $4`,
                [status === 'approved', status === 'approved' ? new Date() : null, adminId, ownerId]
            );
        }

        await client.query('COMMIT');
        res.json({ message: `Shop ${status} successfully` });
    } catch (error: any) {
        await client.query('ROLLBACK');
        console.error('Verify shop error:', error);
        res.status(500).json({ error: 'Failed to verify shop' });
    } finally {
        client.release();
    }
});

router.post('/run-migration-products', authenticate, requireAdmin, async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Add columns to products table
        await client.query(`
            ALTER TABLE products ADD COLUMN IF NOT EXISTS shop_price DECIMAL(10,2);
            ALTER TABLE products ADD COLUMN IF NOT EXISTS customer_price DECIMAL(10,2);
            ALTER TABLE products ADD COLUMN IF NOT EXISTS commission_amount DECIMAL(10,2);
            ALTER TABLE products ADD COLUMN IF NOT EXISTS mrp DECIMAL(10,2);
            ALTER TABLE products ADD COLUMN IF NOT EXISTS unit VARCHAR(50);
            ALTER TABLE products ADD COLUMN IF NOT EXISTS hsn_code VARCHAR(50);
            ALTER TABLE products ADD COLUMN IF NOT EXISTS expiry_date DATE;
        `);

        // Create product_uploads table
        await client.query(`
            CREATE TABLE IF NOT EXISTS product_uploads (
              id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
              shop_id UUID REFERENCES shops(id),
              file_name TEXT,
              total_rows INTEGER,
              successful_rows INTEGER,
              failed_rows INTEGER,
              error_log JSONB,
              status VARCHAR(20) DEFAULT 'processing',
              created_at TIMESTAMP DEFAULT NOW()
            );
        `);

        await client.query('COMMIT');
        res.json({ message: 'Migration executed successfully' });
    } catch (error: any) {
        await client.query('ROLLBACK');
        console.error('Migration error:', error);
        res.status(500).json({ error: error.message });
    } finally {
        client.release();
    }
});

export default router;
