// scripts/setup-aws-rds.ts
import AWS from 'aws-sdk';
import dotenv from 'dotenv';

dotenv.config();

const rds = new AWS.RDS({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION || 'ap-south-1',
});

async function createRDSDatabase() {
    const dbInstanceIdentifier = 'local-marketplace-db';
    const masterUsername = 'postgres';
    const masterPassword = 'LocalMarket2024!';
    const dbName = 'marketplace';

    console.log('Creating RDS PostgreSQL database in Mumbai (ap-south-1)...');

    try {
        const params: AWS.RDS.CreateDBInstanceMessage = {
            DBInstanceIdentifier: dbInstanceIdentifier,
            DBInstanceClass: 'db.t3.micro', // Free tier eligible
            Engine: 'postgres',
            EngineVersion: '16.11',
            MasterUsername: masterUsername,
            MasterUserPassword: masterPassword,
            AllocatedStorage: 20, // 20 GB
            DBName: dbName,
            PubliclyAccessible: true,
            BackupRetentionPeriod: 7,
            StorageType: 'gp2',
            VpcSecurityGroupIds: [], // Will use default VPC security group
        };

        const result = await rds.createDBInstance(params).promise();

        console.log('✅ RDS Database creation initiated!');
        console.log('Database Identifier:', dbInstanceIdentifier);
        console.log('Status:', result.DBInstance?.DBInstanceStatus);
        console.log('\n⏳ Database is being created... This takes 5-10 minutes.');
        console.log('\nWaiting for database to become available...');

        // Wait for database to be available
        await rds.waitFor('dBInstanceAvailable', {
            DBInstanceIdentifier: dbInstanceIdentifier,
        }).promise();

        // Get the endpoint
        const dbInfo = await rds.describeDBInstances({
            DBInstanceIdentifier: dbInstanceIdentifier,
        }).promise();

        const endpoint = dbInfo.DBInstances?.[0]?.Endpoint?.Address;
        const port = dbInfo.DBInstances?.[0]?.Endpoint?.Port || 5432;

        console.log('\n✅ Database is ready!');
        console.log('\n📝 Connection Details:');
        console.log('Endpoint:', endpoint);
        console.log('Port:', port);
        console.log('Database Name:', dbName);
        console.log('Username:', masterUsername);
        console.log('Password:', masterPassword);
        console.log('\n🔗 Connection String:');
        console.log(`postgresql://${masterUsername}:${masterPassword}@${endpoint}:${port}/${dbName}`);
        console.log('\n⚠️  Update your .env file with this DATABASE_URL');

    } catch (error: any) {
        if (error.code === 'DBInstanceAlreadyExists') {
            console.log('ℹ️  Database already exists. Fetching details...');

            const dbInfo = await rds.describeDBInstances({
                DBInstanceIdentifier: dbInstanceIdentifier,
            }).promise();

            const endpoint = dbInfo.DBInstances?.[0]?.Endpoint?.Address;
            const port = dbInfo.DBInstances?.[0]?.Endpoint?.Port || 5432;
            const status = dbInfo.DBInstances?.[0]?.DBInstanceStatus;

            console.log('\n📝 Existing Database Details:');
            console.log('Status:', status);
            console.log('Endpoint:', endpoint);
            console.log('Port:', port);
            console.log('\n🔗 Connection String:');
            console.log(`postgresql://${masterUsername}:${masterPassword}@${endpoint}:${port}/${dbName}`);
        } else {
            console.error('❌ Error creating database:', error.message);
            throw error;
        }
    }
}

createRDSDatabase().catch(console.error);
