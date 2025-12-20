// src/routes/admin.ts
import express from 'express';
import { pool } from '../lib/db';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Middleware to check if user is admin
const requireAdmin = (req: AuthRequest, res: any, next: any) => {
    console.log('👮 Checking admin access for role:', req.userRole);
    if (req.userRole !== 'ADMIN') {
        console.log('❌ User is not admin:', req.userRole);
        return res.status(403).json({ error: 'Admin access required' });
    }
    console.log('✅ Admin access granted');
    next();
};

// Get pending vendors
router.get('/pending-vendors', authenticate, requireAdmin, async (req, res) => {
    try {
        console.log('📋 Admin fetching pending vendors');
        const result = await pool.query(
            `SELECT id, name, email, phone, created_at 
       FROM users 
       WHERE role = 'STORE_OWNER' AND is_approved = false
       ORDER BY created_at DESC`
        );

        console.log(`✅ Found ${result.rows.length} pending vendors`);
        res.json(result.rows);
    } catch (error: any) {
        console.error('Get pending vendors error:', error);
        res.status(500).json({ error: 'Failed to fetch pending vendors' });
    }
});

// Approve vendor
router.post('/approve-vendor/:id', authenticate, requireAdmin, async (req: AuthRequest, res) => {
    try {
        const { id } = req.params;
        const adminId = req.userId;

        await pool.query(
            `UPDATE users 
       SET is_approved = true, approved_at = NOW(), approved_by = $1
       WHERE id = $2 AND role = 'STORE_OWNER'`,
            [adminId, id]
        );

        // TODO: Send approval email to vendor

        res.json({ message: 'Vendor approved successfully' });
    } catch (error: any) {
        console.error('Approve vendor error:', error);
        res.status(500).json({ error: 'Failed to approve vendor' });
    }
});

// Reject vendor
router.post('/reject-vendor/:id', authenticate, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;

        // Delete the user (or you could mark as rejected instead)
        await pool.query(
            `DELETE FROM users WHERE id = $1 AND role = 'STORE_OWNER' AND is_approved = false`,
            [id]
        );

        // TODO: Send rejection email to vendor

        res.json({ message: 'Vendor rejected successfully' });
    } catch (error: any) {
        console.error('Reject vendor error:', error);
        res.status(500).json({ error: 'Failed to reject vendor' });
    }
});

// Get all users
router.get('/users', authenticate, requireAdmin, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT id, name, email, phone, role, is_approved, created_at 
       FROM users 
       ORDER BY created_at DESC`
        );

        res.json(result.rows);
    } catch (error: any) {
        console.error('Get users error:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

export default router;
