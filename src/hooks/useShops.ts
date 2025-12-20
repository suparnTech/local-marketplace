// src/hooks/useShops.ts
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';

interface Shop {
    id: string;
    name: string;
    logo_url?: string;
    rating: number;
    category_name: string;
    town_name: string;
    status: string;
}

interface UseShopsOptions {
    categoryId?: string;
    townId?: string;
    search?: string;
    enabled?: boolean;
}

export const useShops = (options: UseShopsOptions = {}) => {
    const { categoryId, townId, search, enabled = true } = options;

    return useQuery({
        queryKey: ['shops', { categoryId, townId, search }],
        queryFn: async () => {
            const params: any = {};
            if (categoryId) params.category_id = categoryId;
            if (townId) params.town_id = townId;
            if (search) params.search = search;
            params.sort = 'rating';

            const response = await api.get<Shop[]>('/api/shops', { params });
            return response.data;
        },
        staleTime: 1000 * 60 * 5, // 5 minutes
        cacheTime: 1000 * 60 * 10, // 10 minutes in cache
        enabled, // Allow conditional fetching
    });
};
