// scripts/seed-simple.ts
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { pool } from '../src/lib/db';

dotenv.config();

async function seed() {
    console.log('🌱 Seeding database...\n');

    try {
        // Create test customer
        const hashedPassword = await bcrypt.hash('password123', 10);

        const customerResult = await pool.query(
            `INSERT INTO users (name, phone, email, password, role, city, pincode, address)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (phone) DO UPDATE SET name = EXCLUDED.name
       RETURNING id, name, role`,
            ['Test Customer', '9876543210', 'customer@test.com', hashedPassword, 'CUSTOMER', 'Araria', '854311', 'Ward 5, Main Road']
        );
        console.log('✅ Created customer:', customerResult.rows[0].name);

        // Create store owner
        const ownerResult = await pool.query(
            `INSERT INTO users (name, phone, email, password, role, city)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (phone) DO UPDATE SET name = EXCLUDED.name
       RETURNING id, name, role`,
            ['Rajesh Kumar', '9876543211', 'rajesh@test.com', hashedPassword, 'STORE_OWNER', 'Araria']
        );
        console.log('✅ Created store owner:', ownerResult.rows[0].name);

        const ownerId = ownerResult.rows[0].id;

        // Create stores
        const store1 = await pool.query(
            `INSERT INTO stores (owner_id, name, address, city, pincode, category, description, is_verified, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id, name`,
            [ownerId, 'Mishra Kirana Store', 'Ward 5, Main Road', 'Araria', '854311', 'GROCERY', 'Your daily essentials at best prices', true, true]
        );
        console.log('✅ Created store:', store1.rows[0].name);

        const store2 = await pool.query(
            `INSERT INTO stores (owner_id, name, address, city, pincode, category, description, is_verified, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id, name`,
            [ownerId, 'City Care Pharmacy', 'Hospital Road', 'Araria', '854311', 'PHARMACY', '24x7 medical store', true, true]
        );
        console.log('✅ Created store:', store2.rows[0].name);

        // Create products
        await pool.query(
            `INSERT INTO products (store_id, name, description, price, unit, category, is_available, stock)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [store1.rows[0].id, 'Rice (Basmati)', 'Premium quality basmati rice', 120, 'kg', 'Grains', true, 50]
        );

        await pool.query(
            `INSERT INTO products (store_id, name, price, unit, is_available, stock)
       VALUES ($1, $2, $3, $4, $5, $6)`,
            [store1.rows[0].id, 'Toor Dal', 140, 'kg', true, 30]
        );

        await pool.query(
            `INSERT INTO products (store_id, name, price, unit, is_available, stock)
       VALUES ($1, $2, $3, $4, $5, $6)`,
            [store2.rows[0].id, 'Paracetamol 500mg', 15, 'strip', true, 100]
        );

        console.log('✅ Created products');

        console.log('\n🎉 Database seeded successfully!');
        console.log('\n📝 Test Login:');
        console.log('   Phone: 9876543210');
        console.log('   Password: password123');

    } catch (error: any) {
        console.error('❌ Seeding failed:', error.message);
        throw error;
    } finally {
        await pool.end();
    }
}

seed();
