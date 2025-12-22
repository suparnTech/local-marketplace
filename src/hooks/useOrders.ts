// src/hooks/useOrders.ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';

interface Order {
    id: string;
    status: string;
    total_amount: number;
    created_at: string;
    items?: any[];
    // Joined address properties
    name: string;
    phone: string;
    address_line1: string;
    address_line2?: string;
    city: string;
    state: string;
    pincode: string;
    // Joined shop properties
    shop_name: string;
    shop_logo?: string;
    shop_phone?: string;
    // Billing info
    delivery_fee?: number;
    tax_amount?: number;
    discount_amount?: number;
    payment_method?: string;
}

export const useOrders = () => {
    return useQuery({
        queryKey: ['orders'],
        queryFn: async () => {
            const response = await api.get<Order[]>('/api/orders');
            return response.data;
        },
        staleTime: 1000 * 60 * 2, // 2 minutes - orders change frequently
        cacheTime: 1000 * 60 * 5, // 5 minutes in cache
    });
};

export const useOrder = (orderId: string | undefined) => {
    return useQuery({
        queryKey: ['orders', orderId],
        queryFn: async () => {
            if (!orderId) throw new Error('Order ID is required');
            const response = await api.get<Order>(`/api/orders/${orderId}`);
            return response.data;
        },
        enabled: !!orderId,
        staleTime: 1000 * 60 * 2, // 2 minutes
        cacheTime: 1000 * 60 * 5,
    });
};

// Mutation for canceling orders
export const useCancelOrder = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (orderId: string) => {
            const response = await api.put(`/api/orders/${orderId}/cancel`);
            return response.data;
        },
        onSuccess: (_, orderId) => {
            // Invalidate orders list and specific order
            queryClient.invalidateQueries({ queryKey: ['orders'] });
            queryClient.invalidateQueries({ queryKey: ['orders', orderId] });
        },
    });
};
