// src/hooks/useShopDetail.ts
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';

interface Shop {
    id: string;
    name: string;
    description?: string;
    logo_url?: string;
    cover_image_url?: string;
    rating: number;
    category_name: string;
    town_name: string;
    address_line1?: string;
    phone?: string;
    status: string;
}

interface Product {
    id: string;
    name: string;
    description?: string;
    price: number;
    images: string[];
    rating: number;
    stock_quantity: number;
    shop_id?: string;
    store_id?: string;
    shop_name?: string;
}

export const useShopDetail = (shopId: string | undefined) => {
    return useQuery({
        queryKey: ['shop', shopId],
        queryFn: async () => {
            if (!shopId) throw new Error('Shop ID is required');
            const response = await api.get<Shop>(`/api/shops/${shopId}`);
            return response.data;
        },
        enabled: !!shopId,
        staleTime: 1000 * 60 * 5, // 5 minutes
        cacheTime: 1000 * 60 * 10, // 10 minutes
    });
};

export const useShopProducts = (shopId: string | undefined) => {
    return useQuery({
        queryKey: ['shop', shopId, 'products'],
        queryFn: async () => {
            if (!shopId) throw new Error('Shop ID is required');
            const response = await api.get<Product[]>(`/api/shops/${shopId}/products`);
            return response.data;
        },
        enabled: !!shopId,
        staleTime: 1000 * 60 * 2, // 2 minutes - products change more frequently
        cacheTime: 1000 * 60 * 5, // 5 minutes
    });
};
