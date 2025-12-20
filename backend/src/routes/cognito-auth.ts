// src/routes/cognito-auth.ts
import express from 'express';
import { clientId, cognito } from '../lib/cognito';
import { pool } from '../lib/db';

const router = express.Router();

// Register with email
router.post('/register', async (req, res) => {
    try {
        const { email, password, name, phone, role } = req.body;

        if (!email || !password || !name) {
            return res.status(400).json({ error: 'Email, password, and name are required' });
        }

        // Sign up user in Cognito (NO custom attributes)
        const userAttributes: AWS.CognitoIdentityServiceProvider.AttributeType[] = [
            { Name: 'email', Value: email },
            { Name: 'name', Value: name },
        ];

        // Only add phone if provided and properly formatted
        if (phone && phone.startsWith('+')) {
            userAttributes.push({ Name: 'phone_number', Value: phone });
        }

        const signUpParams: AWS.CognitoIdentityServiceProvider.SignUpRequest = {
            ClientId: clientId,
            Username: email,
            Password: password,
            UserAttributes: userAttributes,
        };

        const signUpResult = await cognito.signUp(signUpParams).promise();

        // Create user in database with role
        const isApproved = role === 'CUSTOMER';

        await pool.query(
            `INSERT INTO users (id, name, email, phone, password, role, is_approved)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [signUpResult.UserSub, name, email, phone || '0000000000', 'cognito-managed', role || 'CUSTOMER', isApproved]
        );

        res.status(201).json({
            message: 'User registered successfully. Please check your email for verification code.',
            userId: signUpResult.UserSub,
            emailVerificationRequired: true,
            role,
            requiresApproval: !isApproved,
        });
    } catch (error: any) {
        console.error('Registration error:', error);
        res.status(500).json({ error: error.message || 'Registration failed' });
    }
});

// Verify email with code
router.post('/verify-email', async (req, res) => {
    try {
        const { email, code } = req.body;

        if (!email || !code) {
            return res.status(400).json({ error: 'Email and code are required' });
        }

        const params: AWS.CognitoIdentityServiceProvider.ConfirmSignUpRequest = {
            ClientId: clientId,
            Username: email,
            ConfirmationCode: code,
        };

        await cognito.confirmSignUp(params).promise();

        res.json({ message: 'Email verified successfully. You can now login.' });
    } catch (error: any) {
        console.error('Verification error:', error);
        res.status(500).json({ error: error.message || 'Verification failed' });
    }
});

// Resend verification code
router.post('/resend-code', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }

        const params: AWS.CognitoIdentityServiceProvider.ResendConfirmationCodeRequest = {
            ClientId: clientId,
            Username: email,
        };

        await cognito.resendConfirmationCode(params).promise();

        res.json({ message: 'Verification code sent to your email' });
    } catch (error: any) {
        console.error('Resend code error:', error);
        res.status(500).json({ error: error.message || 'Failed to resend code' });
    }
});

// Login with email
router.post('/login', async (req, res) => {
    try {
        console.log('🔐 Login attempt:', { email: req.body.email });

        const { email, password } = req.body;

        if (!email || !password) {
            console.log('❌ Missing credentials');
            return res.status(400).json({ error: 'Email and password are required' });
        }

        console.log('📞 Calling Cognito...');
        const params: AWS.CognitoIdentityServiceProvider.InitiateAuthRequest = {
            AuthFlow: 'USER_PASSWORD_AUTH',
            ClientId: clientId,
            AuthParameters: {
                USERNAME: email,
                PASSWORD: password,
            },
        };

        const authResult = await cognito.initiateAuth(params).promise();
        console.log('✅ Cognito auth successful');

        if (!authResult.AuthenticationResult) {
            console.log('❌ No auth result from Cognito');
            return res.status(401).json({ error: 'Authentication failed' });
        }

        console.log('📊 Fetching user from database...');
        // Get user details from database with timeout
        let userResult;
        try {
            userResult = await Promise.race([
                pool.query(
                    'SELECT id, name, email, phone, role, city, pincode, address, is_approved FROM users WHERE email = $1',
                    [email]
                ),
                new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Database query timeout')), 5000)
                )
            ]);
        } catch (dbError: any) {
            console.error('❌ Database query failed:', dbError.message);
            return res.status(500).json({
                error: 'Database connection error',
                details: dbError.message
            });
        }

        if (!userResult || !userResult.rows || userResult.rows.length === 0) {
            console.log('❌ User not found in database');
            return res.status(404).json({ error: 'User not found. Please register first.' });
        }

        const user = userResult.rows[0];
        console.log('👤 User found:', { email: user.email, role: user.role, is_approved: user.is_approved });

        // Check vendor approval
        if (user.role === 'STORE_OWNER' && !user.is_approved) {
            console.log('⏳ Vendor not approved');
            return res.status(403).json({
                error: 'Your account is pending admin approval.',
                pendingApproval: true,
            });
        }

        // Generate custom JWT token with 30-day expiration
        const { generateToken } = require('../middleware/auth');
        const customToken = generateToken(user.id, user.role);

        console.log('✅ Login successful for:', user.role);
        res.json({
            user,
            token: customToken, // Use custom JWT instead of Cognito token
            cognitoToken: authResult.AuthenticationResult.AccessToken, // Keep for compatibility
            idToken: authResult.AuthenticationResult.IdToken,
            refreshToken: authResult.AuthenticationResult.RefreshToken,
        });
    } catch (error: any) {
        console.error('Login error:', error);

        if (error.code === 'UserNotConfirmedException') {
            return res.status(403).json({
                error: 'Please verify your email first',
                emailVerificationRequired: true,
            });
        }

        res.status(401).json({ error: error.message || 'Login failed' });
    }
});

// Forgot password
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }

        const params: AWS.CognitoIdentityServiceProvider.ForgotPasswordRequest = {
            ClientId: clientId,
            Username: email,
        };

        await cognito.forgotPassword(params).promise();

        res.json({ message: 'Password reset code sent to your email' });
    } catch (error: any) {
        console.error('Forgot password error:', error);
        res.status(500).json({ error: error.message || 'Failed to send reset code' });
    }
});

// Confirm forgot password
router.post('/confirm-forgot-password', async (req, res) => {
    try {
        const { email, code, newPassword } = req.body;

        if (!email || !code || !newPassword) {
            return res.status(400).json({ error: 'Email, code, and new password are required' });
        }

        const params: AWS.CognitoIdentityServiceProvider.ConfirmForgotPasswordRequest = {
            ClientId: clientId,
            Username: email,
            ConfirmationCode: code,
            Password: newPassword,
        };

        await cognito.confirmForgotPassword(params).promise();

        res.json({ message: 'Password reset successfully. You can now login.' });
    } catch (error: any) {
        console.error('Confirm forgot password error:', error);
        res.status(500).json({ error: error.message || 'Password reset failed' });
    }
});

export default router;
