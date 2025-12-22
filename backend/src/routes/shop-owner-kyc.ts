// backend/src/routes/shop-owner-kyc.ts
// KYC Document Upload and Verification APIs

import express, { Request, Response } from 'express';
import multer from 'multer';
import { pool as db } from '../lib/db';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// Configure multer
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type'));
        }
    },
});

// ============================================
// MOCK VERIFICATION SERVICE
// ============================================

class MockVerificationService {
    // Mock GST verification
    static async verifyGST(gstNumber: string): Promise<{ valid: boolean; businessName?: string }> {
        const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

        if (gstRegex.test(gstNumber)) {
            return {
                valid: true,
                businessName: `Business for ${gstNumber.substring(2, 7)}`,
            };
        }
        return { valid: false };
    }

    // Mock PAN verification
    static async verifyPAN(panNumber: string): Promise<{ valid: boolean; name?: string }> {
        const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;

        if (panRegex.test(panNumber)) {
            return {
                valid: true,
                name: `Owner ${panNumber.substring(0, 5)}`,
            };
        }
        return { valid: false };
    }

    // Mock Aadhaar verification
    static async verifyAadhaar(aadhaarNumber: string): Promise<{ valid: boolean }> {
        const aadhaarRegex = /^[0-9]{12}$/;
        return { valid: aadhaarRegex.test(aadhaarNumber) };
    }

    // Mock Bank Account verification
    static async verifyBankAccount(
        accountNumber: string,
        ifsc: string
    ): Promise<{ valid: boolean; accountHolderName?: string }> {
        const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;

        if (ifscRegex.test(ifsc) && accountNumber.length >= 9) {
            return {
                valid: true,
                accountHolderName: `Account Holder ${accountNumber.substring(0, 4)}`,
            };
        }
        return { valid: false };
    }

    // Mock FSSAI verification
    static async verifyFSSAI(fssaiNumber: string): Promise<{ valid: boolean }> {
        const fssaiRegex = /^[0-9]{14}$/;
        return { valid: fssaiRegex.test(fssaiNumber) };
    }
}

// ============================================
// 1. UPLOAD KYC DOCUMENTS
// ============================================

/**
 * POST /api/shop-owner/kyc/upload
 * Upload KYC documents (GST, PAN, Aadhaar, etc.)
 */
router.post('/upload', authenticate, upload.single('document'), async (req: Request, res: Response) => {
    const userId = (req as any).userId;
    const file = req.file;
    const { documentType, documentNumber } = req.body;

    if (!file || !documentType) {
        return res.status(400).json({ error: 'Missing file or document type' });
    }

    try {
        // Get shop ID
        const shopResult = await db.query(
            'SELECT id FROM shops WHERE owner_id = $1',
            [userId]
        );

        if (shopResult.rows.length === 0) {
            return res.status(404).json({ error: 'Shop not found. Please register first.' });
        }

        const shopId = shopResult.rows[0].id;

        // Convert to base64 (in production, upload to S3)
        const fileUrl = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;

        // Update shop with document URL based on type
        const updateQueries: { [key: string]: string } = {
            gst: 'UPDATE shops SET gst_document_url = $1, gst_number = $2 WHERE id = $3',
            pan: 'UPDATE shops SET pan_document_url = $1, pan_number = $2 WHERE id = $3',
            aadhaar: 'UPDATE shops SET aadhaar_document_url = $1 WHERE id = $2',
            shop_license: 'UPDATE shops SET shop_license_url = $1, shop_license_number = $2 WHERE id = $3',
            fssai: 'UPDATE shops SET fssai_document_url = $1, fssai_number = $2 WHERE id = $3',
            cancelled_cheque: 'UPDATE shops SET cancelled_cheque_url = $1 WHERE id = $2',
        };

        const query = updateQueries[documentType];
        if (!query) {
            return res.status(400).json({ error: 'Invalid document type' });
        }

        if (documentType === 'aadhaar' || documentType === 'cancelled_cheque') {
            await db.query(query, [fileUrl, shopId]);
        } else {
            await db.query(query, [fileUrl, documentNumber, shopId]);
        }

        // Auto-verify using mock service
        let verificationResult: any = { valid: false };

        if (documentType === 'gst' && documentNumber) {
            verificationResult = await MockVerificationService.verifyGST(documentNumber);
        } else if (documentType === 'pan' && documentNumber) {
            verificationResult = await MockVerificationService.verifyPAN(documentNumber);
        } else if (documentType === 'fssai' && documentNumber) {
            verificationResult = await MockVerificationService.verifyFSSAI(documentNumber);
        }

        res.json({
            message: 'Document uploaded successfully',
            url: fileUrl,
            verification: verificationResult,
        });
    } catch (error) {
        console.error('KYC upload error:', error);
        res.status(500).json({ error: 'Failed to upload document' });
    }
});

// ============================================
// 2. UPLOAD BANK DETAILS
// ============================================

/**
 * POST /api/shop-owner/kyc/bank-details
 * Upload bank account details
 */
router.post('/bank-details', authenticate, async (req: Request, res: Response) => {
    const userId = (req as any).userId;
    const { accountNumber, ifscCode, accountHolderName } = req.body;

    if (!accountNumber || !ifscCode || !accountHolderName) {
        return res.status(400).json({ error: 'Missing required bank details' });
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

        // Verify bank account using mock service
        const verification = await MockVerificationService.verifyBankAccount(accountNumber, ifscCode);

        if (!verification.valid) {
            return res.status(400).json({ error: 'Invalid bank account details' });
        }

        // Update shop with bank details
        await db.query(
            `UPDATE shops SET 
        bank_account_number = $1,
        ifsc_code = $2,
        account_holder_name = $3
      WHERE id = $4`,
            [accountNumber, ifscCode, accountHolderName, shopId]
        );

        res.json({
            message: 'Bank details saved successfully',
            verification: {
                valid: true,
                accountHolderName: verification.accountHolderName,
            },
        });
    } catch (error) {
        console.error('Bank details error:', error);
        res.status(500).json({ error: 'Failed to save bank details' });
    }
});

// ============================================
// 3. GET KYC STATUS
// ============================================

/**
 * GET /api/shop-owner/kyc/status
 * Get KYC verification status
 */
router.get('/status', authenticate, async (req: Request, res: Response) => {
    const userId = (req as any).userId;

    try {
        const result = await db.query(
            `SELECT 
        gst_number, gst_document_url,
        pan_number, pan_document_url,
        aadhaar_document_url,
        shop_license_number, shop_license_url,
        fssai_number, fssai_document_url,
        bank_account_number, ifsc_code, account_holder_name, cancelled_cheque_url,
        verification_status, is_approved, verified_at
      FROM shops
      WHERE owner_id = $1`,
            [userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Shop not found' });
        }

        const shop = result.rows[0];

        res.json({
            verificationStatus: shop.verification_status,
            isApproved: shop.is_approved,
            verifiedAt: shop.verified_at,
            documents: {
                gst: {
                    number: shop.gst_number,
                    uploaded: !!shop.gst_document_url,
                    url: shop.gst_document_url,
                },
                pan: {
                    number: shop.pan_number,
                    uploaded: !!shop.pan_document_url,
                    url: shop.pan_document_url,
                },
                aadhaar: {
                    uploaded: !!shop.aadhaar_document_url,
                    url: shop.aadhaar_document_url,
                },
                shopLicense: {
                    number: shop.shop_license_number,
                    uploaded: !!shop.shop_license_url,
                    url: shop.shop_license_url,
                },
                fssai: {
                    number: shop.fssai_number,
                    uploaded: !!shop.fssai_document_url,
                    url: shop.fssai_document_url,
                },
                bank: {
                    accountNumber: shop.bank_account_number ? `****${shop.bank_account_number.slice(-4)}` : null,
                    ifscCode: shop.ifsc_code,
                    accountHolderName: shop.account_holder_name,
                    cancelledChequeUploaded: !!shop.cancelled_cheque_url,
                },
            },
            completionPercentage: calculateCompletionPercentage(shop),
        });
    } catch (error) {
        console.error('Get KYC status error:', error);
        res.status(500).json({ error: 'Failed to fetch KYC status' });
    }
});

// Helper function to calculate completion percentage
function calculateCompletionPercentage(shop: any): number {
    const requiredDocs = [
        shop.gst_document_url,
        shop.pan_document_url,
        shop.aadhaar_document_url,
        shop.shop_license_url,
        shop.bank_account_number,
    ];

    const uploadedCount = requiredDocs.filter(doc => !!doc).length;
    return Math.round((uploadedCount / requiredDocs.length) * 100);
}

// ============================================
// 4. SUBMIT FOR VERIFICATION
// ============================================

/**
 * POST /api/shop-owner/kyc/submit
 * Submit KYC for admin verification
 */
router.post('/submit', authenticate, async (req: Request, res: Response) => {
    const userId = (req as any).userId;

    try {
        // Get shop and check if all required documents are uploaded
        const result = await db.query(
            `SELECT id, gst_document_url, pan_document_url, aadhaar_document_url,
        shop_license_url, bank_account_number, verification_status
      FROM shops
      WHERE owner_id = $1`,
            [userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Shop not found' });
        }

        const shop = result.rows[0];

        // Check if all required documents are uploaded
        if (!shop.gst_document_url || !shop.pan_document_url || !shop.aadhaar_document_url ||
            !shop.shop_license_url || !shop.bank_account_number) {
            return res.status(400).json({
                error: 'Please upload all required documents before submitting',
                missing: {
                    gst: !shop.gst_document_url,
                    pan: !shop.pan_document_url,
                    aadhaar: !shop.aadhaar_document_url,
                    shopLicense: !shop.shop_license_url,
                    bankDetails: !shop.bank_account_number,
                },
            });
        }

        // Update verification status to 'submitted'
        await db.query(
            `UPDATE shops SET 
        verification_status = 'submitted',
        updated_at = NOW()
      WHERE id = $1`,
            [shop.id]
        );

        res.json({
            message: 'KYC submitted successfully. Your application is under review.',
            estimatedReviewTime: '24-48 hours',
        });
    } catch (error) {
        console.error('Submit KYC error:', error);
        res.status(500).json({ error: 'Failed to submit KYC' });
    }
});

export default router;
