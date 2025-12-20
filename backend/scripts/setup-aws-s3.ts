// scripts/setup-aws-s3.ts
import AWS from 'aws-sdk';
import dotenv from 'dotenv';

dotenv.config();

const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION || 'ap-south-1',
});

async function setupS3() {
    console.log('📦 Setting up AWS S3 bucket for images...\n');

    const bucketName = 'local-marketplace-images';

    try {
        // Create S3 bucket
        await s3.createBucket({
            Bucket: bucketName,
            ACL: 'private',
            CreateBucketConfiguration: {
                LocationConstraint: process.env.AWS_REGION || 'ap-south-1',
            },
        }).promise();

        console.log('✅ S3 Bucket created!');
        console.log('Bucket Name:', bucketName);

        // Enable versioning
        await s3.putBucketVersioning({
            Bucket: bucketName,
            VersioningConfiguration: {
                Status: 'Enabled',
            },
        }).promise();

        console.log('✅ Versioning enabled');

        // Configure CORS
        await s3.putBucketCors({
            Bucket: bucketName,
            CORSConfiguration: {
                CORSRules: [
                    {
                        AllowedHeaders: ['*'],
                        AllowedMethods: ['GET', 'PUT', 'POST', 'DELETE'],
                        AllowedOrigins: ['*'],
                        ExposeHeaders: ['ETag'],
                        MaxAgeSeconds: 3000,
                    },
                ],
            },
        }).promise();

        console.log('✅ CORS configured');

        console.log('\n📝 Add this to your .env file:');
        console.log(`AWS_S3_BUCKET=${bucketName}`);

        console.log('\n🎉 S3 setup complete!');
        console.log('\nFree Tier: 5GB storage, 20,000 GET requests, 2,000 PUT requests/month');

    } catch (error: any) {
        if (error.code === 'BucketAlreadyOwnedByYou' || error.code === 'BucketAlreadyExists') {
            console.log('ℹ️  Bucket already exists!');
            console.log('Bucket Name:', bucketName);
            console.log('\n📝 Add this to your .env file:');
            console.log(`AWS_S3_BUCKET=${bucketName}`);
        } else {
            console.error('❌ Error:', error.message);
            throw error;
        }
    }
}

setupS3();
