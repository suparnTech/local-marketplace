// backend/src/scripts/run-migration.ts
// Script to run database migrations programmatically

import * as fs from 'fs';
import * as path from 'path';
import { pool } from '../lib/db';

async function runMigration() {
    console.log('🔄 Starting database migration...\n');

    try {
        // Read the migration file
        const migrationPath = path.join(__dirname, '../../migrations/001_marketplace_schema.sql');
        const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

        console.log('📄 Running schema migration...');
        await pool.query(migrationSQL);
        console.log('✅ Schema migration completed!\n');

        // Read the seed data file
        const seedPath = path.join(__dirname, '../../migrations/002_seed_data.sql');
        const seedSQL = fs.readFileSync(seedPath, 'utf8');

        console.log('🌱 Seeding initial data...');
        await pool.query(seedSQL);
        console.log('✅ Seed data inserted!\n');

        // Verify tables were created
        const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);

        console.log('📊 Tables created:');
        result.rows.forEach((row: any) => {
            console.log(`  ✓ ${row.table_name}`);
        });

        console.log('\n🎉 Migration completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
}

runMigration();
