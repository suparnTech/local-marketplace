// src/components/ProductCard.tsx
import React from "react";
import { StyleSheet, View } from "react-native";
import { useDispatch } from "react-redux";
import { addItem } from "../store/slices/cartSlice";
import { useTheme } from "../theme/useTheme";
import { Button } from "./ui/Button";
import { Card } from "./ui/Card";
import { Text } from "./ui/Text";

interface ProductCardProps {
    product: {
        id: string;
        name: string;
        price: number;
        unit: string;
        isAvailable: boolean;
        description?: string;
    };
    storeId: string;
    storeName: string;
}

export function ProductCard({ product, storeId, storeName }: ProductCardProps) {
    const { spacing, colors } = useTheme();
    const dispatch = useDispatch();

    const handleAddToCart = () => {
        dispatch(
            addItem({
                id: product.id,
                name: product.name,
                price: product.price,
                unit: product.unit,
                storeId,
                storeName,
            })
        );
    };

    return (
        <Card style={styles.card}>
            <View style={styles.content}>
                <View style={{ flex: 1 }}>
                    <Text variant="body">{product.name}</Text>
                    {product.description && (
                        <Text variant="small" muted style={{ marginTop: 4 }}>
                            {product.description}
                        </Text>
                    )}
                    <Text variant="subheading" style={{ marginTop: spacing.sm, color: colors.primary }}>
                        ₹{product.price}/{product.unit}
                    </Text>
                </View>
                <View style={{ alignItems: "flex-end" }}>
                    {product.isAvailable ? (
                        <Button
                            title="Add"
                            onPress={handleAddToCart}
                            style={styles.addButton}
                        />
                    ) : (
                        <View style={[styles.unavailableBadge, { backgroundColor: colors.error + "20" }]}>
                            <Text variant="small" style={{ color: colors.error }}>
                                Out of stock
                            </Text>
                        </View>
                    )}
                </View>
            </View>
        </Card>
    );
}

const styles = StyleSheet.create({
    card: {
        marginBottom: 12,
    },
    content: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    addButton: {
        paddingHorizontal: 20,
        paddingVertical: 8,
    },
    unavailableBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
});
