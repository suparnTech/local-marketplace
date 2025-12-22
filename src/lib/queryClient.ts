// src/lib/queryClient.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { QueryClient } from '@tanstack/react-query';

// Create a client with React Native-safe defaults (v4 API)
export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            // Cache configuration (v4 uses cacheTime instead of gcTime)
            cacheTime: 1000 * 60 * 60 * 24, // 24 hours
            staleTime: 1000 * 60 * 5, // 5 minutes

            // Retry configuration
            retry: 2,
            retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),

            // Disable automatic refetching for React Native
            refetchOnWindowFocus: false,
            refetchOnReconnect: false,
            refetchOnMount: false,

            // Network mode
            networkMode: 'online',

            // Prevent structural sharing (v4 compatible)
            structuralSharing: false,
        },
        mutations: {
            retry: 1,
        },
    },
});

// Persistence helper
const CACHE_KEY = 'REACT_QUERY_OFFLINE_CACHE';

// Improved persistence that handles the structure more carefully
export const persistQueryClient = async (client: QueryClient) => {
    try {
        const cache = client.getQueryCache();
        const queries = cache.getAll();

        // We only persist queries that have data and are successful
        const dataToPersist = queries
            .filter(q => q.state.status === 'success' && q.state.data)
            .map(q => ({
                queryKey: q.queryKey,
                state: {
                    data: q.state.data,
                    dataUpdatedAt: q.state.dataUpdatedAt,
                }
            }));

        if (dataToPersist.length > 0) {
            await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(dataToPersist));
            // console.log(`💾 Persisted ${dataToPersist.length} queries`);
        }
    } catch (error) {
        console.error('Failed to persist query cache:', error);
    }
};

// Restore cache on app start
export const restoreQueryClient = async (client: QueryClient) => {
    try {
        const cached = await AsyncStorage.getItem(CACHE_KEY);
        if (cached) {
            const persistedData = JSON.parse(cached);

            persistedData.forEach((item: any) => {
                client.setQueryData(item.queryKey, item.state.data, {
                    updatedAt: item.state.dataUpdatedAt
                });
            });

            console.log(`📦 Restored ${persistedData.length} queries from storage`);
        }
    } catch (error) {
        console.error('Failed to restore query cache:', error);
    }
};
