import { configureStore } from "@reduxjs/toolkit";
import { cartReducer } from "./slices/cartSlice";

export const store = configureStore({
  reducer: {
    cart: cartReducer,
  },
  middleware: (getDefault) =>
    getDefault({
      serializableCheck: false,
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
