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
