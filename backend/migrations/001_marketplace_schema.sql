-- Database Migration: Comprehensive Marketplace Schema
-- Run this after connecting to your PostgreSQL database

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. TOWNS TABLE
-- ============================================
CREATE TABLE towns (
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

CREATE INDEX idx_towns_state ON towns(state);
CREATE INDEX idx_towns_pincode ON towns(pincode);
CREATE INDEX idx_towns_location ON towns(latitude, longitude);

-- ============================================
-- 2. CATEGORIES TABLE
-- ============================================
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL UNIQUE,
  slug VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  icon VARCHAR(50), -- ionicon name
  image_url TEXT,
  color VARCHAR(20), -- hex color for UI
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_categories_slug ON categories(slug);
CREATE INDEX idx_categories_active ON categories(is_active);

-- ============================================
-- 3. SHOPS TABLE (Enhanced)
-- ============================================
CREATE TABLE shops (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  slug VARCHAR(200) UNIQUE,
  description TEXT,
  town_id UUID REFERENCES towns(id) ON DELETE SET NULL,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  
  -- Contact & Location
  phone VARCHAR(20),
  email VARCHAR(100),
  address_line1 TEXT NOT NULL,
  address_line2 TEXT,
  pincode VARCHAR(10),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  
  -- Media
  logo_url TEXT,
  cover_image_url TEXT,
  images TEXT[], -- array of additional shop images
  
  -- Business Details
  gst_number VARCHAR(50),
  pan_number VARCHAR(20),
  business_type VARCHAR(50), -- sole_proprietor, partnership, pvt_ltd, etc.
  
  -- Operational
  is_open BOOLEAN DEFAULT true,
  opening_hours JSONB, -- {mon: {open: "09:00", close: "21:00"}, ...}
  delivery_available BOOLEAN DEFAULT true,
  delivery_radius_km DECIMAL(5, 2) DEFAULT 5.0,
  min_order_amount DECIMAL(10, 2) DEFAULT 0,
  delivery_charge DECIMAL(10, 2) DEFAULT 0,
  
  -- Stats
  rating DECIMAL(3, 2) DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,
  total_orders INTEGER DEFAULT 0,
  
  -- Status
  is_approved BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  verified BOOLEAN DEFAULT false,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_shops_owner ON shops(owner_id);
CREATE INDEX idx_shops_town ON shops(town_id);
CREATE INDEX idx_shops_category ON shops(category_id);
CREATE INDEX idx_shops_slug ON shops(slug);
CREATE INDEX idx_shops_location ON shops(latitude, longitude);
CREATE INDEX idx_shops_approved ON shops(is_approved, is_active);

-- ============================================
-- 4. PRODUCTS TABLE (Comprehensive)
-- ============================================
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
  original_price DECIMAL(10, 2), -- for showing discounts
  discount_percentage INTEGER DEFAULT 0,
  
  -- Inventory
  sku VARCHAR(100),
  stock_quantity INTEGER DEFAULT 0,
  low_stock_threshold INTEGER DEFAULT 5,
  track_inventory BOOLEAN DEFAULT true,
  
  -- Media
  images TEXT[] NOT NULL DEFAULT '{}', -- 4-5 images
  thumbnail_url TEXT,
  video_url TEXT,
  
  -- Variants (size, color, etc.)
  has_variants BOOLEAN DEFAULT false,
  variants JSONB, -- [{type: "size", options: [{value: "S", price_modifier: 0, stock: 10}, ...]}, ...]
  
  -- Product Details
  brand VARCHAR(100),
  manufacturer VARCHAR(100),
  weight DECIMAL(10, 3), -- in kg
  dimensions JSONB, -- {length: 10, width: 5, height: 3, unit: "cm"}
  
  -- SEO & Tags
  tags TEXT[], -- searchable tags
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
CREATE INDEX idx_products_slug ON products(slug);
CREATE INDEX idx_products_available ON products(is_available);
CREATE INDEX idx_products_featured ON products(is_featured);
CREATE INDEX idx_products_price ON products(price);
CREATE INDEX idx_products_rating ON products(rating);

-- Full-text search index for products
CREATE INDEX idx_products_search ON products USING gin(to_tsvector('english', name || ' ' || COALESCE(description, '')));

-- ============================================
-- 5. ADDRESSES TABLE
-- ============================================
CREATE TABLE addresses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  -- Address Details
  label VARCHAR(50), -- Home, Work, Other
  full_name VARCHAR(200) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  address_line1 TEXT NOT NULL,
  address_line2 TEXT,
  landmark TEXT,
  town_id UUID REFERENCES towns(id),
  city VARCHAR(100),
  state VARCHAR(100),
  pincode VARCHAR(10) NOT NULL,
  
  -- Location
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  
  -- Metadata
  is_default BOOLEAN DEFAULT false,
  address_type VARCHAR(20) DEFAULT 'home', -- home, work, other
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_addresses_user ON addresses(user_id);
CREATE INDEX idx_addresses_town ON addresses(town_id);
CREATE INDEX idx_addresses_default ON addresses(user_id, is_default);

-- ============================================
-- 6. ORDERS TABLE (Detailed)
-- ============================================
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number VARCHAR(50) UNIQUE NOT NULL, -- e.g., ORD-2024-001234
  
  -- Parties
  customer_id UUID REFERENCES users(id) ON DELETE SET NULL,
  shop_id UUID REFERENCES shops(id) ON DELETE SET NULL,
  
  -- Order Details
  items JSONB NOT NULL, -- [{product_id, name, price, quantity, variant, image}, ...]
  
  -- Pricing
  subtotal DECIMAL(10, 2) NOT NULL,
  delivery_charge DECIMAL(10, 2) DEFAULT 0,
  discount_amount DECIMAL(10, 2) DEFAULT 0,
  tax_amount DECIMAL(10, 2) DEFAULT 0,
  total_amount DECIMAL(10, 2) NOT NULL,
  
  -- Delivery
  delivery_address JSONB NOT NULL,
  delivery_instructions TEXT,
  estimated_delivery_time TIMESTAMP,
  actual_delivery_time TIMESTAMP,
  
  -- Payment
  payment_method VARCHAR(50) NOT NULL, -- cod, razorpay, etc.
  payment_status VARCHAR(50) DEFAULT 'pending', -- pending, paid, failed, refunded
  payment_id VARCHAR(100), -- razorpay payment id
  payment_details JSONB,
  
  -- Order Status
  status VARCHAR(50) DEFAULT 'placed', -- placed, confirmed, preparing, out_for_delivery, delivered, cancelled
  status_history JSONB, -- [{status: "placed", timestamp: "...", note: "..."}, ...]
  
  -- Cancellation
  cancelled_by VARCHAR(50), -- customer, shop, admin
  cancellation_reason TEXT,
  cancelled_at TIMESTAMP,
  
  -- Notes
  customer_notes TEXT,
  shop_notes TEXT,
  admin_notes TEXT,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_orders_customer ON orders(customer_id);
CREATE INDEX idx_orders_shop ON orders(shop_id);
CREATE INDEX idx_orders_number ON orders(order_number);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_payment_status ON orders(payment_status);
CREATE INDEX idx_orders_created ON orders(created_at DESC);

-- ============================================
-- 7. REVIEWS TABLE
-- ============================================
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  
  -- Review Content
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title VARCHAR(200),
  comment TEXT,
  images TEXT[], -- review images
  
  -- Helpful votes
  helpful_count INTEGER DEFAULT 0,
  unhelpful_count INTEGER DEFAULT 0,
  
  -- Verification
  is_verified_purchase BOOLEAN DEFAULT false,
  
  -- Moderation
  is_approved BOOLEAN DEFAULT true,
  is_flagged BOOLEAN DEFAULT false,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_reviews_user ON reviews(user_id);
CREATE INDEX idx_reviews_shop ON reviews(shop_id);
CREATE INDEX idx_reviews_product ON reviews(product_id);
CREATE INDEX idx_reviews_order ON reviews(order_id);
CREATE INDEX idx_reviews_rating ON reviews(rating);

-- ============================================
-- 8. CART TABLE (for persistence)
-- ============================================
CREATE TABLE cart_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
  
  quantity INTEGER NOT NULL DEFAULT 1,
  selected_variant JSONB, -- {size: "M", color: "Red"}
  price_at_addition DECIMAL(10, 2) NOT NULL,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(user_id, product_id, selected_variant)
);

CREATE INDEX idx_cart_user ON cart_items(user_id);
CREATE INDEX idx_cart_product ON cart_items(product_id);

-- ============================================
-- 9. NOTIFICATIONS TABLE (for real-time)
-- ============================================
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  type VARCHAR(50) NOT NULL, -- order_update, new_product, promotion, etc.
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  data JSONB, -- additional data like order_id, product_id, etc.
  
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(user_id, is_read);
CREATE INDEX idx_notifications_created ON notifications(created_at DESC);

-- ============================================
-- 10. WISHLIST TABLE
-- ============================================
CREATE TABLE wishlist_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  
  created_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(user_id, product_id)
);

CREATE INDEX idx_wishlist_user ON wishlist_items(user_id);
CREATE INDEX idx_wishlist_product ON wishlist_items(product_id);

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

CREATE TRIGGER update_towns_updated_at BEFORE UPDATE ON towns FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_shops_updated_at BEFORE UPDATE ON shops FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_addresses_updated_at BEFORE UPDATE ON addresses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON reviews FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_cart_items_updated_at BEFORE UPDATE ON cart_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- VIEWS FOR COMMON QUERIES
-- ============================================

-- Active shops with owner details
CREATE VIEW active_shops_view AS
SELECT 
  s.*,
  u.name as owner_name,
  u.email as owner_email,
  t.name as town_name,
  c.name as category_name
FROM shops s
LEFT JOIN users u ON s.owner_id = u.id
LEFT JOIN towns t ON s.town_id = t.id
LEFT JOIN categories c ON s.category_id = c.id
WHERE s.is_active = true AND s.is_approved = true;

-- Products with shop and category details
CREATE VIEW products_view AS
SELECT 
  p.*,
  s.name as shop_name,
  s.town_id,
  c.name as category_name
FROM products p
LEFT JOIN shops s ON p.shop_id = s.id
LEFT JOIN categories c ON p.category_id = c.id
WHERE p.is_available = true;

COMMENT ON TABLE towns IS 'Stores town/city information for location-based filtering';
COMMENT ON TABLE categories IS 'Product and shop categories';
COMMENT ON TABLE shops IS 'Shop/store information owned by vendors';
COMMENT ON TABLE products IS 'Products listed by shops';
COMMENT ON TABLE addresses IS 'Customer delivery addresses';
COMMENT ON TABLE orders IS 'Customer orders with full details';
COMMENT ON TABLE reviews IS 'Product and shop reviews';
COMMENT ON TABLE cart_items IS 'Persistent shopping cart';
COMMENT ON TABLE notifications IS 'User notifications for real-time updates';
COMMENT ON TABLE wishlist_items IS 'User wishlist/favorites';
