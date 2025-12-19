import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export type CartItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
};

type CartState = {
  items: CartItem[];
};

const initialState: CartState = {
  items: [],
};

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    addItem(
      state,
      action: PayloadAction<{ id: string; name: string; price: number }>
    ) {
      const existing = state.items.find((i) => i.id === action.payload.id);
      if (existing) {
        existing.quantity += 1;
      } else {
        state.items.push({ ...action.payload, quantity: 1 });
      }
    },
    removeOne(state, action: PayloadAction<{ id: string }>) {
      const item = state.items.find((i) => i.id === action.payload.id);
      if (!item) return;
      item.quantity -= 1;
      if (item.quantity <= 0) {
        state.items = state.items.filter((i) => i.id !== action.payload.id);
      }
    },
    clearCart(state) {
      state.items = [];
    },
  },
});

export const { addItem, removeOne, clearCart } = cartSlice.actions;
export const cartReducer = cartSlice.reducer;
