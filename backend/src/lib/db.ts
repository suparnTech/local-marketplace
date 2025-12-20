// src/lib/db.ts
import dotenv from 'dotenv';
import { Pool } from 'pg';

dotenv.config();

if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is not set');
}

console.log('DATABASE_URL loaded:', process.env.DATABASE_URL ? `YES (${process.env.DATABASE_URL.substring(0, 30)}...)` : 'NO');

export const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false, // Required for AWS RDS
    },
});

// Test connection
pool.on('connect', () => {
    console.log('✅ Connected to PostgreSQL database');
});

pool.on('error', (err) => {
    console.error('❌ Unexpected database error:', err);
});

console.log('PostgreSQL pool initialized successfully');
