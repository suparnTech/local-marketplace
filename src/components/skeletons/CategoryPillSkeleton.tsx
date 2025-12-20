// src/components/skeletons/CategoryPillSkeleton.tsx
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { borderRadius, spacing } from '../../theme/spacing';
import { Skeleton } from '../ui/Skeleton';

export function CategoryPillSkeleton() {
    return (
        <View style={styles.container}>
            <Skeleton width={80} height={36} style={styles.pill} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginRight: spacing.sm,
    },
    pill: {
        borderRadius: borderRadius.full,
    },
});
