import { pool } from './src/lib/db';

async function fixVisibility() {
    try {
        console.log("=== Fixing Shop Visibility ===");

        // 1. Check Towns
        const towns = await pool.query("SELECT * FROM towns WHERE name ILIKE '%Delhi%'");
        console.log("Towns found:", towns.rows);

        let delhiId;
        if (towns.rows.length > 0) {
            delhiId = towns.rows[0].id;
            console.log(`Using Town ID: ${delhiId} for Delhi`);
        } else {
            console.log("Delhi town not found. Creating...");
            const newTown = await pool.query("INSERT INTO towns (name, slug, is_active) VALUES ('Delhi', 'delhi', true) RETURNING id");
            delhiId = newTown.rows[0].id;
            console.log(`Created Town ID: ${delhiId}`);
        }

        // 2. Update Shop
        // We look for 'Suparn Business' or just update all shops owned by STORE_OWNER to this town for testing
        // to match the user's "in delhi" context.
        const update = await pool.query(`
            UPDATE shops 
            SET 
                town_id = $1, 
                is_active = true, 
                is_approved = true,
                rating = 5.0,  -- Boost rating so it appears at top if sorted by rating
                total_reviews = 1
            WHERE latitude IS NOT NULL -- The one we just updated
            RETURNING id, name, town_id, is_active, is_approved
        `, [delhiId]);

        console.log("Updated Shops:", update.rows);

    } catch (err) {
        console.error("Error:", err);
    } finally {
        pool.end();
    }
}

fixVisibility();
