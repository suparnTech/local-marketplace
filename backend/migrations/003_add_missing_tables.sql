-- Migration: Add missing tables (avoiding conflicts with existing tables)
-- This adds only the tables that don't exist yet

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. TOWNS TABLE (NEW)
-- ============================================
CREATE TABLE IF NOT EXISTS towns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(200) NOT NULL,
  state VARCHAR(100) NOT NULL,
  district VARCHAR(100),
  pincode VARCHAR(10),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  population INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_towns_state ON towns(state);
CREATE INDEX IF NOT EXISTS idx_towns_pincode ON towns(pincode);
CREATE INDEX IF NOT EXISTS idx_towns_location ON towns(latitude, longitude);

-- ============================================
-- 2. CATEGORIES TABLE (NEW)
-- ============================================
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL UNIQUE,
  slug VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  icon VARCHAR(50),
  image_url TEXT,
  color VARCHAR(20),
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
CREATE INDEX IF NOT EXISTS idx_categories_active ON categories(is_active);

-- ============================================
-- 3. SHOPS TABLE (NEW - enhanced version of stores)
-- ============================================
CREATE TABLE IF NOT EXISTS shops (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  slug VARCHAR(200) UNIQUE,
  description TEXT,
  town_id UUID REFERENCES towns(id) ON DELETE SET NULL,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  
  phone VARCHAR(20),
  email VARCHAR(100),
  address_line1 TEXT NOT NULL,
  address_line2 TEXT,
  pincode VARCHAR(10),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  
  logo_url TEXT,
  cover_image_url TEXT,
  images TEXT[],
  
  gst_number VARCHAR(50),
  pan_number VARCHAR(20),
  business_type VARCHAR(50),
  
  is_open BOOLEAN DEFAULT true,
  opening_hours JSONB,
  delivery_available BOOLEAN DEFAULT true,
  delivery_radius_km DECIMAL(5, 2) DEFAULT 5.0,
  min_order_amount DECIMAL(10, 2) DEFAULT 0,
  delivery_charge DECIMAL(10, 2) DEFAULT 0,
  
  rating DECIMAL(3, 2) DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,
  total_orders INTEGER DEFAULT 0,
  
  is_approved BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  verified BOOLEAN DEFAULT false,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shops_owner ON shops(owner_id);
CREATE INDEX IF NOT EXISTS idx_shops_town ON shops(town_id);
CREATE INDEX IF NOT EXISTS idx_shops_category ON shops(category_id);
CREATE INDEX IF NOT EXISTS idx_shops_slug ON shops(slug);

-- ============================================
-- 4. ADDRESSES TABLE (NEW)
-- ============================================
CREATE TABLE IF NOT EXISTS addresses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  label VARCHAR(50),
  full_name VARCHAR(200) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  address_line1 TEXT NOT NULL,
  address_line2 TEXT,
  landmark TEXT,
  town_id UUID REFERENCES towns(id),
  city VARCHAR(100),
  state VARCHAR(100),
  pincode VARCHAR(10) NOT NULL,
  
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  
  is_default BOOLEAN DEFAULT false,
  address_type VARCHAR(20) DEFAULT 'home',
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_addresses_user ON addresses(user_id);
CREATE INDEX IF NOT EXISTS idx_addresses_town ON addresses(town_id);

-- ============================================
-- 5. CART TABLE (NEW)
-- ============================================
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
CREATE INDEX IF NOT EXISTS idx_cart_product ON cart_items(product_id);

-- ============================================
-- 6. NOTIFICATIONS TABLE (avoid conflict)
-- ============================================
CREATE TABLE IF NOT EXISTS user_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  type VARCHAR(50) NOT NULL,
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  data JSONB,
  
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_notifications_user ON user_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_user_notifications_read ON user_notifications(user_id, is_read);

-- ============================================
-- 7. WISHLIST TABLE (NEW)
-- ============================================
CREATE TABLE IF NOT EXISTS wishlist_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  
  created_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(user_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_wishlist_user ON wishlist_items(user_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_product ON wishlist_items(product_id);

-- ============================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_towns_updated_at ON towns;
CREATE TRIGGER update_towns_updated_at BEFORE UPDATE ON towns FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_categories_updated_at ON categories;
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_shops_updated_at ON shops;
CREATE TRIGGER update_shops_updated_at BEFORE UPDATE ON shops FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_addresses_updated_at ON addresses;
CREATE TRIGGER update_addresses_updated_at BEFORE UPDATE ON addresses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_cart_items_updated_at ON cart_items;
CREATE TRIGGER update_cart_items_updated_at BEFORE UPDATE ON cart_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE towns IS 'Towns/cities for location-based filtering';
COMMENT ON TABLE categories IS 'Product and shop categories';
COMMENT ON TABLE shops IS 'Enhanced shop information (replaces stores)';
COMMENT ON TABLE addresses IS 'Customer delivery addresses';
COMMENT ON TABLE cart_items IS 'Persistent shopping cart';
COMMENT ON TABLE user_notifications IS 'User notifications for real-time updates';
COMMENT ON TABLE wishlist_items IS 'User wishlist/favorites';
