-- ============================================
-- DELIVERY PARTNER SYSTEM MIGRATION
-- ============================================
-- This migration creates all tables needed for the delivery partner system
-- Run after existing migrations

-- ============================================
-- 1. DELIVERY PARTNERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS delivery_partners (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  
  -- Personal Info
  full_name VARCHAR(200) NOT NULL,
  phone VARCHAR(20) NOT NULL UNIQUE,
  email VARCHAR(100),
  date_of_birth DATE,
  profile_photo_url TEXT,
  
  -- Address
  address_line1 TEXT NOT NULL,
  address_line2 TEXT,
  city VARCHAR(100) NOT NULL,
  state VARCHAR(100) NOT NULL,
  pincode VARCHAR(10) NOT NULL,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  
  -- KYC Documents (Mandatory: Aadhaar + Driving License)
  aadhaar_number VARCHAR(12) NOT NULL UNIQUE,
  aadhaar_front_url TEXT NOT NULL,
  aadhaar_back_url TEXT NOT NULL,
  pan_number VARCHAR(10),
  pan_card_url TEXT,
  driving_license_number VARCHAR(20) NOT NULL,
  driving_license_url TEXT NOT NULL,
  
  -- Vehicle Details
  vehicle_type VARCHAR(50), -- bike, scooter, bicycle, car
  vehicle_number VARCHAR(20),
  vehicle_rc_url TEXT,
  vehicle_insurance_url TEXT,
  
  -- Bank Details
  bank_account_number VARCHAR(20),
  ifsc_code VARCHAR(11),
  account_holder_name VARCHAR(200),
  upi_id VARCHAR(100),
  
  -- Verification Status
  verification_status VARCHAR(20) DEFAULT 'pending', -- pending, approved, rejected
  verified_by UUID REFERENCES users(id),
  verified_at TIMESTAMP,
  rejection_reason TEXT,
  
  -- Operational
  is_active BOOLEAN DEFAULT false, -- can accept deliveries
  is_available BOOLEAN DEFAULT false, -- currently available
  current_location JSONB, -- {lat, lng, updated_at}
  service_area_pincodes TEXT[], -- areas they can deliver to
  max_delivery_radius_km DECIMAL(5, 2) DEFAULT 10.0,
  
  -- Stats
  total_deliveries INTEGER DEFAULT 0,
  successful_deliveries INTEGER DEFAULT 0,
  cancelled_deliveries INTEGER DEFAULT 0,
  rating DECIMAL(3, 2) DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,
  total_earnings DECIMAL(10, 2) DEFAULT 0,
  
  -- Status
  is_online BOOLEAN DEFAULT false,
  last_online_at TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_delivery_partners_user ON delivery_partners(user_id);
CREATE INDEX IF NOT EXISTS idx_delivery_partners_phone ON delivery_partners(phone);
CREATE INDEX IF NOT EXISTS idx_delivery_partners_status ON delivery_partners(verification_status);
CREATE INDEX IF NOT EXISTS idx_delivery_partners_available ON delivery_partners(is_available, is_online);
CREATE INDEX IF NOT EXISTS idx_delivery_partners_location ON delivery_partners(latitude, longitude);

-- ============================================
-- 2. DELIVERY ASSIGNMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS delivery_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE UNIQUE,
  
  -- Assignment Details
  assigned_to UUID REFERENCES delivery_partners(id) ON DELETE SET NULL,
  assigned_by VARCHAR(50), -- 'shop', 'platform', 'auto'
  assignment_type VARCHAR(50) NOT NULL, -- 'shop_partner', 'platform_partner'
  
  -- Locations & Route
  pickup_location JSONB NOT NULL, -- {lat, lng, address, shop_name, phone}
  delivery_location JSONB NOT NULL, -- {lat, lng, address, customer_name, phone}
  distance_km DECIMAL(5, 2),
  estimated_time_minutes INTEGER,
  actual_route JSONB, -- [{lat, lng, timestamp}] - tracking points
  
  -- Status Tracking
  status VARCHAR(50) DEFAULT 'pending', 
  -- pending, accepted, on_way_to_pickup, reached_shop, picked_up, on_way_to_delivery, reached_customer, delivered, cancelled
  status_history JSONB, -- [{status, timestamp, location: {lat, lng}, note}]
  
  -- Timing
  requested_at TIMESTAMP DEFAULT NOW(),
  accepted_at TIMESTAMP,
  reached_shop_at TIMESTAMP,
  picked_up_at TIMESTAMP,
  on_way_at TIMESTAMP,
  reached_customer_at TIMESTAMP,
  delivered_at TIMESTAMP,
  cancelled_at TIMESTAMP,
  
  -- Earnings Breakdown
  delivery_fee DECIMAL(10, 2) NOT NULL, -- Total delivery fee (e.g., ₹40)
  partner_earnings DECIMAL(10, 2), -- Partner gets 90% (e.g., ₹36)
  platform_commission DECIMAL(10, 2), -- Platform gets 10% (e.g., ₹4)
  
  -- Safety & Verification
  pickup_otp VARCHAR(6), -- Shop verifies partner picked up
  delivery_otp VARCHAR(6), -- Customer verifies delivery
  pickup_photo_url TEXT, -- Partner takes photo at pickup
  delivery_photo_url TEXT, -- Partner takes photo at delivery
  
  -- Cancellation
  cancelled_by VARCHAR(50), -- 'partner', 'shop', 'customer', 'admin'
  cancellation_reason TEXT,
  
  -- Notes
  pickup_instructions TEXT,
  delivery_instructions TEXT,
  partner_notes TEXT,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_delivery_assignments_order ON delivery_assignments(order_id);
CREATE INDEX IF NOT EXISTS idx_delivery_assignments_partner ON delivery_assignments(assigned_to);
CREATE INDEX IF NOT EXISTS idx_delivery_assignments_status ON delivery_assignments(status);
CREATE INDEX IF NOT EXISTS idx_delivery_assignments_type ON delivery_assignments(assignment_type);

-- ============================================
-- 3. DELIVERY REQUESTS TABLE (Real-time matching)
-- ============================================
CREATE TABLE IF NOT EXISTS delivery_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
  
  -- Request Details
  pickup_location JSONB NOT NULL,
  delivery_location JSONB NOT NULL,
  distance_km DECIMAL(5, 2),
  delivery_fee DECIMAL(10, 2) NOT NULL,
  partner_earnings DECIMAL(10, 2) NOT NULL, -- What partner will get
  
  -- Matching
  requested_partners UUID[], -- partners who were notified
  declined_by UUID[], -- partners who declined
  
  -- Status
  status VARCHAR(50) DEFAULT 'searching', -- searching, matched, expired, cancelled
  expires_at TIMESTAMP, -- auto-expire after 10 minutes
  matched_partner_id UUID REFERENCES delivery_partners(id),
  matched_at TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_delivery_requests_order ON delivery_requests(order_id);
CREATE INDEX IF NOT EXISTS idx_delivery_requests_status ON delivery_requests(status);
CREATE INDEX IF NOT EXISTS idx_delivery_requests_shop ON delivery_requests(shop_id);

-- ============================================
-- 4. FEEDBACK & COMPLAINTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS feedback_complaints (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Reporter
  reporter_id UUID REFERENCES users(id) ON DELETE CASCADE,
  reporter_role VARCHAR(50) NOT NULL, -- 'customer', 'shop_owner', 'delivery_partner'
  
  -- Subject (who/what is being reported)
  subject_id UUID REFERENCES users(id) ON DELETE CASCADE,
  subject_role VARCHAR(50) NOT NULL, -- 'customer', 'shop_owner', 'delivery_partner', 'shop'
  
  -- Related Entities
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  delivery_assignment_id UUID REFERENCES delivery_assignments(id) ON DELETE SET NULL,
  
  -- Feedback Details
  type VARCHAR(50) NOT NULL, -- 'feedback', 'complaint', 'appreciation'
  category VARCHAR(100), -- 'rude_behavior', 'late_delivery', 'damaged_goods', 'excellent_service', etc.
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  title VARCHAR(200),
  description TEXT NOT NULL,
  evidence_urls TEXT[], -- photos/videos
  
  -- Resolution
  status VARCHAR(50) DEFAULT 'pending', -- pending, under_review, resolved, dismissed
  admin_notes TEXT,
  resolution TEXT,
  resolved_by UUID REFERENCES users(id),
  resolved_at TIMESTAMP,
  
  -- Priority
  priority VARCHAR(20) DEFAULT 'normal', -- low, normal, high, urgent
  is_flagged BOOLEAN DEFAULT false,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_feedback_reporter ON feedback_complaints(reporter_id);
CREATE INDEX IF NOT EXISTS idx_feedback_subject ON feedback_complaints(subject_id);
CREATE INDEX IF NOT EXISTS idx_feedback_order ON feedback_complaints(order_id);
CREATE INDEX IF NOT EXISTS idx_feedback_status ON feedback_complaints(status);
CREATE INDEX IF NOT EXISTS idx_feedback_type ON feedback_complaints(type);

-- ============================================
-- 5. PARTNER DAILY SETTLEMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS partner_daily_settlements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  partner_id UUID REFERENCES delivery_partners(id) ON DELETE CASCADE,
  settlement_date DATE NOT NULL,
  
  -- Earnings Summary
  total_deliveries INTEGER DEFAULT 0,
  total_earnings DECIMAL(10, 2) DEFAULT 0,
  bonus DECIMAL(10, 2) DEFAULT 0, -- incentives
  deductions DECIMAL(10, 2) DEFAULT 0, -- penalties
  net_amount DECIMAL(10, 2) NOT NULL,
  
  -- Payment
  payment_status VARCHAR(50) DEFAULT 'pending', -- pending, processing, paid, failed
  payment_method VARCHAR(50), -- upi, bank_transfer
  payment_reference VARCHAR(100),
  paid_at TIMESTAMP,
  
  -- Delivery IDs
  delivery_assignment_ids UUID[], -- all deliveries for the day
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(partner_id, settlement_date)
);

CREATE INDEX IF NOT EXISTS idx_settlements_partner ON partner_daily_settlements(partner_id);
CREATE INDEX IF NOT EXISTS idx_settlements_date ON partner_daily_settlements(settlement_date);
CREATE INDEX IF NOT EXISTS idx_settlements_status ON partner_daily_settlements(payment_status);

-- ============================================
-- 6. PLATFORM EARNINGS TABLE (GST tracking)
-- ============================================
CREATE TABLE IF NOT EXISTS platform_earnings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  
  -- Earnings Breakdown
  product_commission DECIMAL(10, 2) DEFAULT 0, -- 5% of product price
  delivery_commission DECIMAL(10, 2) DEFAULT 0, -- 10% of delivery fee
  total_commission DECIMAL(10, 2) NOT NULL, -- product + delivery commission
  
  -- GST
  gst_rate DECIMAL(5, 4) DEFAULT 0.18, -- 18%
  gst_amount DECIMAL(10, 2) NOT NULL, -- GST on total commission
  net_earnings DECIMAL(10, 2) NOT NULL, -- total_commission - gst_amount
  
  -- Metadata
  earned_date DATE NOT NULL,
  financial_year VARCHAR(10), -- 2024-25
  quarter VARCHAR(10), -- Q3
  
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_platform_earnings_order ON platform_earnings(order_id);
CREATE INDEX IF NOT EXISTS idx_platform_earnings_date ON platform_earnings(earned_date);

-- ============================================
-- 7. UPDATE ORDERS TABLE
-- ============================================
ALTER TABLE orders 
  ADD COLUMN IF NOT EXISTS delivery_partner_id UUID REFERENCES delivery_partners(id),
  ADD COLUMN IF NOT EXISTS delivery_type VARCHAR(50) DEFAULT 'shop_delivery', 
  -- 'shop_delivery' or 'platform_delivery'
  
  ADD COLUMN IF NOT EXISTS delivery_partner_earnings DECIMAL(10, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS platform_delivery_commission DECIMAL(10, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS platform_total_commission DECIMAL(10, 2) DEFAULT 0,
  -- platform_product_commission + platform_delivery_commission
  
  ADD COLUMN IF NOT EXISTS gst_amount DECIMAL(10, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS platform_net_earnings DECIMAL(10, 2) DEFAULT 0;
  -- platform_total_commission - gst_amount

CREATE INDEX IF NOT EXISTS idx_orders_delivery_partner ON orders(delivery_partner_id);
CREATE INDEX IF NOT EXISTS idx_orders_delivery_type ON orders(delivery_type);

-- ============================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================
CREATE TRIGGER IF NOT EXISTS update_delivery_partners_updated_at 
  BEFORE UPDATE ON delivery_partners 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER IF NOT EXISTS update_delivery_assignments_updated_at 
  BEFORE UPDATE ON delivery_assignments 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER IF NOT EXISTS update_feedback_complaints_updated_at 
  BEFORE UPDATE ON feedback_complaints 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER IF NOT EXISTS update_partner_daily_settlements_updated_at 
  BEFORE UPDATE ON partner_daily_settlements 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON TABLE delivery_partners IS 'Delivery partners with KYC and operational details';
COMMENT ON TABLE delivery_assignments IS 'Delivery assignments with status tracking and OTP verification';
COMMENT ON TABLE delivery_requests IS 'Real-time delivery request matching system';
COMMENT ON TABLE feedback_complaints IS 'Feedback and complaints from all parties';
COMMENT ON TABLE partner_daily_settlements IS 'Daily payment settlements for delivery partners';
COMMENT ON TABLE platform_earnings IS 'Platform earnings with GST tracking';

-- ============================================
-- SUCCESS MESSAGE
-- ============================================
DO $$
BEGIN
    RAISE NOTICE '✅ Delivery Partner System Migration Complete!';
    RAISE NOTICE 'Created tables: delivery_partners, delivery_assignments, delivery_requests, feedback_complaints, partner_daily_settlements, platform_earnings';
    RAISE NOTICE 'Updated orders table with delivery partner columns';
END $$;
