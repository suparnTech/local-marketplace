import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    Dimensions,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import Animated, {
    Extrapolate,
    FadeInDown,
    FadeInUp,
    interpolate,
    useAnimatedScrollHandler,
    useAnimatedStyle,
    useSharedValue,
} from 'react-native-reanimated';
import { GlassCard } from '../../src/components/ui/GlassCard';
import { GlassHeader } from '../../src/components/ui/GlassHeader';
import { ImmersiveBackground } from '../../src/components/ui/ImmersiveBackground';
import { KineticCard } from '../../src/components/ui/KineticCard';
import { SafeView } from '../../src/components/ui/SafeView';
import { Skeleton } from '../../src/components/ui/Skeleton';
import { api } from '../../src/lib/api';
import { colors } from '../../src/theme/colors';
import { gradients } from '../../src/theme/gradients';
import { spacing } from '../../src/theme/spacing';

const { width } = Dimensions.get('window');
const ITEM_CARD_WIDTH = width - spacing.lg * 2;
const HEADER_HEIGHT = 100;

const STATUS_TIMELINE = [
    { key: 'pending', label: 'Order Placed', icon: 'checkmark-circle' },
    { key: 'accepted', label: 'Accepted', icon: 'checkmark-done-circle' },
    { key: 'preparing', label: 'Preparing', icon: 'restaurant' },
    { key: 'out_for_delivery', label: 'Out for Delivery', icon: 'bicycle' },
    { key: 'delivered', label: 'Delivered', icon: 'gift' },
];

export default function OrderDetailScreen() {
    const { id } = useLocalSearchParams();
    const [order, setOrder] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const scrollY = useSharedValue(0);
    const onScroll = useAnimatedScrollHandler({
        onScroll: (event) => {
            scrollY.value = event.contentOffset.y;
        },
    });

    useEffect(() => {
        fetchOrderDetails();
    }, [id]);

    const fetchOrderDetails = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/api/orders/${id}`);
            setOrder(response.data);
        } catch (error) {
            console.error('Failed to fetch order:', error);
            Alert.alert('Error', 'Failed to load order details');
        } finally {
            setLoading(false);
        }
    };

    const handleCancelOrder = () => {
        Alert.alert(
            'Cancel Order',
            'Are you sure you want to cancel this order?',
            [
                { text: 'No', style: 'cancel' },
                {
                    text: 'Yes, Cancel',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await api.put(`/api/orders/${id}/cancel`);
                            Alert.alert('Success', 'Order cancelled successfully');
                            fetchOrderDetails();
                        } catch (error) {
                            Alert.alert('Error', 'Failed to cancel order');
                        }
                    },
                },
            ]
        );
    };

    const headerStyle = useAnimatedStyle(() => {
        const opacity = interpolate(scrollY.value, [0, 40], [0, 1], Extrapolate.CLAMP);
        const translateY = interpolate(scrollY.value, [0, 40], [-10, 0], Extrapolate.CLAMP);
        return { opacity, transform: [{ translateY }] };
    });

    if (loading) {
        return (
            <SafeView gradient={gradients.background as any}>
                <ImmersiveBackground />
                <View style={styles.container}>
                    <GlassHeader title="Loading..." />
                    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: spacing.lg, gap: spacing.md }}>
                        <Skeleton width={width - spacing.lg * 2} height={100} borderRadius={24} />
                        <Skeleton width={width - spacing.lg * 2} height={300} borderRadius={24} />
                        <Skeleton width={width - spacing.lg * 2} height={200} borderRadius={24} />
                    </ScrollView>
                </View>
            </SafeView>
        );
    }

    if (!order) {
        return (
            <SafeView gradient={gradients.background as any}>
                <ImmersiveBackground />
                <View style={styles.errorContainer}>
                    <Ionicons name="alert-circle" size={64} color={colors.error} />
                    <Text style={styles.errorText}>Order not found</Text>
                    <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                        <Text style={styles.backButtonText}>Go Back</Text>
                    </TouchableOpacity>
                </View>
            </SafeView>
        );
    }

    const orderDate = new Date(order.created_at).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });

    const isCancelled = order.status === 'cancelled';
    const statusIndex = STATUS_TIMELINE.findIndex(s => s.key === order.status);

    return (
        <SafeView gradient={gradients.background as any}>
            <ImmersiveBackground />

            <View style={styles.headerLayer}>
                <GlassHeader
                    title={`Order #${order.id.slice(0, 8)}`}
                    subtitle={orderDate}
                    showBackButton
                    intensity={20}
                    style={headerStyle}
                />
            </View>

            <Animated.ScrollView
                style={styles.container}
                onScroll={onScroll}
                scrollEventThrottle={16}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                <View style={{ height: 20 }} />

                {/* Status Timeline Portal */}
                <Animated.View entering={FadeInDown.delay(100).springify()}>
                    <GlassCard style={styles.portalCard} intensity={25}>
                        <View style={styles.portalHeader}>
                            <Text style={styles.portalTitle}>Fulfillment Status</Text>
                            {isCancelled && (
                                <View style={styles.statusBadgeCancelled}>
                                    <View style={styles.dotCancelled} />
                                    <Text style={styles.statusTextCancelled}>CANCELLED</Text>
                                </View>
                            )}
                        </View>

                        <View style={styles.timelineContainer}>
                            {STATUS_TIMELINE.map((step, index) => {
                                const isCompleted = index <= statusIndex && !isCancelled;
                                const isCurrent = index === statusIndex && !isCancelled;
                                const isLast = index === STATUS_TIMELINE.length - 1;

                                return (
                                    <View key={step.key} style={styles.timelineStep}>
                                        <View style={styles.timelineIndicator}>
                                            <View style={[
                                                styles.statusIconGlow,
                                                isCompleted && { backgroundColor: colors.primary + '30' },
                                                isCurrent && { backgroundColor: colors.accent + '30' }
                                            ]}>
                                                <Ionicons
                                                    name={step.icon as any}
                                                    size={22}
                                                    color={isCompleted ? colors.primary : isCurrent ? colors.accent : colors.textMuted}
                                                />
                                            </View>
                                            {!isLast && (
                                                <View style={[
                                                    styles.timelineConnector,
                                                    isCompleted && { backgroundColor: colors.primary }
                                                ]} />
                                            )}
                                        </View>
                                        <View style={styles.timelineLabelBox}>
                                            <Text style={[
                                                styles.timelineLabelText,
                                                isCompleted && { color: colors.text, fontWeight: '800' },
                                                isCurrent && { color: colors.accent, fontWeight: '900' }
                                            ]}>
                                                {step.label}
                                            </Text>
                                            {isCurrent && (
                                                <Text style={styles.timelineSubText}>In Progress</Text>
                                            )}
                                        </View>
                                    </View>
                                );
                            })}
                        </View>
                    </GlassCard>
                </Animated.View>

                {/* Delivery Dynamics Portal */}
                <Animated.View entering={FadeInDown.delay(200).springify()}>
                    <GlassCard style={styles.portalCard} intensity={20}>
                        <View style={styles.portalHeader}>
                            <Ionicons name="location" size={20} color={colors.primary} />
                            <Text style={styles.portalTitle}>Delivery Destination</Text>
                        </View>
                        <View style={styles.addressPortal}>
                            <Text style={styles.consumerName}>{order.name}</Text>
                            <Text style={styles.addressLine}>{order.address_line1}</Text>
                            {order.address_line2 && <Text style={styles.addressLine}>{order.address_line2}</Text>}
                            <Text style={styles.addressLine}>{order.city}, {order.state} - {order.pincode}</Text>
                            <View style={styles.metaRow}>
                                <Ionicons name="call" size={14} color={colors.primary} />
                                <Text style={styles.metaValue}>{order.phone}</Text>
                            </View>
                        </View>
                    </GlassCard>
                </Animated.View>

                {/* Artifacts Portal (Items) */}
                <Animated.View entering={FadeInDown.delay(300).springify()}>
                    <GlassCard style={styles.portalCard} intensity={30}>
                        <View style={styles.portalHeader}>
                            <Text style={styles.portalTitle}>Artifacts ({order.items?.length || 0})</Text>
                        </View>
                        {order.items?.map((item: any, index: number) => (
                            <KineticCard key={index} cardWidth={ITEM_CARD_WIDTH - 32}>
                                <GlassCard style={styles.itemArtifact} intensity={10}>
                                    <Image
                                        source={{ uri: item.images?.[0] || 'https://via.placeholder.com/100' }}
                                        style={styles.artifactImage}
                                    />
                                    <View style={styles.artifactInfo}>
                                        <Text style={styles.artifactName}>{item.name}</Text>
                                        <View style={styles.artifactMeta}>
                                            <Text style={styles.artifactQty}>x{item.quantity}</Text>
                                            <Text style={styles.artifactPrice}>₹{item.price_at_purchase}</Text>
                                        </View>
                                    </View>
                                </GlassCard>
                            </KineticCard>
                        ))}
                    </GlassCard>
                </Animated.View>

                {/* Payment Dynamics Portal */}
                <Animated.View entering={FadeInDown.delay(400).springify()}>
                    <GlassCard style={styles.portalCard} intensity={20}>
                        <View style={styles.portalHeader}>
                            <Text style={styles.portalTitle}>Bill Summary</Text>
                        </View>
                        <View style={styles.billDynamics}>
                            <View style={styles.billRow}>
                                <Text style={styles.billLabel}>Subtotal</Text>
                                <Text style={styles.billValue}>₹{order.total_amount - (order.delivery_fee || 0) - (order.tax_amount || 0) + (order.discount_amount || 0)}</Text>
                            </View>
                            <View style={styles.billRow}>
                                <Text style={styles.billLabel}>Logistics Fee</Text>
                                <Text style={styles.billValue}>₹{order.delivery_fee || 0}</Text>
                            </View>
                            {order.discount_amount > 0 && (
                                <View style={styles.billRow}>
                                    <Text style={[styles.billLabel, { color: colors.accent }]}>Reward Discount</Text>
                                    <Text style={[styles.billValue, { color: colors.accent }]}>-₹{order.discount_amount}</Text>
                                </View>
                            )}
                            <View style={[styles.billRow, styles.grandTotalRow]}>
                                <Text style={styles.grandTotalLabel}>Total Settlement</Text>
                                <Text style={styles.grandTotalValue}>₹{order.total_amount}</Text>
                            </View>
                            <View style={styles.paymentMethodPortal}>
                                <Ionicons name={order.payment_method === 'cod' ? 'cash' : 'card'} size={18} color={colors.primary} />
                                <Text style={styles.paymentMethodLabel}>
                                    {order.payment_method === 'cod' ? 'CASH ON DELIVERY' : 'DIGITAL SETTLEMENT'}
                                </Text>
                            </View>
                        </View>
                    </GlassCard>
                </Animated.View>

                {/* Termination Portal */}
                {order.status === 'pending' && (
                    <Animated.View entering={FadeInUp.delay(500).springify()}>
                        <TouchableOpacity style={styles.terminationBtn} onPress={handleCancelOrder}>
                            <LinearGradient
                                colors={[colors.error + '40', colors.error + '10']}
                                style={styles.terminationGradient}
                            >
                                <Text style={styles.terminationText}>TERMINATE ORDER</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </Animated.View>
                )}

                <View style={{ height: 120 }} />
            </Animated.ScrollView>
        </SafeView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 20,
        padding: 40,
    },
    errorText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: colors.text,
    },
    backButton: {
        paddingHorizontal: 30,
        paddingVertical: 15,
        backgroundColor: colors.primary,
        borderRadius: 20,
    },
    backButtonText: {
        color: '#fff',
        fontWeight: '900',
    },
    headerLayer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
    },
    scrollContent: {
        paddingTop: 100,
        paddingHorizontal: spacing.lg,
    },
    portalCard: {
        marginBottom: spacing.lg,
        padding: 20,
        borderRadius: 32,
        gap: 16,
    },
    portalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    portalTitle: {
        fontSize: 18,
        fontWeight: '900',
        color: colors.text,
        letterSpacing: -0.5,
    },
    statusBadgeCancelled: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        backgroundColor: colors.error + '20',
        borderWidth: 1,
        borderColor: colors.error + '30',
    },
    dotCancelled: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: colors.error,
    },
    statusTextCancelled: {
        fontSize: 10,
        fontWeight: '800',
        color: colors.error,
    },
    timelineContainer: {
        marginTop: 10,
        gap: 4,
    },
    timelineStep: {
        flexDirection: 'row',
        gap: 20,
        minHeight: 60,
    },
    timelineIndicator: {
        alignItems: 'center',
        width: 44,
    },
    statusIconGlow: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.05)',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1,
    },
    timelineConnector: {
        width: 2,
        flex: 1,
        backgroundColor: 'rgba(255,255,255,0.1)',
        marginVertical: 4,
    },
    timelineLabelBox: {
        flex: 1,
        justifyContent: 'center',
        paddingBottom: 20,
    },
    timelineLabelText: {
        fontSize: 15,
        color: colors.textMuted,
        fontWeight: '600',
    },
    timelineSubText: {
        fontSize: 12,
        color: colors.accent,
        fontWeight: '700',
        marginTop: 2,
    },
    addressPortal: {
        gap: 6,
    },
    consumerName: {
        fontSize: 17,
        fontWeight: '800',
        color: colors.text,
    },
    addressLine: {
        fontSize: 14,
        color: colors.textMuted,
        lineHeight: 20,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 8,
    },
    metaValue: {
        fontSize: 14,
        fontWeight: '700',
        color: colors.text,
    },
    itemArtifact: {
        flexDirection: 'row',
        gap: 16,
        padding: 12,
        borderRadius: 24,
        marginBottom: 12,
    },
    artifactImage: {
        width: 70,
        height: 70,
        borderRadius: 16,
        backgroundColor: 'rgba(255,255,255,0.05)',
    },
    artifactInfo: {
        flex: 1,
        justifyContent: 'center',
        gap: 4,
    },
    artifactName: {
        fontSize: 15,
        fontWeight: '700',
        color: colors.text,
    },
    artifactMeta: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    artifactQty: {
        fontSize: 13,
        color: colors.textMuted,
        fontWeight: '600',
    },
    artifactPrice: {
        fontSize: 16,
        fontWeight: '900',
        color: colors.primary,
    },
    billDynamics: {
        gap: 12,
    },
    billRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    billLabel: {
        fontSize: 15,
        color: colors.textMuted,
        fontWeight: '500',
    },
    billValue: {
        fontSize: 15,
        color: colors.text,
        fontWeight: '700',
    },
    grandTotalRow: {
        marginTop: 8,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.05)',
    },
    grandTotalLabel: {
        fontSize: 18,
        fontWeight: '900',
        color: colors.text,
    },
    grandTotalValue: {
        fontSize: 22,
        fontWeight: '900',
        color: colors.primary,
    },
    paymentMethodPortal: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginTop: 12,
        padding: 12,
        borderRadius: 16,
        backgroundColor: 'rgba(255,255,255,0.03)',
    },
    paymentMethodLabel: {
        fontSize: 12,
        fontWeight: '800',
        color: colors.textMuted,
        letterSpacing: 1,
    },
    terminationBtn: {
        marginTop: 10,
        borderRadius: 24,
        overflow: 'hidden',
    },
    terminationGradient: {
        paddingVertical: 18,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: colors.error + '30',
    },
    terminationText: {
        fontSize: 14,
        fontWeight: '900',
        color: colors.error,
        letterSpacing: 2,
    },
});
