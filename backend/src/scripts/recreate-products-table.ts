// backend/src/scripts/recreate-products-table.ts
// Drop old products table and create new one with proper schema

import { pool } from '../lib/db';

async function recreateProductsTable() {
    console.log('🔄 Recreating products table...\n');

    try {
        // Drop old products table and related tables
        console.log('🗑️  Dropping old tables...');
        await pool.query('DROP TABLE IF EXISTS reviews CASCADE');
        await pool.query('DROP TABLE IF EXISTS order_items CASCADE');
        await pool.query('DROP TABLE IF EXISTS cart_items CASCADE');
        await pool.query('DROP TABLE IF EXISTS wishlist_items CASCADE');
        await pool.query('DROP TABLE IF EXISTS products CASCADE');
        await pool.query('DROP TABLE IF EXISTS Product CASCADE');
        console.log('✅ Old tables dropped\n');

        // Create new products table
        console.log('📦 Creating new products table...');
        await pool.query(`
      CREATE TABLE products (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
        category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
        
        -- Basic Info
        name VARCHAR(300) NOT NULL,
        slug VARCHAR(300),
        description TEXT,
        short_description VARCHAR(500),
        
        -- Pricing
        price DECIMAL(10, 2) NOT NULL,
        original_price DECIMAL(10, 2),
        discount_percentage INTEGER DEFAULT 0,
        
        -- Inventory
        sku VARCHAR(100),
        stock_quantity INTEGER DEFAULT 0,
        low_stock_threshold INTEGER DEFAULT 5,
        track_inventory BOOLEAN DEFAULT true,
        
        -- Media
        images TEXT[] NOT NULL DEFAULT '{}',
        thumbnail_url TEXT,
        video_url TEXT,
        
        -- Variants
        has_variants BOOLEAN DEFAULT false,
        variants JSONB,
        
        -- Product Details
        brand VARCHAR(100),
        manufacturer VARCHAR(100),
        weight DECIMAL(10, 3),
        dimensions JSONB,
        
        -- SEO & Tags
        tags TEXT[],
        meta_title VARCHAR(200),
        meta_description TEXT,
        
        -- Stats
        rating DECIMAL(3, 2) DEFAULT 0,
        total_reviews INTEGER DEFAULT 0,
        total_sales INTEGER DEFAULT 0,
        view_count INTEGER DEFAULT 0,
        
        -- Status
        is_available BOOLEAN DEFAULT true,
        is_featured BOOLEAN DEFAULT false,
        is_new_arrival BOOLEAN DEFAULT false,
        is_best_seller BOOLEAN DEFAULT false,
        
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
      
      CREATE INDEX idx_products_shop ON products(shop_id);
      CREATE INDEX idx_products_category ON products(category_id);
      CREATE INDEX idx_products_available ON products(is_available);
      CREATE INDEX idx_products_price ON products(price);
      CREATE INDEX idx_products_rating ON products(rating);
    `);
        console.log('✅ Products table created\n');

        // Recreate dependent tables
        console.log('🔗 Creating dependent tables...');

        // Cart items
        await pool.query(`
      CREATE TABLE IF NOT EXISTS cart_items (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        product_id UUID REFERENCES products(id) ON DELETE CASCADE,
        shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
        quantity INTEGER NOT NULL DEFAULT 1,
        selected_variant JSONB,
        price_at_addition DECIMAL(10, 2) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_cart_user ON cart_items(user_id);
    `);

        // Wishlist
        await pool.query(`
      CREATE TABLE IF NOT EXISTS wishlist_items (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        product_id UUID REFERENCES products(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(user_id, product_id)
      );
      CREATE INDEX IF NOT EXISTS idx_wishlist_user ON wishlist_items(user_id);
    `);

        // Reviews
        await pool.query(`
      CREATE TABLE IF NOT EXISTS reviews (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
        product_id UUID REFERENCES products(id) ON DELETE CASCADE,
        order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
        rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
        title VARCHAR(200),
        comment TEXT,
        images TEXT[],
        helpful_count INTEGER DEFAULT 0,
        unhelpful_count INTEGER DEFAULT 0,
        is_verified_purchase BOOLEAN DEFAULT false,
        is_approved BOOLEAN DEFAULT true,
        is_flagged BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_reviews_product ON reviews(product_id);
    `);

        console.log('✅ Dependent tables created\n');

        console.log('🎉 Products table recreation complete!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Failed:', error);
        process.exit(1);
    }
}

recreateProductsTable();
