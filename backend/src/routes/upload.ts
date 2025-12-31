// src/routes/upload.ts
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import express, { Request, Response } from 'express';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { getUploadUrl } from '../lib/s3';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// Configure multer for memory storage
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
    },
});

// S3 Client
const s3Client = new S3Client({
    region: process.env.AWS_REGION || 'ap-south-1',
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET || 'local-marketplace-uploads';

/**
 * POST /api/upload
 * Direct file upload to S3
 */
router.post('/', upload.single('file'), async (req: Request, res: Response) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file provided' });
        }

        const fileExtension = req.file.originalname.split('.').pop();
        const fileName = `${uuidv4()}.${fileExtension}`;
        const key = `documents/${fileName}`;

        // Upload to S3
        const command = new PutObjectCommand({
            Bucket: BUCKET_NAME,
            Key: key,
            Body: req.file.buffer,
            ContentType: req.file.mimetype,
        });

        await s3Client.send(command);

        // Return public URL
        const url = `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION || 'ap-south-1'}.amazonaws.com/${key}`;

        res.json({ url });
    } catch (error: any) {
        console.error('❌ Upload error:', error);
        res.status(500).json({ error: 'Upload failed' });
    }
});

// Get presigned URL for image upload
router.post('/presigned-url', authenticate, async (req, res) => {
    try {
        const { fileType, category } = req.body; // category: 'product', 'store', 'avatar'

        if (!fileType) {
            return res.status(400).json({ error: 'File type is required' });
        }

        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
        if (!allowedTypes.includes(fileType)) {
            return res.status(400).json({ error: 'Invalid file type. Only images allowed.' });
        }

        // Generate unique key
        const extension = fileType.split('/')[1];
        const key = `${category || 'images'}/${uuidv4()}.${extension}`;

        // Get presigned URL
        const uploadUrl = getUploadUrl(key, fileType);

        res.json({
            uploadUrl,
            key,
            publicUrl: `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION || 'ap-south-1'}.amazonaws.com/${key}`,
        });
    } catch (error: any) {
        console.error('Upload URL error:', error);
        res.status(500).json({ error: 'Failed to generate upload URL' });
    }
});

export default router;
