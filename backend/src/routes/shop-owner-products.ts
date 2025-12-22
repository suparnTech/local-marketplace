// backend/src/routes/shop-owner-products.ts
// Product Management APIs for Shop Owners

import express, { Request, Response } from 'express';
import multer from 'multer';
import * as XLSX from 'xlsx';
import { pool as db } from '../lib/db';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// Configure multer for Excel uploads
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

// ============================================
// 1. GET ALL PRODUCTS (Shop Owner's)
// ============================================

/**
 * GET /api/shop-owner/products
 * Get all products for the shop owner
 */
router.get('/', authenticate, async (req: Request, res: Response) => {
    const userId = (req as any).userId;
    const { search, category, status, page = 1, limit = 20 } = req.query;

    try {
        // Get shop ID
        const shopResult = await db.query(
            'SELECT id FROM shops WHERE owner_id = $1',
            [userId]
        );

        if (shopResult.rows.length === 0) {
            return res.status(404).json({ error: 'Shop not found' });
        }

        const shopId = shopResult.rows[0].id;

        // Build query
        let query = `
      SELECT 
        p.*,
        c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.shop_id = $1
    `;
        const params: any[] = [shopId];
        let paramIndex = 2;

        if (search) {
            query += ` AND p.name ILIKE $${paramIndex}`;
            params.push(`%${search}%`);
            paramIndex++;
        }

        if (category) {
            query += ` AND p.category_id = $${paramIndex}`;
            params.push(category);
            paramIndex++;
        }

        if (status === 'available') {
            query += ` AND p.is_available = true`;
        } else if (status === 'unavailable') {
            query += ` AND p.is_available = false`;
        } else if (status === 'low_stock') {
            query += ` AND p.stock_quantity <= p.low_stock_threshold`;
        } else if (status === 'out_of_stock') {
            query += ` AND p.stock_quantity = 0`;
        }

        query += ` ORDER BY p.created_at DESC`;
        query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
        params.push(parseInt(limit as string), (parseInt(page as string) - 1) * parseInt(limit as string));

        const result = await db.query(query, params);

        // Get total count
        const countResult = await db.query(
            'SELECT COUNT(*) FROM products WHERE shop_id = $1',
            [shopId]
        );

        res.json({
            products: result.rows.map(p => ({
                id: p.id,
                name: p.name,
                description: p.description,
                category: {
                    id: p.category_id,
                    name: p.category_name,
                },
                pricing: {
                    shopPrice: parseFloat(p.shop_price),
                    customerPrice: parseFloat(p.customer_price),
                    commission: parseFloat(p.commission_amount),
                    mrp: p.mrp ? parseFloat(p.mrp) : null,
                },
                inventory: {
                    stock: p.stock_quantity,
                    unit: p.unit,
                    lowStockThreshold: p.low_stock_threshold,
                },
                details: {
                    sku: p.sku,
                    hsnCode: p.hsn_code,
                    brand: p.brand,
                    expiryDate: p.expiry_date,
                },
                images: p.images || [],
                isAvailable: p.is_available,
                isFeatured: p.is_featured,
                createdAt: p.created_at,
                updatedAt: p.updated_at,
            })),
            pagination: {
                page: parseInt(page as string),
                limit: parseInt(limit as string),
                total: parseInt(countResult.rows[0].count),
                pages: Math.ceil(countResult.rows[0].count / parseInt(limit as string)),
            },
        });
    } catch (error) {
        console.error('Get products error:', error);
        res.status(500).json({ error: 'Failed to fetch products' });
    }
});

/**
 * GET /api/shop-owner/products/template
 * Download sample Excel template
 */
router.get('/template', authenticate, async (req: Request, res: Response) => {
    try {
        const sampleData = [
            {
                'Product Name': 'Sample Product',
                'Description': 'This is a sample product description',
                'Category Name': 'Grocery & Staples', // Use name instead of ID for better UX
                'Price': 100,
                'MRP': 120,
                'Stock': 50,
                'Unit': 'piece',
                'SKU': 'SAMPLE-001',
                'HSN Code': '1234',
                'Brand': 'Sample Brand'
            }
        ];

        const worksheet = XLSX.utils.json_to_sheet(sampleData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Products');

        const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

        res.setHeader('Content-Disposition', 'attachment; filename=product_template.xlsx');
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.send(buffer);
    } catch (error) {
        console.error('Template generation error:', error);
        res.status(500).json({ error: 'Failed to generate template' });
    }
});

/**
 * GET /api/shop-owner/products/:id
 * Get details of a single product
 */
router.get('/:id', authenticate, async (req: Request, res: Response) => {
    const userId = (req as any).userId;
    const productId = req.params.id;

    try {
        // Get shop ID
        const shopResult = await db.query(
            'SELECT id FROM shops WHERE owner_id = $1',
            [userId]
        );

        if (shopResult.rows.length === 0) {
            return res.status(404).json({ error: 'Shop not found' });
        }

        const shopId = shopResult.rows[0].id;

        const result = await db.query(
            `SELECT p.*, c.name as category_name
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.id = $1 AND p.shop_id = $2`,
            [productId, shopId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }

        const p = result.rows[0];
        res.json({
            id: p.id,
            name: p.name,
            description: p.description,
            category: {
                id: p.category_id,
                name: p.category_name,
            },
            pricing: {
                shopPrice: parseFloat(p.shop_price),
                customerPrice: parseFloat(p.customer_price),
                commission: parseFloat(p.commission_amount),
                mrp: p.mrp ? parseFloat(p.mrp) : null,
            },
            inventory: {
                stock: p.stock_quantity,
                unit: p.unit,
                lowStockThreshold: p.low_stock_threshold,
            },
            details: {
                sku: p.sku,
                hsnCode: p.hsn_code,
                brand: p.brand,
                expiryDate: p.expiry_date,
            },
            images: p.images || [],
            isAvailable: p.is_available,
            isFeatured: p.is_featured,
            createdAt: p.created_at,
            updatedAt: p.updated_at,
        });
    } catch (error) {
        console.error('Get product by ID error:', error);
        res.status(500).json({ error: 'Failed to fetch product details' });
    }
});

// ============================================
// 2. ADD PRODUCT (Manual)
// ============================================

/**
 * POST /api/shop-owner/products
 * Add a new product
 */
router.post('/', authenticate, async (req: Request, res: Response) => {
    const userId = (req as any).userId;

    try {
        const {
            name,
            description,
            categoryId,
            shopPrice,
            mrp,
            stock,
            unit,
            sku,
            hsnCode,
            brand,
            expiryDate,
            images,
        } = req.body;

        // Validate required fields
        if (!name || !shopPrice || stock === undefined || !unit) {
            return res.status(400).json({ error: 'Missing required fields: name, shopPrice, stock, unit' });
        }

        // Get shop ID
        const shopResult = await db.query(
            'SELECT id, is_approved FROM shops WHERE owner_id = $1',
            [userId]
        );

        if (shopResult.rows.length === 0) {
            return res.status(404).json({ error: 'Shop not found' });
        }

        const shop = shopResult.rows[0];

        if (!shop.is_approved) {
            return res.status(403).json({ error: 'Your shop must be approved before adding products' });
        }

        // Insert product (commission will be auto-calculated by trigger)
        const result = await db.query(
            `INSERT INTO products (
        shop_id, name, description, category_id, shop_price, mrp,
        stock_quantity, unit, sku, hsn_code, brand, expiry_date, images,
        is_available, low_stock_threshold
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, true, 10)
      RETURNING *`,
            [
                shop.id,
                name,
                description,
                categoryId,
                shopPrice,
                mrp,
                stock,
                unit,
                sku || `SKU-${Date.now()}`,
                hsnCode,
                brand,
                expiryDate,
                images || [],
            ]
        );

        const product = result.rows[0];

        res.status(201).json({
            message: 'Product added successfully',
            product: {
                id: product.id,
                name: product.name,
                shopPrice: parseFloat(product.shop_price),
                customerPrice: parseFloat(product.customer_price),
                commission: parseFloat(product.commission_amount),
                stock: product.stock_quantity,
            },
        });
    } catch (error) {
        console.error('Add product error:', error);
        res.status(500).json({ error: 'Failed to add product' });
    }
});

// ============================================
// 3. UPDATE PRODUCT
// ============================================

/**
 * PUT /api/shop-owner/products/:id
 * Update a product
 */
router.put('/:id', authenticate, async (req: Request, res: Response) => {
    const userId = (req as any).userId;
    const productId = req.params.id;

    try {
        const {
            name,
            description,
            categoryId,
            shopPrice,
            mrp,
            stock,
            unit,
            sku,
            hsnCode,
            brand,
            expiryDate,
            images,
            isAvailable,
        } = req.body;

        // Get shop ID and verify ownership
        const shopResult = await db.query(
            'SELECT id FROM shops WHERE owner_id = $1',
            [userId]
        );

        if (shopResult.rows.length === 0) {
            return res.status(404).json({ error: 'Shop not found' });
        }

        const shopId = shopResult.rows[0].id;

        // Verify product belongs to shop
        const productCheck = await db.query(
            'SELECT id FROM products WHERE id = $1 AND shop_id = $2',
            [productId, shopId]
        );

        if (productCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Product not found or does not belong to your shop' });
        }

        // Update product
        await db.query(
            `UPDATE products SET
        name = COALESCE($1, name),
        description = COALESCE($2, description),
        category_id = COALESCE($3, category_id),
        shop_price = COALESCE($4, shop_price),
        mrp = COALESCE($5, mrp),
        stock_quantity = COALESCE($6, stock_quantity),
        unit = COALESCE($7, unit),
        sku = COALESCE($8, sku),
        hsn_code = COALESCE($9, hsn_code),
        brand = COALESCE($10, brand),
        expiry_date = COALESCE($11, expiry_date),
        images = COALESCE($12, images),
        is_available = COALESCE($13, is_available),
        updated_at = NOW()
      WHERE id = $14`,
            [
                name, description, categoryId, shopPrice, mrp, stock, unit,
                sku, hsnCode, brand, expiryDate, images, isAvailable, productId,
            ]
        );

        res.json({ message: 'Product updated successfully' });
    } catch (error) {
        console.error('Update product error:', error);
        res.status(500).json({ error: 'Failed to update product' });
    }
});

// ============================================
// 4. DELETE PRODUCT
// ============================================

/**
 * DELETE /api/shop-owner/products/:id
 * Delete a product
 */
router.delete('/:id', authenticate, async (req: Request, res: Response) => {
    const userId = (req as any).userId;
    const productId = req.params.id;

    try {
        // Get shop ID
        const shopResult = await db.query(
            'SELECT id FROM shops WHERE owner_id = $1',
            [userId]
        );

        if (shopResult.rows.length === 0) {
            return res.status(404).json({ error: 'Shop not found' });
        }

        const shopId = shopResult.rows[0].id;

        // Delete product
        const result = await db.query(
            'DELETE FROM products WHERE id = $1 AND shop_id = $2 RETURNING id',
            [productId, shopId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }

        res.json({ message: 'Product deleted successfully' });
    } catch (error) {
        console.error('Delete product error:', error);
        res.status(500).json({ error: 'Failed to delete product' });
    }
});

// ============================================
// 5. BULK UPDATE STOCK
// ============================================

/**
 * PUT /api/shop-owner/products/bulk/stock
 * Update stock for multiple products
 */
router.put('/bulk/stock', authenticate, async (req: Request, res: Response) => {
    const userId = (req as any).userId;
    const { updates } = req.body; // [{ productId, stock }, ...]

    if (!Array.isArray(updates) || updates.length === 0) {
        return res.status(400).json({ error: 'Invalid updates array' });
    }

    try {
        // Get shop ID
        const shopResult = await db.query(
            'SELECT id FROM shops WHERE owner_id = $1',
            [userId]
        );

        if (shopResult.rows.length === 0) {
            return res.status(404).json({ error: 'Shop not found' });
        }

        const shopId = shopResult.rows[0].id;

        // Update each product
        const promises = updates.map(({ productId, stock }) =>
            db.query(
                'UPDATE products SET stock_quantity = $1, updated_at = NOW() WHERE id = $2 AND shop_id = $3',
                [stock, productId, shopId]
            )
        );

        await Promise.all(promises);

        res.json({ message: `${updates.length} products updated successfully` });
    } catch (error) {
        console.error('Bulk update error:', error);
        res.status(500).json({ error: 'Failed to update products' });
    }
});

// ============================================
// 6. UPLOAD EXCEL (Bulk Product Upload)
// ============================================

/**
 * POST /api/shop-owner/products/upload-excel
 * Upload products via Excel file
 */
router.post('/upload-excel', authenticate, upload.single('file'), async (req: Request, res: Response) => {
    const userId = (req as any).userId;
    const file = req.file;

    if (!file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    try {
        // Get shop ID
        const shopResult = await db.query(
            'SELECT id, is_approved FROM shops WHERE owner_id = $1',
            [userId]
        );

        if (shopResult.rows.length === 0) {
            return res.status(404).json({ error: 'Shop not found' });
        }

        const shop = shopResult.rows[0];

        if (!shop.is_approved) {
            return res.status(403).json({ error: 'Your shop must be approved before uploading products' });
        }

        // Parse Excel file
        const workbook = XLSX.read(file.buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet);

        const successfulProducts: any[] = [];
        const failedProducts: any[] = [];

        // Process each row
        for (let i = 0; i < data.length; i++) {
            const row: any = data[i];

            try {
                // Validate required fields
                if (!row['Product Name'] || !row['Price'] || row['Stock'] === undefined || !row['Unit']) {
                    failedProducts.push({
                        row: i + 2,
                        data: row,
                        error: 'Missing required fields: Product Name, Price, Stock, Unit',
                    });
                    continue;
                }

                // Category lookup: Use UUID if valid, otherwise lookup by name
                let categoryId = null;
                const isUuid = (str: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

                if (row['Category ID'] && isUuid(String(row['Category ID']))) {
                    categoryId = row['Category ID'];
                } else if (row['Category Name']) {
                    const catResult = await db.query(
                        'SELECT id FROM categories WHERE name ILIKE $1',
                        [row['Category Name']]
                    );
                    if (catResult.rows.length > 0) {
                        categoryId = catResult.rows[0].id;
                    }
                }

                // Insert product
                const result = await db.query(
                    `INSERT INTO products (
            shop_id, name, description, category_id, shop_price, mrp,
            stock_quantity, unit, sku, hsn_code, brand, is_available
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, true)
          RETURNING id, name, shop_price, customer_price, commission_amount`,
                    [
                        shop.id,
                        row['Product Name'],
                        row['Description'] || null,
                        categoryId || null,
                        row['Price'],
                        row['MRP'] || null,
                        row['Stock'],
                        row['Unit'],
                        row['SKU'] || `SKU-${Date.now()}-${i}`,
                        row['HSN Code'] || null,
                        row['Brand'] || null,
                    ]
                );

                successfulProducts.push({
                    row: i + 2,
                    product: result.rows[0],
                });

                // Log initial stock to history
                await db.query(
                    `INSERT INTO stock_history (product_id, previous_stock, new_stock, change_reason, changed_by)
                     VALUES ($1, $2, $3, $4, $5)`,
                    [result.rows[0].id, 0, row['Stock'], 'Initial Excel Upload', userId]
                );
            } catch (error: any) {
                failedProducts.push({
                    row: i + 2,
                    data: row,
                    error: error.message,
                });
            }
        }

        // Save upload history
        await db.query(
            `INSERT INTO product_uploads (
        shop_id, file_name, total_rows, successful_rows, failed_rows,
        error_log, status
      ) VALUES ($1, $2, $3, $4, $5, $6, 'completed')`,
            [
                shop.id,
                file.originalname,
                data.length,
                successfulProducts.length,
                failedProducts.length,
                JSON.stringify(failedProducts),
            ]
        );

        res.json({
            message: 'Excel upload processed',
            summary: {
                total: data.length,
                successful: successfulProducts.length,
                failed: failedProducts.length,
            },
            successfulProducts: successfulProducts.slice(0, 10), // Show first 10
            failedProducts,
        });
    } catch (error) {
        console.error('Excel upload error:', error);
        res.status(500).json({ error: 'Failed to process Excel file' });
    }
});

export default router;
