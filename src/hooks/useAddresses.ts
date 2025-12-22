// src/hooks/useAddresses.ts
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';

export interface Address {
    id: string;
    user_id: string;
    name: string;
    phone: string;
    address_line1: string;
    address_line2?: string;
    city: string;
    state: string;
    pincode: string;
    latitude?: number;
    longitude?: number;
    is_default: boolean;
}

export const useAddresses = (enabled = true) => {
    return useQuery({
        queryKey: ['addresses'],
        queryFn: async () => {
            const response = await api.get<Address[]>('/api/addresses');
            return response.data;
        },
        staleTime: 1000 * 60 * 2, // 2 minutes - addresses change occasionally
        cacheTime: 1000 * 60 * 10, // 10 minutes in cache
        enabled,
    });
};
