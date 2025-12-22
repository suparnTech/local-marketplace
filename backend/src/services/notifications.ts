import * as admin from 'firebase-admin';
import { pool } from '../lib/db';

let firebaseInitialized = false;

try {
    // Note: In production, you would place your service-account.json in the root and point to it.
    // For now, we will attempt to initialize with default credentials or environment variables.
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
        firebaseInitialized = true;
        console.log('✅ Firebase Admin initialized successfully');
    } else {
        console.warn('⚠️ FIREBASE_SERVICE_ACCOUNT not found. Push notifications will be logged to console only.');
    }
} catch (error) {
    console.error('❌ Firebase initialization error:', error);
}

export const sendPushNotification = async (userId: string, title: string, body: string, data?: any) => {
    try {
        // Fetch push token from DB
        const result = await pool.query('SELECT push_token FROM users WHERE id = $1', [userId]);
        const token = result.rows[0]?.push_token;

        if (!token) {
            console.log(`ℹ️ No push token for user ${userId}. Skipping push.`);
            return;
        }

        if (firebaseInitialized) {
            const message = {
                notification: { title, body },
                data: data || {},
                token: token
            };

            const response = await admin.messaging().send(message);
            console.log('🚀 Push notification sent successfully:', response);
        } else {
            console.log('📱 [MOCK PUSH]', { userId, title, body, data });
        }
    } catch (error) {
        console.error('❌ Error sending push notification:', error);
    }
};
