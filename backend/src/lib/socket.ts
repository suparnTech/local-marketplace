import { Server as HttpServer } from 'http';
import { Server } from 'socket.io';

let io: Server;

export const initSocket = (server: HttpServer) => {
    io = new Server(server, {
        cors: {
            origin: '*',
            methods: ['GET', 'POST'],
        },
    });

    console.log('📶 Socket.io initialized');

    io.on('connection', (socket) => {
        console.log('👤 User connected:', socket.id);

        // Shop owner listens for new orders in their shop
        socket.on('join_shop', (shopId: string) => {
            socket.join(`shop_${shopId}`);
            console.log(`🏪 User joined shop room: shop_${shopId}`);
        });

        // Customer listens for order status updates 
        socket.on('join_customer', (userId: string) => {
            socket.join(`customer_${userId}`);
            console.log(`👤 User joined customer room: customer_${userId}`);
        });

        // Delivery partner listens for new available orders in their city
        socket.on('join_delivery_partner', (partnerId: string) => {
            socket.join(`delivery_partner_${partnerId}`);
            console.log(`🚴 Delivery partner joined room: delivery_partner_${partnerId}`);
        });

        // Delivery partner joins city room to receive new order broadcasts
        socket.on('join_city', (city: string) => {
            const normalizedCity = city.toLowerCase().replace(/\s+/g, '_');
            socket.join(`city_${normalizedCity}`);
            console.log(`🏙️ User joined city room: city_${normalizedCity}`);
        });

        socket.on('disconnect', () => {
            console.log('👤 User disconnected:', socket.id);
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

// Notify shop owner of new order
export const emitNewOrder = (shopId: string, orderData: any) => {
    if (io) {
        io.to(`shop_${shopId}`).emit('new_order', orderData);
        console.log(`📢 Emitted new_order to shop_${shopId}`);
    }
};

// Notify customer of order status change
export const emitOrderStatusUpdate = (customerId: string, orderData: any) => {
    if (io) {
        io.to(`customer_${customerId}`).emit('order_status_update', orderData);
        console.log(`📢 Emitted order_status_update to customer_${customerId}`);
    }
};

// Notify all available delivery partners in a city of a new order
export const emitNewOrderToDeliveryPartners = (city: string, orderData: any) => {
    if (io) {
        const normalizedCity = city.toLowerCase().replace(/\s+/g, '_');
        io.to(`city_${normalizedCity}`).emit('new_order_available', orderData);
        console.log(`📢 Emitted new_order_available to city_${normalizedCity}`);
    }
};

// Notify a specific delivery partner (e.g. assignment confirmed)
export const emitToDeliveryPartner = (partnerId: string, event: string, data: any) => {
    if (io) {
        io.to(`delivery_partner_${partnerId}`).emit(event, data);
        console.log(`📢 Emitted ${event} to delivery_partner_${partnerId}`);
    }
};
