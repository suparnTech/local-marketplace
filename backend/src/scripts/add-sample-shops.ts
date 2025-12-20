// backend/src/scripts/add-sample-shops.ts
// Add sample shops and products for testing

import { pool } from '../lib/db';

async function addSampleShops() {
    console.log('🏪 Adding sample shops and products...\n');

    try {
        // Get Meerut town ID
        const townResult = await pool.query(`SELECT id FROM towns WHERE name = 'Meerut' LIMIT 1`);
        if (townResult.rows.length === 0) {
            console.error('❌ Meerut not found in database');
            return;
        }
        const meerutId = townResult.rows[0].id;

        // Get category IDs
        const categoriesResult = await pool.query(`SELECT id, slug FROM categories`);
        const categories = categoriesResult.rows.reduce((acc: any, cat: any) => {
            acc[cat.slug] = cat.id;
            return acc;
        }, {});

        console.log('📍 Town: Meerut');
        console.log('📦 Categories:', Object.keys(categories).join(', '));

        // Add sample shops
        const shops = [
            {
                name: 'Fresh Mart Grocery',
                slug: 'fresh-mart-meerut',
                description: 'Your daily grocery needs - fresh vegetables, fruits, and essentials',
                category: categories['grocery'],
                address: 'Shastri Nagar, Main Road, Meerut',
                phone: '+91-9876543210',
                logo_url: 'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=400',
                rating: 4.5,
                is_approved: true,
                is_active: true,
            },
            {
                name: 'Tech Zone Electronics',
                slug: 'tech-zone-meerut',
                description: 'Latest mobiles, laptops, and electronics at best prices',
                category: categories['electronics'],
                address: 'Gandhi Nagar, Near City Mall, Meerut',
                phone: '+91-9876543211',
                logo_url: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=400',
                rating: 4.7,
                is_approved: true,
                is_active: true,
            },
            {
                name: 'Style Hub Fashion',
                slug: 'style-hub-meerut',
                description: 'Trendy clothes for men, women, and kids',
                category: categories['fashion'],
                address: 'Civil Lines, Shopping Complex, Meerut',
                phone: '+91-9876543212',
                logo_url: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400',
                rating: 4.4,
                is_approved: true,
                is_active: true,
            },
            {
                name: 'HealthCare Pharmacy',
                slug: 'healthcare-pharmacy-meerut',
                description: '24/7 pharmacy with all medicines and health products',
                category: categories['health'],
                address: 'Court Road, Near District Hospital, Meerut',
                phone: '+91-9876543213',
                logo_url: 'https://images.unsplash.com/photo-1576602976047-174e57a47881?w=400',
                rating: 4.8,
                is_approved: true,
                is_active: true,
            },
        ];

        console.log('\n🏪 Adding shops...');
        const shopIds: any = {};

        for (const shop of shops) {
            const result = await pool.query(`
        INSERT INTO shops (
          name, slug, description, town_id, category_id,
          address_line1, phone, logo_url, rating,
          is_approved, is_active, delivery_available
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, true)
        ON CONFLICT (slug) DO UPDATE SET
          rating = EXCLUDED.rating,
          is_approved = EXCLUDED.is_approved
        RETURNING id
      `, [
                shop.name, shop.slug, shop.description, meerutId, shop.category,
                shop.address, shop.phone, shop.logo_url, shop.rating,
                shop.is_approved, shop.is_active
            ]);

            shopIds[shop.slug] = result.rows[0].id;
            console.log(`  ✓ ${shop.name}`);
        }

        // Add sample products
        console.log('\n📦 Adding products...');

        const products = [
            // Grocery products
            {
                shop: shopIds['fresh-mart-meerut'],
                category: categories['grocery'],
                name: 'Fresh Tomatoes (1 kg)',
                price: 60,
                stock: 50,
                images: ['https://images.unsplash.com/photo-1546094096-0df4bcaaa337?w=800'],
                description: 'Farm-fresh red tomatoes, perfect for cooking',
            },
            {
                shop: shopIds['fresh-mart-meerut'],
                category: categories['grocery'],
                name: 'Tata Salt (1 kg)',
                price: 20,
                stock: 100,
                images: ['https://images.unsplash.com/photo-1598520106830-8c45c2035460?w=800'],
                description: 'Pure iodized salt for healthy cooking',
            },
            {
                shop: shopIds['fresh-mart-meerut'],
                category: categories['grocery'],
                name: 'Fresh Milk (1 L)',
                price: 60,
                stock: 30,
                images: ['https://images.unsplash.com/photo-1563636619-e9143da7973b?w=800'],
                description: 'Pure cow milk, delivered fresh daily',
            },

            // Electronics products
            {
                shop: shopIds['tech-zone-meerut'],
                category: categories['electronics'],
                name: 'Samsung Galaxy M34 5G',
                price: 18999,
                stock: 10,
                images: [
                    'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=800',
                    'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800'
                ],
                description: '6GB RAM, 128GB Storage, 50MP Camera, 6000mAh Battery',
            },
            {
                shop: shopIds['tech-zone-meerut'],
                category: categories['electronics'],
                name: 'boAt Airdopes 141',
                price: 1299,
                stock: 25,
                images: ['https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800'],
                description: 'TWS Earbuds with 42H playback and fast charging',
            },

            // Fashion products
            {
                shop: shopIds['style-hub-meerut'],
                category: categories['fashion'],
                name: "Men's Cotton T-Shirt",
                price: 399,
                stock: 50,
                images: ['https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800'],
                description: 'Premium quality cotton t-shirt, comfortable fit',
            },
            {
                shop: shopIds['style-hub-meerut'],
                category: categories['fashion'],
                name: "Women's Kurti",
                price: 799,
                stock: 30,
                images: ['https://images.unsplash.com/photo-1583391733956-6c78276477e2?w=800'],
                description: 'Stylish cotton kurti for daily wear',
            },

            // Health products
            {
                shop: shopIds['healthcare-pharmacy-meerut'],
                category: categories['health'],
                name: 'Dolo 650mg (Strip of 15)',
                price: 30,
                stock: 100,
                images: ['https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800'],
                description: 'Paracetamol tablets for fever and pain relief',
            },
            {
                shop: shopIds['healthcare-pharmacy-meerut'],
                category: categories['health'],
                name: 'Hand Sanitizer 500ml',
                price: 150,
                stock: 50,
                images: ['https://images.unsplash.com/photo-1584483766114-2cea6facdf57?w=800'],
                description: '70% alcohol-based hand sanitizer',
            },
        ];

        for (const product of products) {
            await pool.query(`
        INSERT INTO products (
          shop_id, category_id, name, price, stock_quantity,
          images, description, is_available, rating
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, true, $8)
        ON CONFLICT DO NOTHING
      `, [
                product.shop, product.category, product.name, product.price,
                product.stock, product.images, product.description,
                (Math.random() * 2 + 3).toFixed(1) // Random rating 3-5
            ]);

            console.log(`  ✓ ${product.name}`);
        }

        // Summary
        const summary = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM shops WHERE town_id = $1) as shops,
        (SELECT COUNT(*) FROM products WHERE shop_id IN (SELECT id FROM shops WHERE town_id = $1)) as products
    `, [meerutId]);

        console.log('\n📊 Summary for Meerut:');
        console.log(`  Shops: ${summary.rows[0].shops}`);
        console.log(`  Products: ${summary.rows[0].products}`);

        console.log('\n🎉 Sample data added successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Failed:', error);
        process.exit(1);
    }
}

addSampleShops();
