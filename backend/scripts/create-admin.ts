// scripts/create-admin.ts
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { Pool } from 'pg';

dotenv.config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false,
    },
});

async function createAdmin() {
    console.log('👑 Creating admin user...\n');

    const adminEmail = 'admin@localmarketplace.com';
    const adminPassword = 'Admin@123';
    const adminName = 'Admin User';
    const adminPhone = '0000000000';

    try {
        // Check if admin exists
        const existing = await pool.query('SELECT id FROM users WHERE email = $1', [adminEmail]);

        if (existing.rows.length > 0) {
            console.log('ℹ️  Admin user already exists!');
            console.log('\n📧 Email:', adminEmail);
            console.log('🔑 Password:', adminPassword);
            await pool.end();
            return;
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(adminPassword, 10);

        // Create admin user
        await pool.query(
            `INSERT INTO users (name, email, phone, password, role, is_approved, created_at)
       VALUES ($1, $2, $3, $4, 'ADMIN', true, NOW())`,
            [adminName, adminEmail, adminPhone, hashedPassword]
        );

        console.log('✅ Admin user created successfully!');
        console.log('\n📧 Email:', adminEmail);
        console.log('🔑 Password:', adminPassword);
        console.log('\n⚠️  Please change this password after first login!');

        await pool.end();
    } catch (error: any) {
        console.error('❌ Error:', error.message);
        throw error;
    }
}

createAdmin();
