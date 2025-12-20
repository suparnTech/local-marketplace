// backend/src/scripts/add-tables.ts
// Add missing tables to database

import * as fs from 'fs';
import * as path from 'path';
import { pool } from '../lib/db';

async function addTables() {
    console.log('🔄 Adding missing tables...\n');

    try {
        const migrationPath = path.join(__dirname, '../../migrations/003_add_missing_tables.sql');
        const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

        console.log('📄 Running migration...');
        await pool.query(migrationSQL);
        console.log('✅ Migration completed!\n');

        // Check what tables exist now
        const tables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);

        console.log('📊 All tables in database:');
        tables.rows.forEach((row: any) => {
            console.log(`  ✓ ${row.table_name}`);
        });

        console.log(`\n✅ Total: ${tables.rows.length} tables`);
        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
}

addTables();
