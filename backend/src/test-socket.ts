import { io } from 'socket.io-client';

const SOCKET_URL = 'http://localhost:4000';
const TEST_SHOP_ID = 'test-shop-123';

console.log('🧪 Starting Real-time Sync Test...');
const socket = io(SOCKET_URL, {
    transports: ['websocket']
});

socket.on('connect', () => {
    console.log('✅ Connected to Socket Server');

    // Join shop room
    socket.emit('join_shop', TEST_SHOP_ID);
    console.log(`📡 Joined shop room: shop_${TEST_SHOP_ID}`);
    console.log('⏳ Waiting for "new_order" event... (Keep this running)');
});

socket.on('new_order', (data) => {
    console.log('🚀 SUCCESS: Real-time Order Received!');
    console.log('📦 Data:', JSON.stringify(data, null, 2));
    process.exit(0);
});

socket.on('connect_error', (err) => {
    console.error('❌ Connection error:', err.message);
});

// Timeout after 60s
setTimeout(() => {
    console.log('⏱️ Test timed out after 60s.');
    process.exit(1);
}, 60000);
