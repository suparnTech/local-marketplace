// scripts/add-vendor-approval.ts
import dotenv from 'dotenv';
import { Pool } from 'pg';

dotenv.config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false,
    },
});

async function addVendorApproval() {
    console.log('📝 Adding vendor approval columns...\n');

    try {
        // Add columns
        await pool.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT true,
      ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP,
      ADD COLUMN IF NOT EXISTS approved_by VARCHAR(255)
    `);

        console.log('✅ Columns added');

        // Set approval status
        await pool.query(`
      UPDATE users SET is_approved = true WHERE role = 'CUSTOMER'
    `);

        await pool.query(`
      UPDATE users SET is_approved = false WHERE role = 'STORE_OWNER'
    `);

        console.log('✅ Approval status set');

        // Create index
        await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_users_is_approved ON users(is_approved)
    `);

        console.log('✅ Index created');
        console.log('\n🎉 Vendor approval system ready!');

        await pool.end();
    } catch (error: any) {
        console.error('❌ Error:', error.message);
        throw error;
    }
}

addVendorApproval();
