-- Migration: Extend Existing Tables for Shop Owner Portal
-- Week 1, Day 1: Database Setup (Revised to work with existing schema)

-- ============================================
-- 1. COMMISSION TIERS TABLE (New)
-- ============================================
CREATE TABLE IF NOT EXISTS commission_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  min_price DECIMAL(10,2) NOT NULL,
  max_price DECIMAL(10,2),
  commission_percentage DECIMAL(5,2) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Insert default commission structure
INSERT INTO commission_tiers (min_price, max_price, commission_percentage) VALUES
  (0, 500, 5.00),      -- 5% for products ≤ ₹500
  (501, 5000, 2.00),   -- 2% for products ₹501-5000
  (5001, NULL, 2.00)   -- 2% for products > ₹5000
ON CONFLICT DO NOTHING;

-- ============================================
-- 2. EXTEND CATEGORIES TABLE (Add restrictions)
-- ============================================
ALTER TABLE categories ADD COLUMN IF NOT EXISTS is_restricted BOOLEAN DEFAULT false;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS restriction_reason TEXT;

-- Update existing categories to be non-restricted
UPDATE categories SET is_restricted = false WHERE is_restricted IS NULL;

-- Insert restricted categories
INSERT INTO categories (name, slug, is_restricted, restriction_reason, is_active) VALUES
  ('Alcohol & Liquor', 'alcohol', true, 'Requires special license', false),
  ('Tobacco Products', 'tobacco', true, 'Prohibited for online sale', false),
  ('Weapons & Ammunition', 'weapons', true, 'Illegal to sell online', false),
  ('Prescription Drugs', 'prescription-drugs', true, 'Requires pharmacy license', false),
  ('Adult Content', 'adult', true, 'Not permitted', false),
  ('Counterfeit Goods', 'counterfeit', true, 'Illegal', false),
  ('Live Animals', 'live-animals', true, 'Not permitted', false)
ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- 3. EXTEND SHOPS TABLE (Add shop owner fields)
-- ============================================
-- Add fields for shop owner management
ALTER TABLE shops ADD COLUMN IF NOT EXISTS whatsapp_number VARCHAR(15);
ALTER TABLE shops ADD COLUMN IF NOT EXISTS weekly_off VARCHAR(50)[];
ALTER TABLE shops ADD COLUMN IF NOT EXISTS fssai_number VARCHAR(14);
ALTER TABLE shops ADD COLUMN IF NOT EXISTS shop_license_number VARCHAR(50);
ALTER TABLE shops ADD COLUMN IF NOT EXISTS bank_account_number VARCHAR(20);
ALTER TABLE shops ADD COLUMN IF NOT EXISTS ifsc_code VARCHAR(11);
ALTER TABLE shops ADD COLUMN IF NOT EXISTS account_holder_name VARCHAR(100);

-- Rename/add verification fields
ALTER TABLE shops ADD COLUMN IF NOT EXISTS verification_status VARCHAR(20) DEFAULT 'pending';
ALTER TABLE shops ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP;

-- Add document URLs
ALTER TABLE shops ADD COLUMN IF NOT EXISTS gst_document_url TEXT;
ALTER TABLE shops ADD COLUMN IF NOT EXISTS pan_document_url TEXT;
ALTER TABLE shops ADD COLUMN IF NOT EXISTS aadhaar_document_url TEXT;
ALTER TABLE shops ADD COLUMN IF NOT EXISTS shop_license_url TEXT;
ALTER TABLE shops ADD COLUMN IF NOT EXISTS fssai_document_url TEXT;
ALTER TABLE shops ADD COLUMN IF NOT EXISTS cancelled_cheque_url TEXT;

-- Update verification_status for existing shops
UPDATE shops SET verification_status = 
  CASE 
    WHEN is_approved = true THEN 'approved'
    WHEN is_approved = false AND verified = false THEN 'pending'
    ELSE 'pending'
  END
WHERE verification_status IS NULL;

-- ============================================
-- 4. EXTEND PRODUCTS TABLE (Add commission fields)
-- ============================================
ALTER TABLE products ADD COLUMN IF NOT EXISTS shop_price DECIMAL(10,2);
ALTER TABLE products ADD COLUMN IF NOT EXISTS customer_price DECIMAL(10,2);
ALTER TABLE products ADD COLUMN IF NOT EXISTS commission_amount DECIMAL(10,2);
ALTER TABLE products ADD COLUMN IF NOT EXISTS unit VARCHAR(50);
ALTER TABLE products ADD COLUMN IF NOT EXISTS hsn_code VARCHAR(8);
ALTER TABLE products ADD COLUMN IF NOT EXISTS expiry_date DATE;

-- Migrate existing data: price becomes shop_price
UPDATE products 
SET 
  shop_price = price,
  customer_price = price, -- Will be recalculated
  commission_amount = 0,
  unit = 'piece'
WHERE shop_price IS NULL;

-- ============================================
-- 5. PRODUCT UPLOAD HISTORY TABLE (New)
-- ============================================
CREATE TABLE IF NOT EXISTS product_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_name VARCHAR(200),
  total_rows INTEGER,
  successful_rows INTEGER,
  failed_rows INTEGER,
  error_log JSONB,
  status VARCHAR(20) DEFAULT 'processing',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_uploads_shop ON product_uploads(shop_id);

-- ============================================
-- 6. STOCK HISTORY TABLE (New)
-- ============================================
CREATE TABLE IF NOT EXISTS stock_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  previous_stock INTEGER,
  new_stock INTEGER,
  change_amount INTEGER,
  change_reason VARCHAR(100),
  order_id UUID REFERENCES orders(id),
  changed_by UUID REFERENCES users(id),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stock_history_product ON stock_history(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_history_date ON stock_history(created_at);

-- ============================================
-- 7. DELIVERY SETTINGS TABLE (New)
-- ============================================
CREATE TABLE IF NOT EXISTS delivery_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_type VARCHAR(50) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  configuration JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

INSERT INTO delivery_settings (delivery_type, is_active, configuration) VALUES
  ('shop_owner', true, '{"description": "Shop owner handles delivery"}')
ON CONFLICT DO NOTHING;

-- ============================================
-- 8. EXTEND ORDERS TABLE (Add commission tracking)
-- ============================================
ALTER TABLE orders ADD COLUMN IF NOT EXISTS commission_amount DECIMAL(10,2) DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shop_earnings DECIMAL(10,2) DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS platform_earnings DECIMAL(10,2) DEFAULT 0;

-- ============================================
-- 9. PAYMENT SETTLEMENTS TABLE (New)
-- ============================================
CREATE TABLE IF NOT EXISTS payment_settlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
  
  -- Settlement Details
  settlement_amount DECIMAL(10,2) NOT NULL,
  order_count INTEGER NOT NULL,
  order_ids UUID[],
  
  -- Period
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  
  -- Payment Details
  payment_method VARCHAR(50),
  transaction_id VARCHAR(100),
  razorpay_payout_id VARCHAR(100),
  
  -- Status
  status VARCHAR(20) DEFAULT 'pending',
  processed_at TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_settlements_shop ON payment_settlements(shop_id);
CREATE INDEX IF NOT EXISTS idx_settlements_status ON payment_settlements(status);

-- ============================================
-- 10. CREATE TRIGGERS FOR NEW TABLES
-- ============================================
CREATE TRIGGER update_commission_tiers_updated_at BEFORE UPDATE ON commission_tiers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_delivery_settings_updated_at BEFORE UPDATE ON delivery_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payment_settlements_updated_at BEFORE UPDATE ON payment_settlements
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 11. HELPER FUNCTIONS
-- ============================================

-- Function to calculate commission based on price
CREATE OR REPLACE FUNCTION calculate_commission(product_price DECIMAL)
RETURNS DECIMAL AS $$
DECLARE
  commission_rate DECIMAL;
  commission DECIMAL;
BEGIN
  SELECT commission_percentage INTO commission_rate
  FROM commission_tiers
  WHERE is_active = true
    AND product_price >= min_price
    AND (max_price IS NULL OR product_price <= max_price)
  ORDER BY min_price DESC
  LIMIT 1;
  
  IF commission_rate IS NULL THEN
    commission_rate := 2.00; -- Default 2%
  END IF;
  
  commission := ROUND((product_price * commission_rate / 100), 2);
  RETURN commission;
END;
$$ LANGUAGE plpgsql;

-- Function to update product prices with commission
CREATE OR REPLACE FUNCTION update_product_commission()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.shop_price IS NOT NULL THEN
    NEW.commission_amount := calculate_commission(NEW.shop_price);
    NEW.customer_price := NEW.shop_price + NEW.commission_amount;
    NEW.price := NEW.customer_price; -- Keep price in sync
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-calculate commission on product insert/update
CREATE TRIGGER calculate_product_commission
  BEFORE INSERT OR UPDATE OF shop_price ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_product_commission();

-- ============================================
-- 12. UPDATE EXISTING PRODUCTS WITH COMMISSION
-- ============================================
-- Recalculate commission for all existing products
UPDATE products
SET 
  commission_amount = calculate_commission(shop_price),
  customer_price = shop_price + calculate_commission(shop_price),
  price = shop_price + calculate_commission(shop_price)
WHERE shop_price IS NOT NULL;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Shop Owner database schema extended successfully!';
    RAISE NOTICE 'Tables extended: shops, products, categories, orders';
    RAISE NOTICE 'New tables created: commission_tiers, product_uploads, stock_history, delivery_settings, payment_settlements';
    RAISE NOTICE 'Helper functions created: calculate_commission(), update_product_commission()';
END $$;
