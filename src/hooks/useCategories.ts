// src/hooks/useCategories.ts
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';

interface Category {
    id: string;
    name: string;
    slug: string;
    icon: string;
    color: string;
}

export const useCategories = () => {
    return useQuery({
        queryKey: ['categories'],
        queryFn: async () => {
            const response = await api.get<Category[]>('/api/categories');
            return response.data;
        },
        staleTime: 1000 * 60 * 15, // 15 minutes - categories rarely change
        cacheTime: 1000 * 60 * 30, // 30 minutes in cache
    });
};
