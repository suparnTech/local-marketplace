// src/lib/s3.ts
import AWS from 'aws-sdk';
import dotenv from 'dotenv';

dotenv.config();

export const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION || 'ap-south-1',
});

export const bucketName = process.env.AWS_S3_BUCKET || 'local-marketplace-images';

// Generate presigned URL for upload
export function getUploadUrl(key: string, contentType: string): string {
    return s3.getSignedUrl('putObject', {
        Bucket: bucketName,
        Key: key,
        ContentType: contentType,
        Expires: 300, // 5 minutes
    });
}

// Generate presigned URL for download
export function getDownloadUrl(key: string): string {
    return s3.getSignedUrl('getObject', {
        Bucket: bucketName,
        Key: key,
        Expires: 3600, // 1 hour
    });
}

// Upload file directly
export async function uploadFile(key: string, buffer: Buffer, contentType: string): Promise<string> {
    await s3.putObject({
        Bucket: bucketName,
        Key: key,
        Body: buffer,
        ContentType: contentType,
    }).promise();

    return `https://${bucketName}.s3.${process.env.AWS_REGION || 'ap-south-1'}.amazonaws.com/${key}`;
}

// Delete file
export async function deleteFile(key: string): Promise<void> {
    await s3.deleteObject({
        Bucket: bucketName,
        Key: key,
    }).promise();
}

console.log('✅ S3 client initialized');
