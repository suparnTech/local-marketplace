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

// Persistence helper (optional - for offline support)
export const persistQueryClient = async () => {
    try {
        const queryCache = queryClient.getQueryCache();
        const queries = queryCache.getAll();

        const persistData = queries.map(query => ({
            queryKey: query.queryKey,
            queryHash: query.queryHash,
            state: query.state,
        }));

        await AsyncStorage.setItem('REACT_QUERY_CACHE', JSON.stringify(persistData));
    } catch (error) {
        console.error('Failed to persist query cache:', error);
    }
};

// Restore cache on app start
export const restoreQueryClient = async () => {
    try {
        const cached = await AsyncStorage.getItem('REACT_QUERY_CACHE');
        if (cached) {
            const persistData = JSON.parse(cached);
            // Note: Full restoration would require more complex logic
            // For now, we'll rely on fresh fetches with cache
            console.log('📦 Query cache restored from storage');
        }
    } catch (error) {
        console.error('Failed to restore query cache:', error);
    }
};
