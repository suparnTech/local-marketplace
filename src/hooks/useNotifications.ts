import * as Haptics from 'expo-haptics';
import { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { api } from '../lib/api';
import { getSocket } from '../lib/socket';

export const useNotifications = (userId?: string, initialShopId?: string, role?: string) => {
    const [shopId, setShopId] = useState(initialShopId);

    // Auto-fetch shopId for STORE_OWNER
    useEffect(() => {
        if (role === 'STORE_OWNER' && !shopId && userId) {
            api.get('/api/shop-owner/profile').then(res => {
                console.log(`💬 Auto-fetched shopId: ${res.data.id}`);
                setShopId(res.data.id);
            }).catch(err => console.error('Failed to auto-fetch shopId for notifications:', err));
        }
    }, [userId, role]);

    // Socket room joining + event listeners
    useEffect(() => {
        if (!userId) return;

        const socket = getSocket();

        const joinRooms = () => {
            // Always join customer room
            socket.emit('join_customer', userId);
            console.log(`💬 Hook: Joined customer room for ${userId}`);

            // Join shop room if applicable
            if (shopId) {
                socket.emit('join_shop', shopId);
                console.log(`💬 Hook: Joined shop room for ${shopId}`);
            }
        };

        // Join rooms immediately
        joinRooms();

        // Re-join rooms on reconnect (critical for when connection drops)
        socket.on('connect', joinRooms);

        // Use named handlers so we don't remove other listeners on cleanup
        const handleNewOrder = (data: any) => {
            console.log('🔔 New Order Received:', data);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

            Alert.alert(
                '💰 New Order!',
                `You have a new order of ₹${data.totalAmount} from ${data.customerName}.`,
                [{ text: 'View Order', onPress: () => { } }]
            );
        };

        const handleOrderStatusUpdate = (data: any) => {
            console.log('📦 Order Status Update:', data);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);

            Alert.alert(
                data.title || 'Order Update',
                data.message || `Your order #${data.orderId.slice(0, 8)} status has changed.`,
                [{ text: 'OK' }]
            );
        };

        // Listen for new orders (Shop Owner)
        socket.on('new_order', handleNewOrder);

        // Listen for order status updates (Customer)
        socket.on('order_status_update', handleOrderStatusUpdate);

        return () => {
            socket.off('connect', joinRooms);
            socket.off('new_order', handleNewOrder);
            socket.off('order_status_update', handleOrderStatusUpdate);
        };
    }, [userId, shopId]);
};
