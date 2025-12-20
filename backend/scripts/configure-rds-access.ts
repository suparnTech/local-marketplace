// scripts/configure-rds-access.ts
import AWS from 'aws-sdk';
import dotenv from 'dotenv';
import https from 'https';

dotenv.config();

const ec2 = new AWS.EC2({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION || 'ap-south-1',
});

const rds = new AWS.RDS({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION || 'ap-south-1',
});

async function getMyIP(): Promise<string> {
    return new Promise((resolve, reject) => {
        https.get('https://api.ipify.org', (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => resolve(data));
        }).on('error', reject);
    });
}

async function configureAccess() {
    console.log('Configuring RDS security group for access...\n');

    try {
        // Get your public IP
        const myIP = await getMyIP();
        console.log('Your IP:', myIP);

        // Get RDS instance details
        const dbInfo = await rds.describeDBInstances({
            DBInstanceIdentifier: 'local-marketplace-db',
        }).promise();

        const securityGroups = dbInfo.DBInstances?.[0]?.VpcSecurityGroups;
        if (!securityGroups || securityGroups.length === 0) {
            throw new Error('No security groups found');
        }

        const securityGroupId = securityGroups[0].VpcSecurityGroupId!;
        console.log('Security Group ID:', securityGroupId);

        // Add inbound rule to allow PostgreSQL from your IP
        await ec2.authorizeSecurityGroupIngress({
            GroupId: securityGroupId,
            IpPermissions: [{
                IpProtocol: 'tcp',
                FromPort: 5432,
                ToPort: 5432,
                IpRanges: [{
                    CidrIp: `${myIP}/32`,
                    Description: 'Allow PostgreSQL from my IP',
                }],
            }],
        }).promise();

        console.log('\n✅ Security group updated!');
        console.log(`✅ PostgreSQL access allowed from ${myIP}`);
        console.log('\n🔗 You can now connect to your database!');

    } catch (error: any) {
        if (error.code === 'InvalidPermission.Duplicate') {
            console.log('✅ Security rule already exists. Access is already configured!');
        } else {
            console.error('❌ Error:', error.message);
            throw error;
        }
    }
}

configureAccess();
