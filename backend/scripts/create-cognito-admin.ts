// scripts/create-cognito-admin.ts
import AWS from 'aws-sdk';
import dotenv from 'dotenv';
import { Pool } from 'pg';

dotenv.config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false,
    },
});

const cognito = new AWS.CognitoIdentityServiceProvider({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_COGNITO_REGION || 'ap-south-1',
});

const clientId = process.env.AWS_COGNITO_CLIENT_ID!;

async function createCognitoAdmin() {
    console.log('👑 Creating Cognito admin user...\n');

    const adminEmail = 'admin@localmarketplace.com';
    const adminPassword = 'Admin@123';
    const adminName = 'Admin User';

    try {
        // 1. Create user in Cognito
        console.log('Creating Cognito user...');

        const signUpParams: AWS.CognitoIdentityServiceProvider.SignUpRequest = {
            ClientId: clientId,
            Username: adminEmail,
            Password: adminPassword,
            UserAttributes: [
                { Name: 'email', Value: adminEmail },
                { Name: 'name', Value: adminName },
            ],
        };

        let cognitoUserId;
        try {
            const signUpResult = await cognito.signUp(signUpParams).promise();
            cognitoUserId = signUpResult.UserSub;
            console.log('✅ Cognito user created');
        } catch (error: any) {
            if (error.code === 'UsernameExistsException') {
                console.log('ℹ️  Cognito user already exists');
                // Get existing user
                const users = await cognito.listUsers({
                    UserPoolId: process.env.AWS_COGNITO_USER_POOL_ID!,
                    Filter: `email = "${adminEmail}"`,
                }).promise();

                if (users.Users && users.Users.length > 0) {
                    cognitoUserId = users.Users[0].Username;
                }
            } else {
                throw error;
            }
        }

        // 2. Auto-confirm the user (admin privilege)
        console.log('Auto-confirming admin user...');
        await cognito.adminConfirmSignUp({
            UserPoolId: process.env.AWS_COGNITO_USER_POOL_ID!,
            Username: adminEmail,
        }).promise();
        console.log('✅ Email auto-confirmed');

        // 3. Create/update in database
        console.log('Creating database record...');

        // Check if exists
        const existing = await pool.query('SELECT id FROM users WHERE email = $1', [adminEmail]);

        if (existing.rows.length > 0) {
            // Update existing
            await pool.query(
                `UPDATE users SET role = 'ADMIN', is_approved = true WHERE email = $1`,
                [adminEmail]
            );
            console.log('✅ Updated existing user to ADMIN');
        } else {
            // Create new
            await pool.query(
                `INSERT INTO users (id, name, email, phone, password, role, is_approved, created_at)
         VALUES ($1, $2, $3, $4, $5, 'ADMIN', true, NOW())`,
                [cognitoUserId, adminName, adminEmail, '0000000000', 'cognito-managed']
            );
            console.log('✅ Database record created');
        }

        console.log('\n🎉 Admin user ready!');
        console.log('\n📧 Email:', adminEmail);
        console.log('🔑 Password:', adminPassword);
        console.log('\n✅ Login with Cognito auth - no email verification needed!');

        await pool.end();
    } catch (error: any) {
        console.error('❌ Error:', error.message);
        throw error;
    }
}

createCognitoAdmin();
