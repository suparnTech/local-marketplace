// app/admin/_layout.tsx
// Admin Panel Layout

import { Stack } from 'expo-router';
import React from 'react';

export default function AdminLayout() {
    return (
        <Stack
            screenOptions={{
                headerShown: false,
                animation: 'slide_from_right',
            }}
        >
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="kyc-review/[shopId]" />
        </Stack>
    );
}
