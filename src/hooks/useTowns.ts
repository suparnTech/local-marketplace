// src/hooks/useTowns.ts
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';

interface Town {
    id: string;
    name: string;
    state: string;
}

export const useTowns = () => {
    return useQuery({
        queryKey: ['towns'],
        queryFn: async () => {
            const response = await api.get<Town[]>('/api/towns');
            return response.data;
        },
        staleTime: 1000 * 60 * 30, // 30 minutes - towns very stable
        cacheTime: 1000 * 60 * 60, // 1 hour in cache
    });
};

export const useNearestTown = () => {
    return useQuery({
        queryKey: ['towns', 'nearest'],
        queryFn: async () => {
            const response = await api.get('/api/towns/nearest');
            return response.data;
        },
        staleTime: 1000 * 60 * 30, // 30 minutes
        cacheTime: 1000 * 60 * 60,
    });
};
