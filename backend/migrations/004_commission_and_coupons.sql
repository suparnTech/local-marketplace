-- Database schema additions for commission, coupons, and order management
-- Run this to add new tables

-- Platform commission settings
CREATE TABLE IF NOT EXISTS platform_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  commission_percentage DECIMAL(5,2) DEFAULT 4.00,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Insert default commission
INSERT INTO platform_settings (commission_percentage) 
VALUES (4.00) 
ON CONFLICT DO NOTHING;

-- Coupons table (admin managed)
CREATE TABLE IF NOT EXISTS coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  discount_type VARCHAR(20) NOT NULL, -- 'percentage' or 'fixed'
  discount_value DECIMAL(10,2) NOT NULL,
  min_order_amount DECIMAL(10,2) DEFAULT 0,
  max_discount_amount DECIMAL(10,2),
  usage_limit INTEGER,
  used_count INTEGER DEFAULT 0,
  valid_from TIMESTAMP DEFAULT NOW(),
  valid_until TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Order commission tracking
CREATE TABLE IF NOT EXISTS order_commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id),
  shop_id UUID REFERENCES shops(id),
  order_amount DECIMAL(10,2) NOT NULL,
  commission_percentage DECIMAL(5,2) NOT NULL,
  commission_amount DECIMAL(10,2) NOT NULL,
  shop_payout DECIMAL(10,2) NOT NULL,
  platform_earnings DECIMAL(10,2) NOT NULL,
  payout_status VARCHAR(20) DEFAULT 'pending', -- pending, processing, completed
  created_at TIMESTAMP DEFAULT NOW()
);

-- Update orders table to include commission fields
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS coupon_code VARCHAR(50),
ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS commission_amount DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS platform_fee DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS shop_payout DECIMAL(10,2) DEFAULT 0;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code);
CREATE INDEX IF NOT EXISTS idx_coupons_active ON coupons(is_active, valid_from, valid_until);
CREATE INDEX IF NOT EXISTS idx_order_commissions_order ON order_commissions(order_id);
CREATE INDEX IF NOT EXISTS idx_order_commissions_shop ON order_commissions(shop_id);
CREATE INDEX IF NOT EXISTS idx_orders_coupon ON orders(coupon_code);
