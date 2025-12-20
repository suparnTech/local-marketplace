// backend/src/scripts/seed-data.ts
// Script to seed initial data only

import * as fs from 'fs';
import * as path from 'path';
import { pool } from '../lib/db';

async function seedData() {
    console.log('🌱 Starting data seeding...\n');

    try {
        // Check if data already exists
        const townsCheck = await pool.query('SELECT COUNT(*) FROM towns');
        const categoriesCheck = await pool.query('SELECT COUNT(*) FROM categories');

        if (parseInt(townsCheck.rows[0].count) > 0) {
            console.log('⚠️  Towns already exist. Skipping town seeding.');
        } else {
            console.log('📍 Seeding towns...');
            const seedPath = path.join(__dirname, '../../migrations/002_seed_data.sql');
            const seedSQL = fs.readFileSync(seedPath, 'utf8');
            await pool.query(seedSQL);
            console.log('✅ Seed data inserted!\n');
        }

        // Show summary
        const summary = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM towns) as towns,
        (SELECT COUNT(*) FROM categories) as categories,
        (SELECT COUNT(*) FROM shops) as shops,
        (SELECT COUNT(*) FROM products) as products
    `);

        console.log('📊 Database Summary:');
        console.log(`  Towns: ${summary.rows[0].towns}`);
        console.log(`  Categories: ${summary.rows[0].categories}`);
        console.log(`  Shops: ${summary.rows[0].shops}`);
        console.log(`  Products: ${summary.rows[0].products}`);

        console.log('\n🎉 Database is ready!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Seeding failed:', error);
        process.exit(1);
    }
}

seedData();
