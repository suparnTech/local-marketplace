// Redux slice for address management
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface Address {
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
    is_deleted: boolean;
    created_at: string;
    updated_at: string;
}

interface AddressState {
    addresses: Address[];
    selectedAddress: Address | null;
    loading: boolean;
}

const initialState: AddressState = {
    addresses: [],
    selectedAddress: null,
    loading: false,
};

const addressSlice = createSlice({
    name: 'address',
    initialState,
    reducers: {
        setAddresses: (state, action: PayloadAction<Address[]>) => {
            state.addresses = action.payload;
            // Auto-select default address if none selected
            if (!state.selectedAddress && action.payload.length > 0) {
                const defaultAddr = action.payload.find(addr => addr.is_default);
                state.selectedAddress = defaultAddr || action.payload[0];
            }
        },
        addAddress: (state, action: PayloadAction<Address>) => {
            state.addresses.push(action.payload);
            // If this is the first address or marked as default, select it
            if (action.payload.is_default || state.addresses.length === 1) {
                state.selectedAddress = action.payload;
            }
        },
        updateAddress: (state, action: PayloadAction<Address>) => {
            const index = state.addresses.findIndex(addr => addr.id === action.payload.id);
            if (index !== -1) {
                state.addresses[index] = action.payload;
                if (state.selectedAddress?.id === action.payload.id) {
                    state.selectedAddress = action.payload;
                }
            }
        },
        removeAddress: (state, action: PayloadAction<string>) => {
            state.addresses = state.addresses.filter(addr => addr.id !== action.payload);
            if (state.selectedAddress?.id === action.payload) {
                state.selectedAddress = state.addresses[0] || null;
            }
        },
        selectAddress: (state, action: PayloadAction<Address>) => {
            state.selectedAddress = action.payload;
        },
        setLoading: (state, action: PayloadAction<boolean>) => {
            state.loading = action.payload;
        },
        clearAddresses: (state) => {
            state.addresses = [];
            state.selectedAddress = null;
        },
    },
});

export const {
    setAddresses,
    addAddress,
    updateAddress,
    removeAddress,
    selectAddress,
    setLoading,
    clearAddresses,
} = addressSlice.actions;

export default addressSlice.reducer;
