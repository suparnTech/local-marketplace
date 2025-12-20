// src/store/slices/locationSlice.ts
// Redux slice for location/town management

import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface Town {
    id: string;
    name: string;
    state: string;
    district?: string;
    pincode?: string;
    latitude?: number;
    longitude?: number;
}

interface LocationState {
    selectedTown: Town | null;
    recentTowns: Town[];
    userLocation: {
        latitude: number | null;
        longitude: number | null;
    };
}

const initialState: LocationState = {
    selectedTown: null,
    recentTowns: [],
    userLocation: {
        latitude: null,
        longitude: null,
    },
};

const locationSlice = createSlice({
    name: 'location',
    initialState,
    reducers: {
        setSelectedTown: (state, action: PayloadAction<Town>) => {
            state.selectedTown = action.payload;

            // Add to recent towns (max 5)
            const exists = state.recentTowns.find(t => t.id === action.payload.id);
            if (!exists) {
                state.recentTowns = [action.payload, ...state.recentTowns].slice(0, 5);
            }
        },
        setUserLocation: (state, action: PayloadAction<{ latitude: number; longitude: number }>) => {
            state.userLocation = action.payload;
        },
        clearSelectedTown: (state) => {
            state.selectedTown = null;
        },
    },
});

export const { setSelectedTown, setUserLocation, clearSelectedTown } = locationSlice.actions;
export default locationSlice.reducer;
