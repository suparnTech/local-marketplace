// app/admin/(tabs)/_layout.tsx
// Admin Tabs Layout

import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';
import { colors } from '../../../src/theme/colors';

export default function AdminTabsLayout() {
    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarStyle: {
                    backgroundColor: '#0F1419',
                    borderTopColor: 'rgba(255, 255, 255, 0.1)',
                    borderTopWidth: 1,
                    height: 60,
                    paddingBottom: 8,
                },
                tabBarActiveTintColor: colors.primary,
                tabBarInactiveTintColor: colors.textMuted,
            }}
        >
            <Tabs.Screen
                name="pending"
                options={{
                    title: 'Pending',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="time-outline" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="approved"
                options={{
                    title: 'Approved',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="checkmark-circle-outline" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="rejected"
                options={{
                    title: 'Rejected',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="close-circle-outline" size={size} color={color} />
                    ),
                }}
            />
        </Tabs>
    );
}
