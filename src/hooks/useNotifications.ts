import * as Haptics from 'expo-haptics';
import { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { api } from '../lib/api';
import { getSocket } from '../lib/socket';

export const useNotifications = (userId?: string, initialShopId?: string, role?: string) => {
    const [shopId, setShopId] = useState(initialShopId);

    useEffect(() => {
        if (!userId) return;

        // Auto-fetch shopId if user is a STORE_OWNER
        if (role === 'STORE_OWNER' && !shopId) {
            api.get('/api/shop-owner/profile').then(res => {
                setShopId(res.data.id);
            }).catch(err => console.error('Failed to auto-fetch shopId for notifications:', err));
        }

        const socket = getSocket();

        // Join customer room
        socket.emit('join_customer', userId);
        console.log(`💬 Hook: Joined customer room for ${userId}`);

        // Join shop room if applicable
        if (shopId) {
            socket.emit('join_shop', shopId);
            console.log(`💬 Hook: Joined shop room for ${shopId}`);
        }

        // Listen for new orders (Shop Owner)
        socket.on('new_order', (data) => {
            console.log('🔔 New Order Received:', data);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

            Alert.alert(
                '💰 New Order!',
                `You have a new order of ₹${data.totalAmount} from ${data.customerName}.`,
                [{ text: 'View Order', onPress: () => { } }] // We can add navigation logic here
            );
        });

        // Listen for order status updates (Customer)
        socket.on('order_status_update', (data) => {
            console.log('📦 Order Status Update:', data);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);

            Alert.alert(
                data.title || 'Order Update',
                data.message || `Your order #${data.orderId.slice(0, 8)} status has changed.`,
                [{ text: 'OK' }]
            );
        });

        return () => {
            socket.off('new_order');
            socket.off('order_status_update');
        };
    }, [userId, shopId]);
};
