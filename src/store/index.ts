// src/store/index.ts
import { configureStore } from "@reduxjs/toolkit";
import addressReducer from "./slices/addressSlice";
import { cartReducer } from "./slices/cartSlice";
import locationReducer from "./slices/locationSlice";
import { ordersReducer } from "./slices/ordersSlice";
import { storesReducer } from "./slices/storesSlice";

export const store = configureStore({
  reducer: {
    cart: cartReducer,
    stores: storesReducer,
    orders: ordersReducer,
    location: locationReducer,
    address: addressReducer,
  },
  middleware: (getDefault) =>
    getDefault({
      serializableCheck: false,
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
