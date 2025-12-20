// Skeleton Loader Component
import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withSequence,
    withTiming,
} from 'react-native-reanimated';
import { colors } from '../../theme/colors';
import { borderRadius, spacing } from '../../theme/spacing';

interface SkeletonProps {
    width?: number | string;
    height?: number;
    borderRadius?: number;
    style?: any;
}

export function Skeleton({ width = '100%', height = 20, borderRadius: radius = 8, style }: SkeletonProps) {
    const opacity = useSharedValue(0.3);

    React.useEffect(() => {
        opacity.value = withRepeat(
            withSequence(
                withTiming(0.7, { duration: 800 }),
                withTiming(0.3, { duration: 800 })
            ),
            -1,
            false
        );
    }, []);

    const animatedStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
    }));

    return (
        <Animated.View
            style={[
                {
                    width,
                    height,
                    borderRadius: radius,
                    backgroundColor: colors.surface,
                },
                animatedStyle,
                style,
            ]}
        />
    );
}

// Product Card Skeleton
export function ProductCardSkeleton() {
    return (
        <View style={styles.productCard}>
            <Skeleton width="100%" height={150} borderRadius={borderRadius.md} />
            <View style={styles.productInfo}>
                <Skeleton width="80%" height={16} style={{ marginBottom: 8 }} />
                <Skeleton width="40%" height={20} />
            </View>
        </View>
    );
}

// Shop Card Skeleton
export function ShopCardSkeleton() {
    return (
        <View style={styles.shopCard}>
            <Skeleton width={80} height={80} borderRadius={borderRadius.md} />
            <View style={styles.shopInfo}>
                <Skeleton width="60%" height={18} style={{ marginBottom: 6 }} />
                <Skeleton width="40%" height={14} style={{ marginBottom: 6 }} />
                <Skeleton width="30%" height={14} />
            </View>
        </View>
    );
}

// Order Card Skeleton
export function OrderCardSkeleton() {
    return (
        <View style={styles.orderCard}>
            <View style={styles.orderHeader}>
                <Skeleton width={100} height={16} />
                <Skeleton width={80} height={24} borderRadius={12} />
            </View>
            <Skeleton width="70%" height={14} style={{ marginTop: 8, marginBottom: 6 }} />
            <Skeleton width="50%" height={14} style={{ marginBottom: 12 }} />
            <View style={styles.orderFooter}>
                <Skeleton width={80} height={20} />
                <Skeleton width={100} height={16} />
            </View>
        </View>
    );
}

// Address Card Skeleton
export function AddressCardSkeleton() {
    return (
        <View style={styles.addressCard}>
            <Skeleton width="40%" height={16} style={{ marginBottom: 6 }} />
            <Skeleton width="90%" height={14} style={{ marginBottom: 4 }} />
            <Skeleton width="60%" height={14} style={{ marginBottom: 4 }} />
            <Skeleton width="50%" height={14} />
        </View>
    );
}

const styles = StyleSheet.create({
    productCard: {
        width: 160,
        marginRight: spacing.md,
    },
    productInfo: {
        marginTop: spacing.sm,
    },
    shopCard: {
        flexDirection: 'row',
        gap: spacing.md,
        marginBottom: spacing.md,
        padding: spacing.md,
        backgroundColor: colors.surface + '20',
        borderRadius: borderRadius.lg,
    },
    shopInfo: {
        flex: 1,
        justifyContent: 'center',
    },
    orderCard: {
        padding: spacing.md,
        backgroundColor: colors.surface + '20',
        borderRadius: borderRadius.lg,
        marginBottom: spacing.md,
    },
    orderHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    orderFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: spacing.sm,
        borderTopWidth: 1,
        borderTopColor: colors.surface,
    },
    addressCard: {
        padding: spacing.md,
        backgroundColor: colors.surface + '20',
        borderRadius: borderRadius.lg,
        marginBottom: spacing.md,
    },
});
