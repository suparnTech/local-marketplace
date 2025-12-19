import React from "react";
import { Stack } from "expo-router";
import { Provider } from "react-redux";
import { store } from "../src/store";

export default function RootLayout() {
  return (
    <Provider store={store}>
      <Stack screenOptions={{ headerShown: false }}>
        {/* Tabs are the main app */}
        <Stack.Screen name="(tabs)" />

        {/* Keep these as nested routes that still render inside same tree */}
        <Stack.Screen name="store/[id]" />
        <Stack.Screen name="checkout/index" />
        <Stack.Screen name="order/[id]" />
      </Stack>
    </Provider>
  );
}
