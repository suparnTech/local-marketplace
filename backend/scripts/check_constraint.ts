import { pool } from './src/lib/db';

async function checkConstraint() {
    try {
        console.log("Checking constraint definition...");
        const res = await pool.query("SELECT pg_get_constraintdef(oid) as def FROM pg_constraint WHERE conname = 'orders_status_check'");
        if (res.rows.length > 0) {
            console.log("Constraint Definition:", res.rows[0].def);
        } else {
            console.log("Constraint not found.");
        }
    } catch (err) {
        console.error("Error:", err);
    } finally {
        pool.end();
    }
}

checkConstraint();
