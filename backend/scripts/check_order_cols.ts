import { pool } from './src/lib/db';

async function describeTable() {
    try {
        console.log("Checking columns for 'orders' table...");
        const res = await pool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'orders'
        `);
        console.table(res.rows);
    } catch (err) {
        console.error("Error:", err);
    } finally {
        pool.end();
    }
}

describeTable();
