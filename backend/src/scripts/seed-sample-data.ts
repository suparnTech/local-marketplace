// backend/src/scripts/seed-sample-data.ts
// Seed sample data for testing

import { pool } from '../lib/db';

async function seedSampleData() {
    console.log('🌱 Seeding sample data...\n');

    try {
        // 1. Seed Towns
        console.log('📍 Seeding towns...');
        await pool.query(`
      INSERT INTO towns (name, state, district, pincode, latitude, longitude, population) VALUES
      ('Saharanpur', 'Uttar Pradesh', 'Saharanpur', '247001', 29.9680, 77.5460, 705478),
      ('Meerut', 'Uttar Pradesh', 'Meerut', '250001', 28.9845, 77.7064, 1305429),
      ('Moradabad', 'Uttar Pradesh', 'Moradabad', '244001', 28.8389, 78.7769, 889810)
      ON CONFLICT DO NOTHING;
    `);
        console.log('✅ Towns seeded');

        // 2. Seed Categories
        console.log('📦 Seeding categories...');
        await pool.query(`
      INSERT INTO categories (name, slug, description, icon, color, display_order) VALUES
      ('Grocery & Staples', 'grocery', 'Daily essentials, vegetables, fruits', 'cart', '#10B981', 1),
      ('Electronics', 'electronics', 'Mobile phones, laptops, accessories', 'phone-portrait', '#3B82F6', 2),
      ('Fashion & Clothing', 'fashion', 'Clothes, shoes, accessories', 'shirt', '#EC4899', 3),
      ('Health & Medicine', 'health', 'Medicines, health supplements', 'medical', '#EF4444', 4),
      ('Home & Kitchen', 'home-kitchen', 'Furniture, appliances, decor', 'home', '#F59E0B', 5)
      ON CONFLICT (slug) DO NOTHING;
    `);
        console.log('✅ Categories seeded');

        // Get counts
        const summary = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM towns) as towns,
        (SELECT COUNT(*) FROM categories) as categories,
        (SELECT COUNT(*) FROM shops) as shops,
        (SELECT COUNT(*) FROM products) as products
    `);

        console.log('\n📊 Database Summary:');
        console.log(`  Towns: ${summary.rows[0].towns}`);
        console.log(`  Categories: ${summary.rows[0].categories}`);
        console.log(`  Shops: ${summary.rows[0].shops}`);
        console.log(`  Products: ${summary.rows[0].products}`);

        console.log('\n🎉 Sample data seeded successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Seeding failed:', error);
        process.exit(1);
    }
}

seedSampleData();
