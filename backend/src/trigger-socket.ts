import { io } from 'socket.io-client';

const SOCKET_URL = 'http://localhost:4000';
const TEST_SHOP_ID = 'test-shop-123';

console.log('🚀 Triggering Real-time Event...');
const socket = io(SOCKET_URL, {
    transports: ['websocket']
});

socket.on('connect', () => {
    console.log('✅ Connected to Socket Server');

    const mockOrder = {
        orderId: 'ORD-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
        totalAmount: 1499,
        customerName: 'Test Customer',
        itemsCount: 3
    };

    console.log('📢 Emitting new_order to shop room...');
    // In actual app, the backend emits this. We are simulating the emission.
    // However, the client can't emit TO a room usually, the server does that.
    // So we'll hit our internal socket lib if we were on the server, 
    // but here we just want to prove the client-server connection works.

    // To properly test the flow, we should hit an API endpoint that triggers the emission.
    console.log('ℹ️ For a real E2E test, use the curl command provided in the walkthrough.');
    process.exit(0);
});
