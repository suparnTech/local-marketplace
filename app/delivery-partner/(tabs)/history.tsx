// Delivery History Screen
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    RefreshControl,
    ScrollView,
    StyleSheet,
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

export default function DeliveryHistory() {
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [deliveries, setDeliveries] = useState<any[]>([]);

    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        try {
            const response = await api.get('/api/delivery-assignments/history');
            setDeliveries(response.data);
        } catch (error) {
            console.error('Fetch history error:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchHistory();
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    };

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
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
            <GlassHeader title="Delivery History" showBackButton />

            <ScrollView
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
                }
            >
                {deliveries.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Ionicons name="time-outline" size={64} color={colors.textSecondary} />
                        <Text style={styles.emptyText}>No delivery history yet</Text>
                    </View>
                ) : (
                    deliveries.map((delivery, index) => (
                        <Animated.View
                            key={delivery.id}
                            entering={FadeInDown.delay(index * 50).springify()}
                        >
                            <TouchableOpacity
                                onPress={() => router.push(`/delivery-partner/delivery/${delivery.id}`)}
                            >
                                <GlassCard style={styles.deliveryCard}>
                                    <View style={styles.deliveryHeader}>
                                        <View>
                                            <Text style={styles.orderNumber}>#{delivery.order_number}</Text>
                                            <Text style={styles.deliveryDate}>
                                                {formatDate(delivery.delivered_at)} • {formatTime(delivery.delivered_at)}
                                            </Text>
                                        </View>
                                        <View
                                            style={[
                                                styles.statusBadge,
                                                delivery.status === 'delivered'
                                                    ? styles.statusDelivered
                                                    : styles.statusCancelled,
                                            ]}
                                        >
                                            <Ionicons
                                                name={delivery.status === 'delivered' ? 'checkmark-circle' : 'close-circle'}
                                                size={16}
                                                color={delivery.status === 'delivered' ? colors.success : colors.error}
                                            />
                                            <Text
                                                style={[
                                                    styles.statusText,
                                                    delivery.status === 'delivered'
                                                        ? styles.statusTextDelivered
                                                        : styles.statusTextCancelled,
                                                ]}
                                            >
                                                {delivery.status === 'delivered' ? 'Delivered' : 'Cancelled'}
                                            </Text>
                                        </View>
                                    </View>

                                    <View style={styles.deliveryDetails}>
                                        <View style={styles.detailRow}>
                                            <Ionicons name="location" size={16} color={colors.textSecondary} />
                                            <Text style={styles.detailText}>
                                                {delivery.distance_km} km • {delivery.estimated_time_minutes} min
                                            </Text>
                                        </View>
                                        <View style={styles.detailRow}>
                                            <Ionicons name="wallet" size={16} color={colors.success} />
                                            <Text style={[styles.detailText, { color: colors.success, fontWeight: '700' }]}>
                                                ₹{delivery.partner_earnings}
                                            </Text>
                                        </View>
                                    </View>
                                </GlassCard>
                            </TouchableOpacity>
                        </Animated.View>
                    ))
                )}
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
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: spacing.xl * 3,
    },
    emptyText: {
        fontSize: 16,
        color: colors.textSecondary,
        marginTop: spacing.lg,
    },
    deliveryCard: {
        padding: spacing.lg,
        marginBottom: spacing.md,
    },
    deliveryHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: spacing.md,
    },
    orderNumber: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.text,
        marginBottom: spacing.xs,
    },
    deliveryDate: {
        fontSize: 13,
        color: colors.textSecondary,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs,
        borderRadius: borderRadius.sm,
    },
    statusDelivered: {
        backgroundColor: `${colors.success}20`,
    },
    statusCancelled: {
        backgroundColor: `${colors.error}20`,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
    },
    statusTextDelivered: {
        color: colors.success,
    },
    statusTextCancelled: {
        color: colors.error,
    },
    deliveryDetails: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
    },
    detailText: {
        fontSize: 14,
        color: colors.textSecondary,
    },
});
