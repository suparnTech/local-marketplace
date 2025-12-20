// scripts/setup-aws-cognito-simple.ts
import AWS from 'aws-sdk';
import dotenv from 'dotenv';

dotenv.config();

const cognito = new AWS.CognitoIdentityServiceProvider({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION || 'ap-south-1',
});

async function setupCognito() {
    console.log('🔐 Setting up AWS Cognito with Email Verification...\n');

    try {
        // Create User Pool with simple configuration
        const userPoolParams: AWS.CognitoIdentityServiceProvider.CreateUserPoolRequest = {
            PoolName: 'local-marketplace-users',
            Policies: {
                PasswordPolicy: {
                    MinimumLength: 8,
                    RequireUppercase: false,
                    RequireLowercase: true,
                    RequireNumbers: true,
                    RequireSymbols: false,
                },
            },
            AutoVerifiedAttributes: ['email'],
            UsernameAttributes: ['email'],
            EmailVerificationMessage: 'Your verification code is {####}',
            EmailVerificationSubject: 'Verify your Local Marketplace account',
            MfaConfiguration: 'OFF',
            UserAttributeUpdateSettings: {
                AttributesRequireVerificationBeforeUpdate: ['email'],
            },
        };

        const userPool = await cognito.createUserPool(userPoolParams).promise();
        const userPoolId = userPool.UserPool?.Id!;

        console.log('✅ User Pool created!');
        console.log('User Pool ID:', userPoolId);

        // Create App Client
        const appClientParams: AWS.CognitoIdentityServiceProvider.CreateUserPoolClientRequest = {
            UserPoolId: userPoolId,
            ClientName: 'local-marketplace-app',
            GenerateSecret: false,
            ExplicitAuthFlows: [
                'ALLOW_USER_PASSWORD_AUTH',
                'ALLOW_REFRESH_TOKEN_AUTH',
                'ALLOW_USER_SRP_AUTH',
            ],
            PreventUserExistenceErrors: 'ENABLED',
            RefreshTokenValidity: 30,
            AccessTokenValidity: 60,
            IdTokenValidity: 60,
            TokenValidityUnits: {
                RefreshToken: 'days',
                AccessToken: 'minutes',
                IdToken: 'minutes',
            },
        };

        const appClient = await cognito.createUserPoolClient(appClientParams).promise();
        const appClientId = appClient.UserPoolClient?.ClientId!;

        console.log('✅ App Client created!');
        console.log('App Client ID:', appClientId);

        console.log('\n📝 Add these to your .env file:');
        console.log(`AWS_COGNITO_USER_POOL_ID=${userPoolId}`);
        console.log(`AWS_COGNITO_CLIENT_ID=${appClientId}`);
        console.log(`AWS_COGNITO_REGION=${process.env.AWS_REGION || 'ap-south-1'}`);

        console.log('\n🎉 Cognito setup complete!');
        console.log('\n✅ Features enabled:');
        console.log('  - Email-based login');
        console.log('  - Email verification with codes');
        console.log('  - Password reset via email');
        console.log('  - 50,000 MAUs free tier');

    } catch (error: any) {
        if (error.code === 'ResourceConflictException') {
            console.log('ℹ️  User Pool already exists. Fetching details...');

            const pools = await cognito.listUserPools({ MaxResults: 60 }).promise();
            const existingPool = pools.UserPools?.find(p => p.Name === 'local-marketplace-users');

            if (existingPool) {
                console.log('User Pool ID:', existingPool.Id);

                const clients = await cognito.listUserPoolClients({
                    UserPoolId: existingPool.Id!,
                    MaxResults: 60,
                }).promise();

                if (clients.UserPoolClients && clients.UserPoolClients.length > 0) {
                    console.log('App Client ID:', clients.UserPoolClients[0].ClientId);

                    console.log('\n📝 Add these to your .env file:');
                    console.log(`AWS_COGNITO_USER_POOL_ID=${existingPool.Id}`);
                    console.log(`AWS_COGNITO_CLIENT_ID=${clients.UserPoolClients[0].ClientId}`);
                    console.log(`AWS_COGNITO_REGION=${process.env.AWS_REGION || 'ap-south-1'}`);
                }
            }
        } else {
            console.error('❌ Error:', error.message);
            throw error;
        }
    }
}

setupCognito();
