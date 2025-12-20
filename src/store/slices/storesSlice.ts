// src/store/slices/storesSlice.ts
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { api } from "../../lib/api";

interface Store {
    id: string;
    name: string;
    address: string;
    city: string;
    pincode: string;
    category: string;
    description?: string;
    imageUrl?: string;
    lat?: number;
    lng?: number;
    avgRating?: number;
    reviewCount?: number;
    isVerified: boolean;
    isActive: boolean;
}

interface StoresState {
    stores: Store[];
    selectedStore: Store | null;
    loading: boolean;
    error: string | null;
    filters: {
        city?: string;
        category?: string;
        search?: string;
    };
}

const initialState: StoresState = {
    stores: [],
    selectedStore: null,
    loading: false,
    error: null,
    filters: {},
};

// Async thunks
export const fetchStores = createAsyncThunk(
    "stores/fetchStores",
    async (filters: { city?: string; category?: string; search?: string }) => {
        const params = new URLSearchParams();
        if (filters.city) params.append("city", filters.city);
        if (filters.category) params.append("category", filters.category);
        if (filters.search) params.append("search", filters.search);

        const response = await api.get(`/stores?${params.toString()}`);
        return response.data;
    }
);

export const fetchStoreById = createAsyncThunk(
    "stores/fetchStoreById",
    async (id: string) => {
        const response = await api.get(`/stores/${id}`);
        return response.data;
    }
);

const storesSlice = createSlice({
    name: "stores",
    initialState,
    reducers: {
        setFilters: (state, action: PayloadAction<StoresState["filters"]>) => {
            state.filters = action.payload;
        },
        clearSelectedStore: (state) => {
            state.selectedStore = null;
        },
    },
    extraReducers: (builder) => {
        builder
            // Fetch stores
            .addCase(fetchStores.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchStores.fulfilled, (state, action) => {
                state.loading = false;
                state.stores = action.payload;
            })
            .addCase(fetchStores.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || "Failed to fetch stores";
            })
            // Fetch store by ID
            .addCase(fetchStoreById.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchStoreById.fulfilled, (state, action) => {
                state.loading = false;
                state.selectedStore = action.payload;
            })
            .addCase(fetchStoreById.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || "Failed to fetch store";
            });
    },
});

export const { setFilters, clearSelectedStore } = storesSlice.actions;
export const storesReducer = storesSlice.reducer;
