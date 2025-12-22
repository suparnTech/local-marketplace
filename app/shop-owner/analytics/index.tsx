// app/shop-owner/analytics/index.tsx - Shop Analytics Dashboard
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useEffect } from 'react';
import { ActivityIndicator, Dimensions, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { GlassCard } from '../../../src/components/ui/GlassCard';
import { GlassHeader } from '../../../src/components/ui/GlassHeader';
import { ImmersiveBackground } from '../../../src/components/ui/ImmersiveBackground';
import { KineticCard } from '../../../src/components/ui/KineticCard';
import { SafeView } from '../../../src/components/ui/SafeView';
import { useShopOwnerAnalytics } from '../../../src/hooks/useShopOwner';
import { colors } from '../../../src/theme/colors';
import { gradients } from '../../../src/theme/gradients';
import { spacing } from '../../../src/theme/spacing';

const { width } = Dimensions.get('window');

interface AnalyticsData {
    summary: {
        totalRevenue: number;
        totalOrders: number;
        completedOrders: number;
        pendingOrders: number;
        cancelledOrders: number;
        todayRevenue: number;
        todayOrders: number;
    };
    revenueTrend: { date: string; revenue: number }[];
    topProducts: { id: string; name: string; quantity: number; sales: number }[];
}

export default function AnalyticsScreen() {
    const { data, isLoading: loading, refetch } = useShopOwnerAnalytics();

    if (loading && !data) {
        return (
            <SafeView>
                <ImmersiveBackground />
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            </SafeView>
        );
    }

    const maxRevenue = data?.revenueTrend?.length
        ? Math.max(...data.revenueTrend.map((r: { revenue: number }) => r.revenue), 100)
        : 100;

    return (
        <SafeView scroll>
            <ImmersiveBackground />
            <View style={styles.container}>
                <GlassHeader
                    title="Business Insights"
                    subtitle="Performance & Growth"
                    showBackButton
                    onBackPress={() => router.back()}
                />

                {/* Primary Stats */}
                <View style={styles.statsGrid}>
                    <StatCard
                        title="Today's Sales"
                        value={`₹${data?.summary.todayRevenue.toLocaleString()}`}
                        subtitle={`${data?.summary.todayOrders} New Orders`}
                        icon="cash"
                        gradient={gradients.primary}
                        delay={100}
                    />
                    <StatCard
                        title="Total Revenue"
                        value={`₹${data?.summary.totalRevenue.toLocaleString()}`}
                        subtitle={`Lifetime Earnings`}
                        icon="wallet"
                        gradient={gradients.accent}
                        delay={200}
                    />
                </View>

                {/* Revenue Trend Chart (Custom Build) */}
                <Animated.View entering={FadeInUp.delay(300).springify()}>
                    <KineticCard cardWidth={width - spacing.lg * 2} style={styles.chartKinetic}>
                        <GlassCard style={styles.chartCard} intensity={25}>
                            <View style={styles.chartHeader}>
                                <Text style={styles.chartTitle}>7-Day Revenue Trend</Text>
                                <View style={styles.trendBadge}>
                                    <Ionicons name="trending-up" size={14} color={colors.success} />
                                    <Text style={styles.trendText}>+12%</Text>
                                </View>
                            </View>

                            <View style={styles.chartContainer}>
                                {data?.revenueTrend.map((item: any, index: number) => (
                                    <View key={item.date} style={styles.chartBarWrapper}>
                                        <Bar height={(item.revenue / maxRevenue) * 120} delay={index * 100} />
                                        <Text style={styles.barLabel}>{new Date(item.date).toLocaleDateString('en-US', { weekday: 'short' })}</Text>
                                    </View>
                                ))}
                            </View>
                        </GlassCard>
                    </KineticCard>
                </Animated.View>

                {/* Order Breakdown */}
                <View style={styles.breakdownContainer}>
                    <Text style={styles.sectionTitle}>Order Status Overview</Text>
                    <View style={styles.breakdownGrid}>
                        <SmallStat title="Completed" value={data?.summary.completedOrders} color={colors.success} />
                        <SmallStat title="Pending" value={data?.summary.pendingOrders} color={colors.warning} />
                        <SmallStat title="Cancelled" value={data?.summary.cancelledOrders} color={colors.error} />
                    </View>
                </View>

                {/* Top Products */}
                <Animated.View entering={FadeInUp.delay(500).springify()} style={styles.topProductsSection}>
                    <Text style={styles.sectionTitle}>Top Performing Products</Text>
                    <GlassCard style={styles.productList} intensity={15}>
                        {data?.topProducts.map((product: any, index: number) => (
                            <View key={product.id} style={[styles.productItem, index === 0 && styles.noBorder]}>
                                <View style={styles.productInfo}>
                                    <View style={[styles.rankBadge, { backgroundColor: index === 0 ? colors.accent : colors.surfaceLight }]}>
                                        <Text style={styles.rankText}>{index + 1}</Text>
                                    </View>
                                    <View>
                                        <Text style={styles.productName} numberOfLines={1}>{product.name}</Text>
                                        <Text style={styles.productSales}>{product.quantity} units sold</Text>
                                    </View>
                                </View>
                                <Text style={styles.productRevenue}>₹{product.sales.toLocaleString()}</Text>
                            </View>
                        ))}
                    </GlassCard>
                </Animated.View>

                <View style={styles.bottomSpacer} />
            </View>
        </SafeView>
    );
}

const StatCard = ({ title, value, subtitle, icon, gradient, delay }: any) => (
    <Animated.View entering={FadeInDown.delay(delay).springify()} style={styles.statCardWrapper}>
        <GlassCard style={styles.statCard} intensity={25}>
            <LinearGradient colors={gradient} style={styles.iconCircle} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                <Ionicons name={icon} size={20} color="#fff" />
            </LinearGradient>
            <Text style={styles.statLabel}>{title}</Text>
            <Text style={styles.statValue}>{value}</Text>
            <Text style={styles.statSubtitle}>{subtitle}</Text>
        </GlassCard>
    </Animated.View>
);

const SmallStat = ({ title, value, color }: any) => (
    <GlassCard style={styles.smallStat} intensity={15}>
        <Text style={[styles.smallStatValue, { color }]}>{value}</Text>
        <Text style={styles.smallStatLabel}>{title}</Text>
    </GlassCard>
);

const Bar = ({ height, delay }: any) => {
    const animatedHeight = useSharedValue(0);

    useEffect(() => {
        animatedHeight.value = withSpring(height, { damping: 12, stiffness: 80 });
    }, [height]);

    const animatedStyle = useAnimatedStyle(() => ({
        height: animatedHeight.value,
    }));

    return (
        <Animated.View style={[styles.bar, animatedStyle]}>
            <LinearGradient colors={gradients.primary} style={StyleSheet.absoluteFill} />
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    center: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    statsGrid: {
        flexDirection: 'row',
        paddingHorizontal: spacing.lg,
        gap: spacing.md,
        marginTop: spacing.md,
    },
    statCardWrapper: {
        flex: 1,
    },
    statCard: {
        padding: spacing.md,
        borderRadius: 24,
    },
    iconCircle: {
        width: 36,
        height: 36,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.sm,
    },
    statLabel: {
        fontSize: 12,
        fontWeight: '700',
        color: colors.textMuted,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    statValue: {
        fontSize: 22,
        fontWeight: '900',
        color: colors.text,
        marginVertical: 4,
    },
    statSubtitle: {
        fontSize: 11,
        color: colors.textMuted,
    },
    chartKinetic: {
        marginHorizontal: spacing.lg,
        marginTop: spacing.xl,
    },
    chartCard: {
        padding: spacing.lg,
        borderRadius: 28,
    },
    trendBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: 'rgba(16, 185, 129, 0.15)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    trendText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: colors.success,
    },
    chartHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.xl,
    },
    chartTitle: {
        fontSize: 16,
        fontWeight: '800',
        color: colors.text,
    },
    chartContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        height: 150,
        paddingHorizontal: spacing.sm,
    },
    chartBarWrapper: {
        alignItems: 'center',
        flex: 1,
    },
    bar: {
        width: 12,
        borderRadius: 6,
        overflow: 'hidden',
        backgroundColor: colors.surface,
    },
    barLabel: {
        fontSize: 10,
        fontWeight: '700',
        color: colors.textMuted,
        marginTop: 12,
        textTransform: 'uppercase',
    },
    breakdownContainer: {
        marginTop: spacing.xl,
        paddingHorizontal: spacing.lg,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '800',
        color: colors.textMuted,
        textTransform: 'uppercase',
        letterSpacing: 1.5,
        marginBottom: spacing.md,
        marginLeft: 4,
    },
    breakdownGrid: {
        flexDirection: 'row',
        gap: spacing.md,
    },
    smallStat: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: spacing.md,
        borderRadius: 18,
    },
    smallStatValue: {
        fontSize: 18,
        fontWeight: '900',
    },
    smallStatLabel: {
        fontSize: 10,
        fontWeight: '700',
        color: colors.textMuted,
        marginTop: 2,
    },
    topProductsSection: {
        marginTop: spacing.xl,
        paddingHorizontal: spacing.lg,
    },
    productList: {
        padding: 0,
        borderRadius: 24,
    },
    productItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: spacing.md,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.03)',
    },
    noBorder: {
        borderTopWidth: 0,
    },
    productInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        flex: 1,
    },
    rankBadge: {
        width: 24,
        height: 24,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    rankText: {
        fontSize: 12,
        fontWeight: '900',
        color: '#fff',
    },
    productName: {
        fontSize: 15,
        fontWeight: '700',
        color: colors.text,
        maxWidth: 160,
    },
    productSales: {
        fontSize: 12,
        color: colors.textMuted,
    },
    productRevenue: {
        fontSize: 15,
        fontWeight: '800',
        color: colors.success,
    },
    bottomSpacer: {
        height: 120,
    },
});
