// src/hooks/useShopOwner.ts
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';

export interface ShopOwnerProfile {
    id: string;
    name: string;
    email: string;
    phone?: string;
    businessName?: string;
    ownerName?: string;
    whatsappNumber?: string;
    isOpen?: boolean;
    shop: {
        id: string;
        name: string;
        description: string;
        logo_url?: string;
        is_featured: boolean;
        status: string;
    };
    address?: {
        line1: string;
        line2?: string;
        pincode: string;
    };
    category?: {
        id: string;
        name: string;
    };
    operational?: {
        openingHours: any;
        weeklyOff: string[];
        deliveryRadius: number;
        minimumOrderValue: number;
    };
    media?: {
        logo?: string;
        cover?: string;
    };
    verification?: {
        status: string;
        isApproved: boolean;
    };
    stats?: {
        rating: number;
        totalReviews: number;
        totalOrders: number;
        viewCount?: number;
    };
}

export const useShopOwnerProfile = (enabled = true) => {
    return useQuery({
        queryKey: ['shop-owner', 'profile'],
        queryFn: async () => {
            const response = await api.get<ShopOwnerProfile>('/api/shop-owner/profile');
            return response.data;
        },
        staleTime: 1000 * 60 * 10, // 10 minutes
        cacheTime: 1000 * 60 * 30, // 30 minutes
        enabled,
    });
};

export const useShopOwnerAnalytics = (enabled = true) => {
    return useQuery({
        queryKey: ['shop-owner', 'analytics'],
        queryFn: async () => {
            const response = await api.get('/api/shop-owner/analytics');
            return response.data;
        },
        staleTime: 1000 * 60 * 5, // 5 minutes
        cacheTime: 1000 * 60 * 15, // 15 minutes
        enabled,
    });
};

export const useShopOwnerCoupons = (enabled = true) => {
    return useQuery({
        queryKey: ['shop-owner', 'coupons'],
        queryFn: async () => {
            const response = await api.get('/api/shop-owner/growth/coupons');
            return response.data;
        },
        staleTime: 1000 * 60 * 5, // 5 minutes
        cacheTime: 1000 * 60 * 15, // 15 minutes
        enabled,
    });
};

export interface ShopOwnerOrder {
    id: string;
    order_number: string;
    customer_name: string;
    total_amount: number;
    status: string;
    created_at: string;
    items: any[];
}

export const useShopOwnerOrders = (enabled = true) => {
    return useQuery({
        queryKey: ['shop-owner', 'orders'],
        queryFn: async () => {
            const response = await api.get('/api/shop-owner/orders');
            return response.data.orders || [];
        },
        staleTime: 1000 * 60 * 2, // 2 minutes (orders change frequently)
        cacheTime: 1000 * 60 * 10, // 10 minutes
        enabled,
    });
};

export interface ShopOwnerProduct {
    id: string;
    name: string;
    description: string;
    pricing: {
        shopPrice: number;
        customerPrice: number;
        commission: number;
        mrp?: number;
    };
    inventory: {
        stock: number;
        unit: string;
    };
    images: string[];
    isAvailable: boolean;
}

export const useShopOwnerProducts = (enabled = true) => {
    return useQuery({
        queryKey: ['shop-owner', 'products'],
        queryFn: async () => {
            const response = await api.get('/api/shop-owner/products');
            return response.data.products || [];
        },
        staleTime: 1000 * 60 * 5, // 5 minutes
        cacheTime: 1000 * 60 * 15, // 15 minutes
        enabled,
    });
};

// Detail screen hooks
export const useShopOwnerOrderDetail = (orderId: string | undefined, enabled = true) => {
    return useQuery({
        queryKey: ['shop-owner', 'order', orderId],
        queryFn: async () => {
            if (!orderId) throw new Error('Order ID is required');
            const response = await api.get(`/api/shop-owner/orders/${orderId}`);
            return response.data;
        },
        staleTime: 1000 * 60 * 1, // 1 minute (orders update frequently)
        cacheTime: 1000 * 60 * 5, // 5 minutes
        enabled: enabled && !!orderId,
    });
};

export const useShopOwnerProductDetail = (productId: string | undefined, enabled = true) => {
    return useQuery({
        queryKey: ['shop-owner', 'product', productId],
        queryFn: async () => {
            if (!productId) throw new Error('Product ID is required');
            const response = await api.get(`/api/shop-owner/products/${productId}`);
            return response.data;
        },
        staleTime: 1000 * 60 * 5, // 5 minutes
        cacheTime: 1000 * 60 * 15, // 15 minutes
        enabled: enabled && !!productId,
    });
};
