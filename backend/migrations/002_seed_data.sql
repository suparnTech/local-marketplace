-- Seed Data for Local Marketplace
-- Sample data for testing and development

-- ============================================
-- 1. SEED TOWNS
-- ============================================
INSERT INTO towns (name, state, district, pincode, latitude, longitude, population) VALUES
('Saharanpur', 'Uttar Pradesh', 'Saharanpur', '247001', 29.9680, 77.5460, 705478),
('Muzaffarnagar', 'Uttar Pradesh', 'Muzaffarnagar', '251001', 29.4727, 77.7085, 392451),
('Meerut', 'Uttar Pradesh', 'Meerut', '250001', 28.9845, 77.7064, 1305429),
('Hapur', 'Uttar Pradesh', 'Hapur', '245101', 28.7296, 77.7760, 262801),
('Bulandshahr', 'Uttar Pradesh', 'Bulandshahr', '203001', 28.4070, 77.8498, 198612),
('Moradabad', 'Uttar Pradesh', 'Moradabad', '244001', 28.8389, 78.7769, 889810),
('Rampur', 'Uttar Pradesh', 'Rampur', '244901', 28.8080, 79.0256, 325248),
('Bareilly', 'Uttar Pradesh', 'Bareilly', '243001', 28.3670, 79.4304, 903668),
('Aligarh', 'Uttar Pradesh', 'Aligarh', '202001', 27.8974, 78.0880, 874408),
('Mathura', 'Uttar Pradesh', 'Mathura', '281001', 27.4924, 77.6737, 441894),
('Agra', 'Uttar Pradesh', 'Agra', '282001', 27.1767, 78.0081, 1585704),
('Firozabad', 'Uttar Pradesh', 'Firozabad', '283203', 27.1591, 78.3957, 306409),
('Etawah', 'Uttar Pradesh', 'Etawah', '206001', 26.7855, 79.0215, 256838),
('Kanpur', 'Uttar Pradesh', 'Kanpur', '208001', 26.4499, 80.3319, 2920067),
('Lucknow', 'Uttar Pradesh', 'Lucknow', '226001', 26.8467, 80.9462, 2817105);

-- ============================================
-- 2. SEED CATEGORIES
-- ============================================
INSERT INTO categories (name, slug, description, icon, color, display_order) VALUES
('Grocery & Staples', 'grocery', 'Daily essentials, vegetables, fruits, dairy', 'cart', '#10B981', 1),
('Electronics', 'electronics', 'Mobile phones, laptops, accessories', 'phone-portrait', '#3B82F6', 2),
('Fashion & Clothing', 'fashion', 'Clothes, shoes, accessories for men, women, kids', 'shirt', '#EC4899', 3),
('Home & Kitchen', 'home-kitchen', 'Furniture, appliances, home decor', 'home', '#F59E0B', 4),
('Health & Medicine', 'health', 'Medicines, health supplements, medical equipment', 'medical', '#EF4444', 5),
('Beauty & Personal Care', 'beauty', 'Cosmetics, skincare, haircare products', 'sparkles', '#A855F7', 6),
('Sports & Fitness', 'sports', 'Sports equipment, gym accessories, fitness gear', 'basketball', '#14B8A6', 7),
('Books & Stationery', 'books', 'Books, notebooks, pens, office supplies', 'book', '#6366F1', 8),
('Toys & Games', 'toys', 'Toys for kids, board games, puzzles', 'game-controller', '#F97316', 9),
('Automotive', 'automotive', 'Car accessories, bike parts, tools', 'car', '#64748B', 10);

-- ============================================
-- 3. SEED SAMPLE SHOPS
-- ============================================
-- Note: Replace owner_id with actual user IDs from your users table
-- For now, using placeholder UUIDs - update after creating shop owners

INSERT INTO shops (
  name, slug, description, town_id, category_id,
  phone, email, address_line1, pincode,
  logo_url, is_open, delivery_available, min_order_amount, delivery_charge,
  rating, is_approved, is_active, verified
) VALUES
-- Grocery Shops
(
  'Sharma Kirana Store',
  'sharma-kirana-saharanpur',
  'Fresh vegetables, fruits, and daily essentials. Serving the community for 20+ years.',
  (SELECT id FROM towns WHERE name = 'Saharanpur' LIMIT 1),
  (SELECT id FROM categories WHERE slug = 'grocery' LIMIT 1),
  '+91-9876543210',
  'sharma.kirana@example.com',
  'Main Market, Near City Hospital',
  '247001',
  'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=400',
  true, true, 100, 20,
  4.5, true, true, true
),
(
  'Fresh Mart Grocery',
  'fresh-mart-meerut',
  'Organic vegetables, imported fruits, premium groceries',
  (SELECT id FROM towns WHERE name = 'Meerut' LIMIT 1),
  (SELECT id FROM categories WHERE slug = 'grocery' LIMIT 1),
  '+91-9876543211',
  'freshmart@example.com',
  'Shastri Nagar, Main Road',
  '250001',
  'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400',
  true, true, 150, 30,
  4.7, true, true, true
),

-- Electronics Shops
(
  'Tech Zone Electronics',
  'tech-zone-saharanpur',
  'Latest mobiles, laptops, accessories. Authorized dealer for Samsung, Apple, OnePlus',
  (SELECT id FROM towns WHERE name = 'Saharanpur' LIMIT 1),
  (SELECT id FROM categories WHERE slug = 'electronics' LIMIT 1),
  '+91-9876543212',
  'techzone@example.com',
  'Court Road, Near Bus Stand',
  '247001',
  'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=400',
  true, true, 500, 50,
  4.6, true, true, true
),

-- Fashion Shops
(
  'Style Hub Fashion',
  'style-hub-meerut',
  'Trendy clothes for men, women, and kids. Latest collections at affordable prices',
  (SELECT id FROM towns WHERE name = 'Meerut' LIMIT 1),
  (SELECT id FROM categories WHERE slug = 'fashion' LIMIT 1),
  '+91-9876543213',
  'stylehub@example.com',
  'Gandhi Nagar, Shopping Complex',
  '250001',
  'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400',
  true, true, 300, 40,
  4.4, true, true, true
),

-- Medicine Shops
(
  'HealthCare Pharmacy',
  'healthcare-pharmacy-saharanpur',
  '24/7 pharmacy with all medicines, health supplements, and medical equipment',
  (SELECT id FROM towns WHERE name = 'Saharanpur' LIMIT 1),
  (SELECT id FROM categories WHERE slug = 'health' LIMIT 1),
  '+91-9876543214',
  'healthcare@example.com',
  'Civil Lines, Near District Hospital',
  '247001',
  'https://images.unsplash.com/photo-1576602976047-174e57a47881?w=400',
  true, true, 0, 20,
  4.8, true, true, true
);

-- ============================================
-- 4. SEED SAMPLE PRODUCTS
-- ============================================
-- Grocery Products
INSERT INTO products (
  shop_id, category_id, name, slug, description, short_description,
  price, original_price, discount_percentage,
  sku, stock_quantity, images, thumbnail_url,
  brand, weight, tags, rating, is_available, is_featured
) VALUES
(
  (SELECT id FROM shops WHERE slug = 'sharma-kirana-saharanpur' LIMIT 1),
  (SELECT id FROM categories WHERE slug = 'grocery' LIMIT 1),
  'Fresh Tomatoes (1 kg)',
  'fresh-tomatoes-1kg',
  'Farm-fresh red tomatoes, perfect for cooking. Rich in vitamins and antioxidants.',
  'Farm-fresh red tomatoes, 1kg pack',
  60, 80, 25,
  'TOM-001', 50,
  ARRAY['https://images.unsplash.com/photo-1546094096-0df4bcaaa337?w=800', 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=800'],
  'https://images.unsplash.com/photo-1546094096-0df4bcaaa337?w=400',
  'Local Farm', 1.0,
  ARRAY['vegetables', 'fresh', 'organic'],
  4.5, true, true
),
(
  (SELECT id FROM shops WHERE slug = 'sharma-kirana-saharanpur' LIMIT 1),
  (SELECT id FROM categories WHERE slug = 'grocery' LIMIT 1),
  'Tata Salt (1 kg)',
  'tata-salt-1kg',
  'Tata Salt iodized salt for healthy cooking. Pure and hygienic.',
  'Tata iodized salt, 1kg pack',
  20, 22, 9,
  'SALT-001', 100,
  ARRAY['https://images.unsplash.com/photo-1598520106830-8c45c2035460?w=800'],
  'https://images.unsplash.com/photo-1598520106830-8c45c2035460?w=400',
  'Tata', 1.0,
  ARRAY['staples', 'salt'],
  4.7, true, false
),

-- Electronics Products
(
  (SELECT id FROM shops WHERE slug = 'tech-zone-saharanpur' LIMIT 1),
  (SELECT id FROM categories WHERE slug = 'electronics' LIMIT 1),
  'Samsung Galaxy M34 5G (6GB/128GB)',
  'samsung-galaxy-m34-5g',
  'Samsung Galaxy M34 5G with 6000mAh battery, 50MP camera, and 120Hz Super AMOLED display.',
  '6GB RAM, 128GB Storage, 50MP Camera',
  18999, 24999, 24,
  'SAM-M34-128', 15,
  ARRAY[
    'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=800',
    'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800',
    'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=800'
  ],
  'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=400',
  'Samsung', 0.2,
  ARRAY['smartphone', '5g', 'samsung'],
  4.6, true, true
),
(
  (SELECT id FROM shops WHERE slug = 'tech-zone-saharanpur' LIMIT 1),
  (SELECT id FROM categories WHERE slug = 'electronics' LIMIT 1),
  'boAt Airdopes 141 TWS Earbuds',
  'boat-airdopes-141',
  'boAt Airdopes 141 with 42H playback, ENx™ Tech, ASAP™ Charge, and IWP™ Technology.',
  '42H Playback, ENx Tech, Fast Charging',
  1299, 2999, 57,
  'BOAT-141', 30,
  ARRAY[
    'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800',
    'https://images.unsplash.com/photo-1606841837239-c5a1a4a07af7?w=800'
  ],
  'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=400',
  'boAt', 0.05,
  ARRAY['earbuds', 'wireless', 'audio'],
  4.3, true, true
),

-- Fashion Products
(
  (SELECT id FROM shops WHERE slug = 'style-hub-meerut' LIMIT 1),
  (SELECT id FROM categories WHERE slug = 'fashion' LIMIT 1),
  'Men''s Cotton T-Shirt',
  'mens-cotton-tshirt',
  'Premium quality cotton t-shirt for men. Comfortable, breathable, and stylish.',
  'Premium cotton, comfortable fit',
  399, 799, 50,
  'TSHIRT-001', 50,
  ARRAY[
    'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800',
    'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800'
  ],
  'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400',
  'Style Hub', 0.2,
  ARRAY['tshirt', 'men', 'cotton'],
  4.4, true, false
);

-- Add product variants for t-shirt
UPDATE products 
SET has_variants = true,
    variants = '[
      {
        "type": "size",
        "options": [
          {"value": "S", "price_modifier": 0, "stock": 15},
          {"value": "M", "price_modifier": 0, "stock": 20},
          {"value": "L", "price_modifier": 0, "stock": 10},
          {"value": "XL", "price_modifier": 50, "stock": 5}
        ]
      },
      {
        "type": "color",
        "options": [
          {"value": "Black", "price_modifier": 0, "stock": 20},
          {"value": "White", "price_modifier": 0, "stock": 15},
          {"value": "Navy Blue", "price_modifier": 0, "stock": 15}
        ]
      }
    ]'::jsonb
WHERE slug = 'mens-cotton-tshirt';

-- ============================================
-- GRANT PERMISSIONS (if needed)
-- ============================================
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO your_app_user;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO your_app_user;

COMMENT ON SCRIPT IS 'Seed data for Local Marketplace - Sample towns, categories, shops, and products for testing';
