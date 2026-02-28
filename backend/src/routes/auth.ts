// src/routes/auth.ts
import bcrypt from "bcryptjs";
import express, { Response } from "express";
import { pool } from "../lib/db";
import { authenticate, AuthRequest, generateToken } from "../middleware/auth";

const router = express.Router();

// Register
router.post("/register", async (req, res) => {
    try {
        const { name, phone, email, password, role, city, pincode, address } = req.body;

        // Check if user exists
        const existingUser = await pool.query(
            "SELECT * FROM users WHERE phone = $1",
            [phone]
        );

        if (existingUser.rows.length > 0) {
            return res.status(400).json({ error: "Phone number already registered" });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        const result = await pool.query(
            `INSERT INTO users (name, phone, email, password, role, city, pincode, address)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, name, phone, email, role, city, pincode, address, created_at`,
            [name, phone, email, hashedPassword, role || "CUSTOMER", city, pincode, address]
        );

        const user = result.rows[0];
        const token = generateToken(user.id, user.role);

        res.status(201).json({ user, token });
    } catch (error: any) {
        console.error("Registration error:", error);
        res.status(500).json({ error: "Registration failed" });
    }
});

// Login
router.post("/login", async (req, res) => {
    try {
        const { phone, password } = req.body;

        // Find user
        const result = await pool.query(
            "SELECT * FROM users WHERE phone = $1",
            [phone]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        const user = result.rows[0];

        // Check password
        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        const token = generateToken(user.id, user.role);

        // Remove password from response
        delete user.password;

        res.json({ user, token });
    } catch (error: any) {
        console.error("Login error:", error);
        res.status(500).json({ error: "Login failed" });
    }
});


// In-memory OTP store (use Redis in production)
const otpStore: Map<string, { otp: string; expiresAt: number }> = new Map();

/**
 * POST /api/auth/send-otp
 * Send OTP to phone number
 */
router.post("/send-otp", async (req, res) => {
    try {
        const { phone } = req.body;

        if (!phone || phone.length !== 10) {
            return res.status(400).json({ error: "Valid 10-digit phone number required" });
        }

        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        // Store OTP with 5-minute expiry
        otpStore.set(phone, {
            otp,
            expiresAt: Date.now() + 5 * 60 * 1000
        });

        // In production, send OTP via SMS (Twilio, MSG91, etc.)
        // For development, log it
        console.log(`📱 OTP for ${phone}: ${otp}`);

        res.json({ message: "OTP sent successfully", dev_otp: process.env.NODE_ENV === 'development' ? otp : undefined });
    } catch (error: any) {
        console.error("Send OTP error:", error);
        res.status(500).json({ error: "Failed to send OTP" });
    }
});

/**
 * POST /api/auth/verify-otp
 * Verify OTP and login
 */
router.post("/verify-otp", async (req, res) => {
    try {
        const { phone, otp } = req.body;

        if (!phone || !otp) {
            return res.status(400).json({ error: "Phone and OTP required" });
        }

        // Check OTP
        const storedOtp = otpStore.get(phone);

        // For development, accept "123456" as default OTP
        const isValidOtp = storedOtp && storedOtp.otp === otp && storedOtp.expiresAt > Date.now();
        const isDevOtp = process.env.NODE_ENV !== 'production' && otp === '123456';

        if (!isValidOtp && !isDevOtp) {
            return res.status(401).json({ error: "Invalid or expired OTP" });
        }

        // Clear OTP
        otpStore.delete(phone);

        // Find or create user
        let result = await pool.query(
            "SELECT id, name, phone, email, role FROM users WHERE phone = $1",
            [phone]
        );

        let user;
        if (result.rows.length === 0) {
            // User doesn't exist - they need to register first
            return res.status(404).json({ error: "Phone number not registered" });
        } else {
            user = result.rows[0];
        }

        // Check if user is a delivery partner (might be registered separately)
        const deliveryPartner = await pool.query(
            "SELECT id, full_name, verification_status FROM delivery_partners WHERE phone = $1",
            [phone]
        );

        // If user has delivery partner profile, treat as delivery_partner role
        if (deliveryPartner.rows.length > 0) {
            user.role = 'delivery_partner';
            user.name = deliveryPartner.rows[0].full_name || user.name;
            user.verification_status = deliveryPartner.rows[0].verification_status;
        }

        const token = generateToken(user.id, user.role);

        res.json({
            user: {
                id: user.id,
                name: user.name,
                phone: user.phone,
                email: user.email,
                role: user.role,
                verification_status: user.verification_status
            },
            token
        });
    } catch (error: any) {
        console.error("Verify OTP error:", error);
        res.status(500).json({ error: "Failed to verify OTP" });
    }
});

// Get current user
router.get("/me", authenticate, async (req: AuthRequest, res) => {
    try {
        const result = await pool.query(
            "SELECT id, name, phone, email, role, city, pincode, address, created_at FROM users WHERE id = $1",
            [req.userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "User not found" });
        }

        res.json(result.rows[0]);
    } catch (error: any) {
        console.error("Get user error:", error);
        res.status(500).json({ error: "Failed to get user" });
    }
});

// Update profile
router.put("/profile", authenticate, async (req: AuthRequest, res) => {
    try {
        const { name, email, city, pincode, address } = req.body;

        const result = await pool.query(
            `UPDATE users 
       SET name = COALESCE($1, name),
           email = COALESCE($2, email),
           city = COALESCE($3, city),
           pincode = COALESCE($4, pincode),
           address = COALESCE($5, address)
       WHERE id = $6
       RETURNING id, name, phone, email, role, city, pincode, address`,
            [name, email, city, pincode, address, req.userId]
        );

        res.json(result.rows[0]);
    } catch (error: any) {
        console.error("Update profile error:", error);
        res.status(500).json({ error: "Failed to update profile" });
    }
});

/**
 * POST /api/auth/push-token
 * Update user's push notification token
 */
router.post('/push-token', authenticate, async (req: AuthRequest, res: Response) => {
    const userId = req.userId;
    const { token } = req.body;

    if (!token) {
        return res.status(400).json({ error: 'Token is required' });
    }

    try {
        await pool.query(
            'UPDATE users SET push_token = $1, updated_at = NOW() WHERE id = $2',
            [token, userId]
        );
        res.json({ message: 'Push token updated successfully' });
    } catch (error) {
        console.error('Update push token error:', error);
        res.status(500).json({ error: 'Failed to update push token' });
    }
});

export default router;
