import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React from "react";
import { Provider } from "react-redux";
import { AuthProvider } from "../src/contexts/AuthContext";
import { store } from "../src/store";

export default function RootLayout() {
  return (
    <Provider store={store}>
      <AuthProvider>
        <StatusBar style="light" />
        <Stack screenOptions={{ headerShown: false }}>
          {/* Root index with auth check */}
          <Stack.Screen name="index" />

          {/* Welcome & Auth */}
          <Stack.Screen name="welcome" />
          <Stack.Screen name="auth/login" />
          <Stack.Screen name="auth/register" />

          {/* Onboarding */}
          <Stack.Screen name="select-town" />

          {/* Customer Tabs */}
          <Stack.Screen name="(tabs)" />

          {/* Customer Screens */}
          <Stack.Screen name="shops" />
          <Stack.Screen name="shop/[id]" />
          <Stack.Screen name="checkout" />
          <Stack.Screen name="addresses" />
          <Stack.Screen name="address-form" />
          <Stack.Screen name="store/[id]" />
          <Stack.Screen name="order/[id]" />

          {/* Store Owner */}
          <Stack.Screen name="store-owner/dashboard" />

          {/* Admin */}
          <Stack.Screen name="admin/dashboard" />
        </Stack>
      </AuthProvider>
    </Provider>
  );
}
