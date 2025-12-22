// app/shop-owner/_layout.tsx
// Shop Owner App Layout

import { Stack } from 'expo-router';
import React from 'react';

export default function ShopOwnerLayout() {
    return (
        <Stack
            screenOptions={{
                headerShown: false,
                animation: 'slide_from_right',
            }}
        >
            <Stack.Screen name="login" />
            <Stack.Screen name="register" />
            <Stack.Screen name="kyc-upload" />
            <Stack.Screen name="pending-approval" />
            <Stack.Screen name="(tabs)" />
        </Stack>
    );
}
