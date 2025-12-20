// src/lib/cognito.ts
import AWS from 'aws-sdk';
import dotenv from 'dotenv';

dotenv.config();

export const cognito = new AWS.CognitoIdentityServiceProvider({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_COGNITO_REGION || 'ap-south-1',
});

export const userPoolId = process.env.AWS_COGNITO_USER_POOL_ID!;
export const clientId = process.env.AWS_COGNITO_CLIENT_ID!;

if (!userPoolId || !clientId) {
    throw new Error('Cognito configuration missing in environment variables');
}

console.log('✅ Cognito client initialized');
