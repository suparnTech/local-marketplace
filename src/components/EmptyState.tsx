// src/components/EmptyState.tsx
import React from "react";
import { StyleSheet, View } from "react-native";
import { useTheme } from "../theme/useTheme";
import { Text } from "./ui/Text";

interface EmptyStateProps {
    icon?: string;
    title: string;
    description?: string;
}

export function EmptyState({ icon = "📭", title, description }: EmptyStateProps) {
    const { spacing } = useTheme();

    return (
        <View style={[styles.container, { padding: spacing.xl }]}>
            <Text variant="heading" style={{ fontSize: 48, marginBottom: spacing.md }}>
                {icon}
            </Text>
            <Text variant="subheading" style={{ textAlign: "center" }}>
                {title}
            </Text>
            {description && (
                <Text variant="body" muted style={{ textAlign: "center", marginTop: spacing.sm }}>
                    {description}
                </Text>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
});
