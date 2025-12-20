// src/routes/upload.ts
import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getUploadUrl } from '../lib/s3';
import { authenticate } from '../middleware/auth';

const router = express.Router();

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
