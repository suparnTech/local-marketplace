import { Server as HttpServer } from 'http';
import { Server } from 'socket.io';

let io: Server;

export const initSocket = (server: HttpServer) => {
    io = new Server(server, {
        cors: {
            origin: '*', // In production, restrict this to your app's domain
            methods: ['GET', 'POST'],
        },
    });

    console.log('📶 Socket.io initialized');

    io.on('connection', (socket) => {
        console.log('👤 User connected:', socket.id);

        // Join a shop-specific room to receive targeted notifications
        socket.on('join_shop', (shopId: string) => {
            socket.join(`shop_${shopId}`);
            console.log(`🏪 User joined shop room: shop_${shopId}`);
        });

        // Join customer room
        socket.on('join_customer', (userId: string) => {
            socket.join(`customer_${userId}`);
            console.log(`👤 User joined customer room: customer_${userId}`);
        });

        socket.on('disconnect', () => {
            console.log('👤 User disconnected');
        });
    });

    return io;
};

export const getIO = () => {
    if (!io) {
        throw new Error('Socket.io not initialized!');
    }
    return io;
};

// Typed helpers for emitting events
export const emitNewOrder = (shopId: string, orderData: any) => {
    if (io) {
        io.to(`shop_${shopId}`).emit('new_order', orderData);
        console.log(`📢 Emitted new_order to shop_${shopId}`);
    }
};

export const emitOrderStatusUpdate = (customerId: string, orderData: any) => {
    if (io) {
        io.to(`customer_${customerId}`).emit('order_status_update', orderData);
        console.log(`📢 Emitted order_status_update to customer_${customerId}`);
    }
};
