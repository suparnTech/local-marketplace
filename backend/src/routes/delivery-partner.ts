// Delivery Partner Routes
import express, { Response } from 'express';
import { pool as db } from '../lib/db';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = express.Router();

/**
 * POST /api/delivery-partner/register
 * Register as delivery partner (public - no auth required)
 */
router.post('/register', async (req: express.Request, res: Response) => {
    const {
        full_name,
        phone,
        email,
        password,
        date_of_birth,
        address_line1,
        address_line2,
        city,
        state,
        pincode,
        aadhaar_number,
        aadhaar_front_url,
        aadhaar_back_url,
        driving_license_number,
        driving_license_url,
        pan_number,
        vehicle_type,
        vehicle_number,
        vehicle_rc_url,
        bank_account_number,
        ifsc_code,
        upi_id
    } = req.body;

    try {
        // Validate required fields
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        if (password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters' });
        }

        // Check if email already registered as delivery partner
        const existingPartner = await db.query(
            'SELECT id FROM delivery_partners WHERE email = $1',
            [email]
        );

        if (existingPartner.rows.length > 0) {
            return res.status(400).json({ error: 'Email already registered as delivery partner' });
        }

        // Hash password
        const bcrypt = require('bcryptjs');
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new user account for delivery partner
        const newUser = await db.query(
            `INSERT INTO users (name, phone, email, password, role)
             VALUES ($1, $2, $3, $4, 'DELIVERY_PARTNER')
             RETURNING id`,
            [full_name, phone, email, hashedPassword]
        );
        const userId = newUser.rows[0].id;

        // Create delivery partner profile
        const result = await db.query(
            `INSERT INTO delivery_partners (
                user_id, full_name, phone, email, date_of_birth,
                address_line1, address_line2, city, state, pincode,
                aadhaar_number, aadhaar_front_url, aadhaar_back_url,
                driving_license_number, driving_license_url,
                pan_number,
                vehicle_type, vehicle_number, vehicle_rc_url,
                bank_account_number, ifsc_code, upi_id,
                verification_status
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 
                $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, 'pending'
            ) RETURNING *`,
            [
                userId, full_name, phone, email, date_of_birth,
                address_line1, address_line2, city, state, pincode,
                aadhaar_number, aadhaar_front_url, aadhaar_back_url,
                driving_license_number, driving_license_url,
                pan_number,
                vehicle_type, vehicle_number, vehicle_rc_url,
                bank_account_number, ifsc_code, upi_id
            ]
        );

        res.json({
            message: 'Registration successful! Your application will be reviewed by our team within 24-48 hours.',
            partner: result.rows[0],
            token: require('jsonwebtoken').sign(
                { userId, role: 'delivery_partner' },
                process.env.JWT_SECRET!,
                { expiresIn: '30d' }
            ),
            user: {
                id: userId,
                phone,
                full_name,
                role: 'delivery_partner',
            }
        });
    } catch (error: any) {
        console.error('❌ Partner registration error:', error);
        console.error('Error details:', {
            message: error.message,
            code: error.code,
            detail: error.detail,
            stack: error.stack
        });
        res.status(500).json({
            error: 'Registration failed. Please try again.',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * POST /api/delivery-partner/login
 * Login with email and password
 */
router.post('/login', async (req: express.Request, res: Response) => {
    const { email, password } = req.body;

    try {
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password required' });
        }

        // Find delivery partner by email
        const partnerResult = await db.query(
            'SELECT dp.*, u.password as user_password, u.id as user_id FROM delivery_partners dp JOIN users u ON dp.email = u.email WHERE dp.email = $1',
            [email]
        );

        if (partnerResult.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const partner = partnerResult.rows[0];

        // Verify password
        const bcrypt = require('bcryptjs');
        const isValid = await bcrypt.compare(password, partner.user_password);

        if (!isValid) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Generate token
        const jwt = require('jsonwebtoken');
        const token = jwt.sign(
            { userId: partner.user_id, role: 'delivery_partner' },
            process.env.JWT_SECRET!,
            { expiresIn: '30d' }
        );

        res.json({
            token,
            user: {
                id: partner.user_id,
                name: partner.full_name,
                email: partner.email,
                phone: partner.phone,
                role: 'delivery_partner',
            },
            verification_status: partner.verification_status,
        });
    } catch (error: any) {
        console.error('❌ Delivery partner login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});

/**
 * GET /api/delivery-partner/profile
 * Get partner profile
 */
router.get('/profile', authenticate, async (req: AuthRequest, res: Response) => {
    const userId = req.userId;

    try {
        const result = await db.query(
            'SELECT * FROM delivery_partners WHERE user_id = $1',
            [userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Partner profile not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Get partner profile error:', error);
        res.status(500).json({ error: 'Failed to fetch profile' });
    }
});

/**
 * PUT /api/delivery-partner/profile
 * Update partner profile
 */
router.put('/profile', authenticate, async (req: AuthRequest, res: Response) => {
    const userId = req.userId;
    const {
        phone,
        email,
        address_line1,
        address_line2,
        city,
        state,
        pincode,
        latitude,
        longitude,
        bank_account_number,
        ifsc_code,
        account_holder_name,
        upi_id,
        service_area_pincodes,
        max_delivery_radius_km,
        profile_photo_url
    } = req.body;

    try {
        const result = await db.query(
            `UPDATE delivery_partners SET
        phone = COALESCE($1, phone),
        email = COALESCE($2, email),
        address_line1 = COALESCE($3, address_line1),
        address_line2 = COALESCE($4, address_line2),
        city = COALESCE($5, city),
        state = COALESCE($6, state),
        pincode = COALESCE($7, pincode),
        latitude = COALESCE($8, latitude),
        longitude = COALESCE($9, longitude),
        bank_account_number = COALESCE($10, bank_account_number),
        ifsc_code = COALESCE($11, ifsc_code),
        account_holder_name = COALESCE($12, account_holder_name),
        upi_id = COALESCE($13, upi_id),
        service_area_pincodes = COALESCE($14, service_area_pincodes),
        max_delivery_radius_km = COALESCE($15, max_delivery_radius_km),
        profile_photo_url = COALESCE($16, profile_photo_url),
        updated_at = NOW()
      WHERE user_id = $17
      RETURNING *`,
            [
                phone, email, address_line1, address_line2, city, state, pincode,
                latitude, longitude, bank_account_number, ifsc_code, account_holder_name,
                upi_id, service_area_pincodes, max_delivery_radius_km, profile_photo_url,
                userId
            ]
        );

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Update partner profile error:', error);
        res.status(500).json({ error: 'Failed to update profile' });
    }
});

/**
 * PUT /api/delivery-partner/availability
 * Toggle availability (online/offline)
 */
router.put('/availability', authenticate, async (req: AuthRequest, res: Response) => {
    const userId = req.userId;
    const { is_available, current_location } = req.body;

    try {
        const result = await db.query(
            `UPDATE delivery_partners SET
        is_available = $1,
        is_online = $1,
        current_location = $2,
        last_online_at = NOW(),
        updated_at = NOW()
      WHERE user_id = $3
      RETURNING *`,
            [is_available, current_location, userId]
        );

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Update availability error:', error);
        res.status(500).json({ error: 'Failed to update availability' });
    }
});

/**
 * PUT /api/delivery-partner/location
 * Update current location (for tracking)
 */
router.put('/location', authenticate, async (req: AuthRequest, res: Response) => {
    const userId = req.userId;
    const { latitude, longitude } = req.body;

    try {
        const current_location = {
            lat: latitude,
            lng: longitude,
            updated_at: new Date().toISOString()
        };

        await db.query(
            `UPDATE delivery_partners SET
        current_location = $1,
        latitude = $2,
        longitude = $3,
        last_online_at = NOW()
      WHERE user_id = $4`,
            [current_location, latitude, longitude, userId]
        );

        res.json({ message: 'Location updated' });
    } catch (error) {
        console.error('Update location error:', error);
        res.status(500).json({ error: 'Failed to update location' });
    }
});

/**
 * GET /api/delivery-partner/stats
 * Get partner statistics
 */
router.get('/stats', authenticate, async (req: AuthRequest, res: Response) => {
    const userId = req.userId;

    try {
        const partner = await db.query(
            'SELECT * FROM delivery_partners WHERE user_id = $1',
            [userId]
        );

        if (partner.rows.length === 0) {
            return res.status(404).json({ error: 'Partner not found' });
        }

        const partnerId = partner.rows[0].id;

        // Get today's stats
        const today = new Date().toISOString().split('T')[0];
        const todayStats = await db.query(
            `SELECT 
        COUNT(*) as today_deliveries,
        COALESCE(SUM(partner_earnings), 0) as today_earnings
      FROM delivery_assignments
      WHERE assigned_to = $1 
      AND DATE(delivered_at) = $2
      AND status = 'delivered'`,
            [partnerId, today]
        );

        // Get pending deliveries
        const pending = await db.query(
            `SELECT COUNT(*) as pending_count
      FROM delivery_assignments
      WHERE assigned_to = $1 
      AND status IN ('accepted', 'on_way_to_pickup', 'picked_up', 'on_way_to_delivery')`,
            [partnerId]
        );

        res.json({
            total_deliveries: partner.rows[0].total_deliveries,
            successful_deliveries: partner.rows[0].successful_deliveries,
            rating: partner.rows[0].rating,
            total_earnings: partner.rows[0].total_earnings,
            today_deliveries: parseInt(todayStats.rows[0].today_deliveries),
            today_earnings: parseFloat(todayStats.rows[0].today_earnings),
            pending_deliveries: parseInt(pending.rows[0].pending_count)
        });
    } catch (error) {
        console.error('Get stats error:', error);
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
});

export default router;
