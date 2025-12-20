// src/store/slices/ordersSlice.ts
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { api } from "../../lib/api";

interface OrderItem {
    productId: string;
    name: string;
    quantity: number;
    price: number;
    unit: string;
}

interface Order {
    id: string;
    userId: string;
    storeId: string;
    status: string;
    totalPrice: number;
    items: OrderItem[];
    deliveryAddress: string;
    deliveryCity?: string;
    deliveryPincode?: string;
    notes?: string;
    createdAt: string;
    updatedAt: string;
    store?: {
        id: string;
        name: string;
        address: string;
        city: string;
    };
}

interface OrdersState {
    orders: Order[];
    selectedOrder: Order | null;
    loading: boolean;
    error: string | null;
}

const initialState: OrdersState = {
    orders: [],
    selectedOrder: null,
    loading: false,
    error: null,
};

// Async thunks
export const fetchOrders = createAsyncThunk(
    "orders/fetchOrders",
    async (status?: string) => {
        const params = status ? `?status=${status}` : "";
        const response = await api.get(`/orders${params}`);
        return response.data;
    }
);

export const fetchOrderById = createAsyncThunk(
    "orders/fetchOrderById",
    async (id: string) => {
        const response = await api.get(`/orders/${id}`);
        return response.data;
    }
);

export const createOrder = createAsyncThunk(
    "orders/createOrder",
    async (orderData: {
        storeId: string;
        items: OrderItem[];
        deliveryAddress: string;
        deliveryCity?: string;
        deliveryPincode?: string;
        notes?: string;
    }) => {
        const response = await api.post("/orders", orderData);
        return response.data;
    }
);

const ordersSlice = createSlice({
    name: "orders",
    initialState,
    reducers: {
        clearSelectedOrder: (state) => {
            state.selectedOrder = null;
        },
    },
    extraReducers: (builder) => {
        builder
            // Fetch orders
            .addCase(fetchOrders.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchOrders.fulfilled, (state, action) => {
                state.loading = false;
                state.orders = action.payload;
            })
            .addCase(fetchOrders.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || "Failed to fetch orders";
            })
            // Fetch order by ID
            .addCase(fetchOrderById.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchOrderById.fulfilled, (state, action) => {
                state.loading = false;
                state.selectedOrder = action.payload;
            })
            .addCase(fetchOrderById.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || "Failed to fetch order";
            })
            // Create order
            .addCase(createOrder.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(createOrder.fulfilled, (state, action) => {
                state.loading = false;
                state.orders.unshift(action.payload);
            })
            .addCase(createOrder.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || "Failed to create order";
            });
    },
});

export const { clearSelectedOrder } = ordersSlice.actions;
export const ordersReducer = ordersSlice.reducer;
