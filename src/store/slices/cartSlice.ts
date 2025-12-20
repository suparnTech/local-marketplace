// src/store/slices/cartSlice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export type CartItem = {
  id: string;
  product_id: string;
  shop_id: string; // Legacy field
  store_id: string; // New field for orders
  shop_name: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  selected_variant?: any;
};

type CartState = {
  items: CartItem[];
  total: number;
};

const initialState: CartState = {
  items: [],
  total: 0,
};

const calculateTotal = (items: CartItem[]) => {
  return items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
};

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    addToCart(state, action: PayloadAction<CartItem>) {
      const existingItem = state.items.find(
        item => item.product_id === action.payload.product_id &&
          JSON.stringify(item.selected_variant) === JSON.stringify(action.payload.selected_variant)
      );

      if (existingItem) {
        existingItem.quantity += action.payload.quantity;
      } else {
        state.items.push(action.payload);
      }

      state.total = calculateTotal(state.items);
    },

    updateQuantity(state, action: PayloadAction<{ id: string; quantity: number }>) {
      const item = state.items.find(item => item.id === action.payload.id);
      if (item) {
        item.quantity = action.payload.quantity;
        state.total = calculateTotal(state.items);
      }
    },

    removeFromCart(state, action: PayloadAction<string>) {
      state.items = state.items.filter(item => item.id !== action.payload);
      state.total = calculateTotal(state.items);
    },

    clearCart(state) {
      state.items = [];
      state.total = 0;
    },
  },
});

export const { addToCart, updateQuantity, removeFromCart, clearCart } = cartSlice.actions;
export const cartReducer = cartSlice.reducer;
export default cartSlice.reducer;
