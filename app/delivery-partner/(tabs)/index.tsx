// Delivery Partner Dashboard - Main Screen
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
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
import { borderRadius, spacing } from '../../../src/theme/spacing';

export default function DeliveryPartnerDashboard() {
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [isOnline, setIsOnline] = useState(false);
    const [profile, setProfile] = useState<any>(null);
    const [stats, setStats] = useState<any>(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [profileRes, statsRes] = await Promise.all([
                api.get('/api/delivery-partner/profile'),
                api.get('/api/delivery-partner/stats'),
            ]);

            setProfile(profileRes.data);
            setStats(statsRes.data);
            setIsOnline(profileRes.data.is_available);
        } catch (error) {
            console.error('Fetch data error:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const toggleOnline = async (value: boolean) => {
        try {
            await api.put('/api/delivery-partner/availability', {
                is_available: value,
                current_location: {
                    lat: 0, // TODO: Get actual location
                    lng: 0,
                },
            });
            setIsOnline(value);
        } catch (error) {
            console.error('Toggle online error:', error);
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

    if (!profile || profile.verification_status !== 'approved') {
        return (
            <SafeView gradient={gradients.backgroundDark as any}>
                <ImmersiveBackground />
                <GlassHeader title="Delivery Partner" />
                <View style={styles.centerContainer}>
                    <GlassCard style={styles.pendingCard}>
                        <Ionicons name="time-outline" size={64} color={colors.warning} />
                        <Text style={styles.pendingTitle}>Verification Pending</Text>
                        <Text style={styles.pendingText}>
                            Your application is under review. You'll be notified once approved.
                        </Text>
                    </GlassCard>
                </View>
            </SafeView>
        );
    }

    return (
        <SafeView gradient={gradients.backgroundDark as any}>
            <ImmersiveBackground />
            <GlassHeader title="Delivery Partner" />

            <ScrollView
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
                }
            >
                {/* Online/Offline Toggle - BIG and PROMINENT */}
                <Animated.View entering={FadeInDown.delay(100).springify()}>
                    <GlassCard style={[styles.card, styles.onlineCard]}>
                        <View style={styles.onlineHeader}>
                            <View>
                                <Text style={styles.onlineLabel}>You are</Text>
                                <Text style={[styles.onlineStatus, isOnline && styles.onlineStatusActive]}>
                                    {isOnline ? 'ONLINE' : 'OFFLINE'}
                                </Text>
                            </View>
                            <Switch
                                value={isOnline}
                                onValueChange={toggleOnline}
                                trackColor={{ false: colors.glassLight, true: colors.success }}
                                thumbColor={isOnline ? '#fff' : colors.textSecondary}
                                ios_backgroundColor={colors.glassLight}
                                style={{ transform: [{ scale: 1.3 }] }}
                            />
                        </View>
                        {isOnline && (
                            <View style={styles.onlineInfo}>
                                <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                                <Text style={styles.onlineInfoText}>Ready to accept deliveries</Text>
                            </View>
                        )}
                    </GlassCard>
                </Animated.View>

                {/* Today's Stats */}
                <Animated.View entering={FadeInDown.delay(200).springify()}>
                    <Text style={styles.sectionTitle}>📊 Today's Performance</Text>
                    <View style={styles.statsGrid}>
                        <GlassCard style={styles.statCard}>
                            <Text style={styles.statValue}>{stats?.today_deliveries || 0}</Text>
                            <Text style={styles.statLabel}>Deliveries</Text>
                        </GlassCard>

                        <GlassCard style={styles.statCard}>
                            <Text style={styles.statValue}>₹{stats?.today_earnings || 0}</Text>
                            <Text style={styles.statLabel}>Earned</Text>
                        </GlassCard>

                        <GlassCard style={styles.statCard}>
                            <Text style={styles.statValue}>{stats?.pending_deliveries || 0}</Text>
                            <Text style={styles.statLabel}>Active</Text>
                        </GlassCard>

                        <GlassCard style={styles.statCard}>
                            <Text style={styles.statValue}>{profile?.rating?.toFixed(1) || '0.0'}</Text>
                            <Text style={styles.statLabel}>Rating</Text>
                        </GlassCard>
                    </View>
                </Animated.View>

                {/* Quick Actions - LARGE BUTTONS */}
                <Animated.View entering={FadeInDown.delay(300).springify()}>
                    <Text style={styles.sectionTitle}>⚡ Quick Actions</Text>

                    <TouchableOpacity
                        style={[styles.actionButton, styles.actionButtonPrimary]}
                        onPress={() => router.push('/delivery-partner/(tabs)/active')}
                    >
                        <Ionicons name="bicycle" size={32} color="#fff" />
                        <View style={styles.actionButtonContent}>
                            <Text style={styles.actionButtonTitle}>Active Deliveries</Text>
                            <Text style={styles.actionButtonSubtitle}>
                                {stats?.pending_deliveries || 0} ongoing
                            </Text>
                        </View>
                        <Ionicons name="chevron-forward" size={24} color="#fff" />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => router.push('/delivery-partner/earnings')}
                    >
                        <Ionicons name="wallet" size={32} color={colors.success} />
                        <View style={styles.actionButtonContent}>
                            <Text style={styles.actionButtonTitle}>My Earnings</Text>
                            <Text style={styles.actionButtonSubtitle}>
                                ₹{stats?.total_earnings || 0} total
                            </Text>
                        </View>
                        <Ionicons name="chevron-forward" size={24} color={colors.text} />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => router.push('/delivery-partner/(tabs)/history')}
                    >
                        <Ionicons name="time" size={32} color={colors.info} />
                        <View style={styles.actionButtonContent}>
                            <Text style={styles.actionButtonTitle}>Delivery History</Text>
                            <Text style={styles.actionButtonSubtitle}>
                                {stats?.total_deliveries || 0} completed
                            </Text>
                        </View>
                        <Ionicons name="chevron-forward" size={24} color={colors.text} />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => router.push('/delivery-partner/feedback/submit')}
                    >
                        <Ionicons name="chatbubble-ellipses" size={32} color={colors.warning} />
                        <View style={styles.actionButtonContent}>
                            <Text style={styles.actionButtonTitle}>Submit Feedback</Text>
                            <Text style={styles.actionButtonSubtitle}>Report an issue</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={24} color={colors.text} />
                    </TouchableOpacity>
                </Animated.View>

                {/* Overall Stats */}
                <Animated.View entering={FadeInDown.delay(400).springify()}>
                    <Text style={styles.sectionTitle}>📈 Overall Performance</Text>
                    <GlassCard style={styles.card}>
                        <View style={styles.overallStat}>
                            <Text style={styles.overallStatLabel}>Total Deliveries</Text>
                            <Text style={styles.overallStatValue}>{stats?.total_deliveries || 0}</Text>
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.overallStat}>
                            <Text style={styles.overallStatLabel}>Success Rate</Text>
                            <Text style={styles.overallStatValue}>
                                {stats?.total_deliveries > 0
                                    ? ((stats.successful_deliveries / stats.total_deliveries) * 100).toFixed(1)
                                    : 0}%
                            </Text>
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.overallStat}>
                            <Text style={styles.overallStatLabel}>Total Earnings</Text>
                            <Text style={[styles.overallStatValue, { color: colors.success }]}>
                                ₹{stats?.total_earnings || 0}
                            </Text>
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
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.xl,
    },
    content: {
        padding: spacing.lg,
    },
    card: {
        padding: spacing.lg,
        marginBottom: spacing.lg,
    },
    pendingCard: {
        padding: spacing.xl,
        alignItems: 'center',
    },
    pendingTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: colors.text,
        marginTop: spacing.lg,
        marginBottom: spacing.sm,
    },
    pendingText: {
        fontSize: 16,
        color: colors.textSecondary,
        textAlign: 'center',
        lineHeight: 24,
    },
    onlineCard: {
        backgroundColor: `${colors.glassLight}80`,
        borderWidth: 2,
        borderColor: colors.glassBorder,
    },
    onlineHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    onlineLabel: {
        fontSize: 16,
        color: colors.textSecondary,
        marginBottom: spacing.xs,
    },
    onlineStatus: {
        fontSize: 32,
        fontWeight: '900',
        color: colors.textSecondary,
    },
    onlineStatusActive: {
        color: colors.success,
    },
    onlineInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        marginTop: spacing.md,
        padding: spacing.md,
        backgroundColor: `${colors.success}20`,
        borderRadius: borderRadius.md,
    },
    onlineInfoText: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.success,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: colors.text,
        marginBottom: spacing.md,
        marginTop: spacing.sm,
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.md,
        marginBottom: spacing.lg,
    },
    statCard: {
        flex: 1,
        minWidth: '45%',
        padding: spacing.lg,
        alignItems: 'center',
    },
    statValue: {
        fontSize: 28,
        fontWeight: '900',
        color: colors.primary,
        marginBottom: spacing.xs,
    },
    statLabel: {
        fontSize: 13,
        color: colors.textSecondary,
        fontWeight: '600',
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.lg,
        backgroundColor: colors.glassLight,
        borderRadius: borderRadius.lg,
        marginBottom: spacing.md,
        borderWidth: 1,
        borderColor: colors.glassBorder,
    },
    actionButtonPrimary: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    actionButtonContent: {
        flex: 1,
        marginLeft: spacing.md,
    },
    actionButtonTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.text,
        marginBottom: spacing.xs,
    },
    actionButtonSubtitle: {
        fontSize: 14,
        color: colors.textSecondary,
    },
    overallStat: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: spacing.md,
    },
    overallStatLabel: {
        fontSize: 16,
        color: colors.textSecondary,
    },
    overallStatValue: {
        fontSize: 20,
        fontWeight: '700',
        color: colors.text,
    },
    divider: {
        height: 1,
        backgroundColor: colors.glassBorder,
    },
});
