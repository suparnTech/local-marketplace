// src/components/StoreCard.tsx
import { Link } from "expo-router";
import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { useTheme } from "../theme/useTheme";
import { Card } from "./ui/Card";
import { Text } from "./ui/Text";

interface StoreCardProps {
    store: {
        id: string;
        name: string;
        address: string;
        city: string;
        category: string;
        avgRating?: number;
        reviewCount?: number;
        isVerified?: boolean;
    };
}

export function StoreCard({ store }: StoreCardProps) {
    const { spacing, colors } = useTheme();

    return (
        <Link href={`/store/${store.id}`} asChild>
            <TouchableOpacity>
                <Card style={styles.card}>
                    <View style={styles.header}>
                        <View style={{ flex: 1 }}>
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                                <Text variant="subheading">{store.name}</Text>
                                {store.isVerified && (
                                    <View style={[styles.badge, { backgroundColor: colors.primary }]}>
                                        <Text variant="small" style={{ color: "#fff" }}>✓</Text>
                                    </View>
                                )}
                            </View>
                            <Text variant="small" muted style={{ marginTop: 4 }}>
                                {store.category}
                            </Text>
                        </View>
                        {store.avgRating && store.avgRating > 0 && (
                            <View style={styles.rating}>
                                <Text variant="body">⭐ {store.avgRating.toFixed(1)}</Text>
                                {store.reviewCount && store.reviewCount > 0 && (
                                    <Text variant="small" muted>
                                        ({store.reviewCount})
                                    </Text>
                                )}
                            </View>
                        )}
                    </View>
                    <Text variant="small" muted style={{ marginTop: spacing.sm }}>
                        📍 {store.address}, {store.city}
                    </Text>
                </Card>
            </TouchableOpacity>
        </Link>
    );
}

const styles = StyleSheet.create({
    card: {
        marginBottom: 12,
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
    },
    badge: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 10,
    },
    rating: {
        alignItems: "flex-end",
    },
});
