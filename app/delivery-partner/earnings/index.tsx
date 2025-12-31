// Delivery Partner Earnings Screen
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { GlassCard } from '../../../src/components/ui/GlassCard';
import { GlassHeader } from '../../../src/components/ui/GlassHeader';
import { ImmersiveBackground } from '../../../src/components/ui/ImmersiveBackground';
import { SafeView } from '../../../src/components/ui/SafeView';
import { api } from '../../../src/lib/api';
import { colors } from '../../../src/theme/colors';
import { gradients } from '../../../src/theme/gradients';
import { spacing } from '../../../src/theme/spacing';

export default function Earnings() {
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [stats, setStats] = useState<any>(null);
    const [todayEarnings, setTodayEarnings] = useState(0);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const response = await api.get('/api/delivery-partner/stats');
            setStats(response.data);
            setTodayEarnings(response.data.today_earnings || 0);
        } catch (error) {
            console.error('Fetch earnings error:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchData();
    };

    if (loading) {
        return (
            <SafeView gradient={gradients.backgroundDark as any}>
                <ImmersiveBackground />
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            </SafeView>
        );
    }

    return (
        <SafeView gradient={gradients.backgroundDark as any}>
            <ImmersiveBackground />
            <GlassHeader title="My Earnings" showBackButton />

            <ScrollView
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
                }
            >
                {/* Today's Earnings - BIG */}
                <Animated.View entering={FadeInDown.delay(100).springify()}>
                    <GlassCard style={styles.todayCard}>
                        <Text style={styles.todayLabel}>Today's Earnings</Text>
                        <Text style={styles.todayValue}>₹{todayEarnings}</Text>
                        <View style={styles.todayStats}>
                            <View style={styles.todayStat}>
                                <Text style={styles.todayStatValue}>{stats?.today_deliveries || 0}</Text>
                                <Text style={styles.todayStatLabel}>Deliveries</Text>
                            </View>
                            <View style={styles.divider} />
                            <View style={styles.todayStat}>
                                <Text style={styles.todayStatValue}>
                                    ₹{stats?.today_deliveries > 0 ? Math.round(todayEarnings / stats.today_deliveries) : 0}
                                </Text>
                                <Text style={styles.todayStatLabel}>Per Delivery</Text>
                            </View>
                        </View>
                    </GlassCard>
                </Animated.View>

                {/* Total Earnings */}
                <Animated.View entering={FadeInDown.delay(200).springify()}>
                    <Text style={styles.sectionTitle}>💰 Overall Earnings</Text>
                    <GlassCard style={styles.card}>
                        <View style={styles.earningRow}>
                            <Text style={styles.earningLabel}>Total Earnings</Text>
                            <Text style={styles.earningValue}>₹{stats?.total_earnings || 0}</Text>
                        </View>
                        <View style={styles.dividerFull} />
                        <View style={styles.earningRow}>
                            <Text style={styles.earningLabel}>Total Deliveries</Text>
                            <Text style={styles.earningValue}>{stats?.total_deliveries || 0}</Text>
                        </View>
                        <View style={styles.dividerFull} />
                        <View style={styles.earningRow}>
                            <Text style={styles.earningLabel}>Average per Delivery</Text>
                            <Text style={styles.earningValue}>
                                ₹{stats?.total_deliveries > 0
                                    ? Math.round(stats.total_earnings / stats.total_deliveries)
                                    : 0}
                            </Text>
                        </View>
                    </GlassCard>
                </Animated.View>

                {/* Info Box */}
                <Animated.View entering={FadeInDown.delay(300).springify()}>
                    <GlassCard style={styles.infoCard}>
                        <Ionicons name="information-circle" size={24} color={colors.info} />
                        <View style={styles.infoContent}>
                            <Text style={styles.infoTitle}>Payment Schedule</Text>
                            <Text style={styles.infoText}>
                                Earnings are settled daily at end of day via UPI/Bank Transfer
                            </Text>
                        </View>
                    </GlassCard>
                </Animated.View>

                {/* Bonus Info */}
                <Animated.View entering={FadeInDown.delay(400).springify()}>
                    <Text style={styles.sectionTitle}>🎁 Bonus Scheme</Text>
                    <GlassCard style={styles.card}>
                        <View style={styles.bonusRow}>
                            <Ionicons name="star" size={20} color={colors.warning} />
                            <Text style={styles.bonusText}>5+ deliveries/day = ₹50 bonus</Text>
                        </View>
                        <View style={styles.dividerFull} />
                        <View style={styles.bonusRow}>
                            <Ionicons name="star" size={20} color={colors.warning} />
                            <Text style={styles.bonusText}>10+ deliveries/day = ₹100 bonus</Text>
                        </View>
                    </GlassCard>
                </Animated.View>
            </ScrollView>
        </SafeView>
    );
}

const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        padding: spacing.lg,
    },
    todayCard: {
        padding: spacing.xl,
        alignItems: 'center',
        marginBottom: spacing.lg,
        backgroundColor: `${colors.success}15`,
    },
    todayLabel: {
        fontSize: 16,
        color: colors.textSecondary,
        marginBottom: spacing.sm,
    },
    todayValue: {
        fontSize: 48,
        fontWeight: '900',
        color: colors.success,
        marginBottom: spacing.lg,
    },
    todayStats: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.lg,
    },
    todayStat: {
        alignItems: 'center',
    },
    todayStatValue: {
        fontSize: 24,
        fontWeight: '700',
        color: colors.text,
        marginBottom: spacing.xs,
    },
    todayStatLabel: {
        fontSize: 13,
        color: colors.textSecondary,
    },
    divider: {
        width: 1,
        height: 40,
        backgroundColor: colors.glassBorder,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: colors.text,
        marginBottom: spacing.md,
    },
    card: {
        padding: spacing.lg,
        marginBottom: spacing.lg,
    },
    earningRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: spacing.md,
    },
    earningLabel: {
        fontSize: 16,
        color: colors.textSecondary,
    },
    earningValue: {
        fontSize: 20,
        fontWeight: '700',
        color: colors.text,
    },
    dividerFull: {
        height: 1,
        backgroundColor: colors.glassBorder,
    },
    infoCard: {
        flexDirection: 'row',
        padding: spacing.lg,
        marginBottom: spacing.lg,
        gap: spacing.md,
    },
    infoContent: {
        flex: 1,
    },
    infoTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.text,
        marginBottom: spacing.xs,
    },
    infoText: {
        fontSize: 14,
        color: colors.textSecondary,
        lineHeight: 20,
    },
    bonusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        paddingVertical: spacing.md,
    },
    bonusText: {
        fontSize: 16,
        color: colors.text,
        fontWeight: '600',
    },
});
