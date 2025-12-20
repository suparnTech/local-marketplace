// src/components/skeletons/ShopCardSkeleton.tsx
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { colors } from '../../theme/colors';
import { borderRadius, spacing } from '../../theme/spacing';
import { Skeleton } from '../ui/Skeleton';

export function ShopCardSkeleton() {
    return (
        <View style={styles.container}>
            {/* Logo */}
            <Skeleton width={60} height={60} style={styles.logo} />

            <View style={styles.content}>
                {/* Shop name */}
                <Skeleton width="70%" height={18} style={styles.name} />

                {/* Category */}
                <Skeleton width="50%" height={14} style={styles.category} />

                {/* Rating and location */}
                <View style={styles.row}>
                    <Skeleton width={60} height={14} />
                    <Skeleton width={80} height={14} />
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        backgroundColor: colors.surface,
        borderRadius: borderRadius.lg,
        padding: spacing.md,
        marginBottom: spacing.md,
        borderWidth: 1,
        borderColor: colors.border,
    },
    logo: {
        borderRadius: borderRadius.md,
        marginRight: spacing.md,
    },
    content: {
        flex: 1,
        justifyContent: 'space-between',
    },
    name: {
        marginBottom: spacing.xs,
    },
    category: {
        marginBottom: spacing.sm,
    },
    row: {
        flexDirection: 'row',
        gap: spacing.md,
    },
});
