import { pool } from './src/lib/db';

async function updateLocation() {
    try {
        console.log("Updating shop locations to Delhi (CP)...");
        const query = `
            UPDATE shops 
            SET latitude = 28.6304, longitude = 77.2177 
            WHERE latitude IS NULL OR longitude IS NULL
        `;
        const res = await pool.query(query);
        console.log(`Updated ${res.rowCount} shops.`);
    } catch (err) {
        console.error("Error:", err);
    } finally {
        pool.end();
    }
}

updateLocation();
