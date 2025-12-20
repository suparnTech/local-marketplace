// backend/src/scripts/check-db.ts
// Check database status

import { pool } from '../lib/db';

async function checkDatabase() {
    console.log('🔍 Checking database status...\n');

    try {
        // List all tables
        const tables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);

        console.log('📊 Existing tables:');
        if (tables.rows.length === 0) {
            console.log('  (none - database is empty)');
        } else {
            tables.rows.forEach((row: any) => {
                console.log(`  ✓ ${row.table_name}`);
            });
        }

        console.log(`\nTotal: ${tables.rows.length} tables`);
        process.exit(0);
    } catch (error) {
        console.error('❌ Check failed:', error);
        process.exit(1);
    }
}

checkDatabase();
