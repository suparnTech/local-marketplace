// src/middleware/cognito-auth.ts
import AWS from 'aws-sdk';
import { NextFunction, Request, Response } from 'express';

const cognito = new AWS.CognitoIdentityServiceProvider({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_COGNITO_REGION || 'ap-south-1',
});

export interface AuthRequest extends Request {
    user?: {
        userId: string;
        email: string;
    };
}

export const authenticateCognito = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        console.log('🔒 Cognito auth middleware - checking token...');
        const token = req.headers.authorization?.replace('Bearer ', '');

        if (!token) {
            console.log('❌ No token provided in headers');
            return res.status(401).json({ error: 'No token provided' });
        }

        console.log('🎫 Token found, verifying with Cognito...');
        // Verify Cognito token
        const params: AWS.CognitoIdentityServiceProvider.GetUserRequest = {
            AccessToken: token,
        };

        const cognitoUser = await cognito.getUser(params).promise();
        console.log('✅ Cognito token verified');

        // Extract user info
        const email = cognitoUser.UserAttributes?.find(attr => attr.Name === 'email')?.Value;
        const userId = cognitoUser.Username;

        if (!email || !userId) {
            console.log('❌ Invalid token - missing email or userId');
            return res.status(401).json({ error: 'Invalid token' });
        }

        console.log('👤 Authenticated user:', { userId, email });
        req.user = {
            userId,
            email,
        };

        next();
    } catch (error: any) {
        console.error('❌ Cognito auth error:', error.message);
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
};
