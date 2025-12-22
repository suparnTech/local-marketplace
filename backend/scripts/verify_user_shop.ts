import { pool } from './src/lib/db';

async function verify() {
    try {
        console.log("=== Verifying Shop Locations ===");
        // Fetch users who are shop owners and their shop details
        const query = `
            SELECT 
                u.name as user_name,
                s.name as shop_name,
                s.latitude,
                s.longitude,
                s.delivery_radius_km
            FROM users u
            JOIN shops s ON u.id = s.owner_id
            WHERE u.role = 'STORE_OWNER'
        `;

        const res = await pool.query(query);
        console.table(res.rows);

    } catch (err) {
        console.error("Error:", err);
    } finally {
        pool.end();
    }
}

verify();
