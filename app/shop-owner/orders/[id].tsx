import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Image, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { GlassCard } from '../../../src/components/ui/GlassCard';
import { GlassHeader } from '../../../src/components/ui/GlassHeader';
import { ImmersiveBackground } from '../../../src/components/ui/ImmersiveBackground';
import { SafeView } from '../../../src/components/ui/SafeView';
import { useShopOwnerOrderDetail } from '../../../src/hooks/useShopOwner';
import { api } from '../../../src/lib/api';
import { colors } from '../../../src/theme/colors';
import { spacing } from '../../../src/theme/spacing';

export default function OrderDetails() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const orderId = typeof id === 'string' ? id : undefined;
    const [updating, setUpdating] = useState(false);

    // Use React Query hook instead of useEffect
    const { data: order, isLoading: loading, refetch } = useShopOwnerOrderDetail(orderId);

    const handleUpdateStatus = async (newStatus: string) => {
        setUpdating(true);
        try {
            await api.put(`/api/shop-owner/orders/${orderId}/status`, { status: newStatus });
            // Refetch to get updated data
            await refetch();
            Alert.alert('Success', `Order marked as ${newStatus}`);
        } catch (error) {
            console.error('Failed to update status:', error);
            Alert.alert('Error', 'Failed to update order status');
        } finally {
            setUpdating(false);
        }
    };

    const handleCallCustomer = () => {
        if (order?.customer_phone) {
            Linking.openURL(`tel:${order.customer_phone}`);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'PENDING': return colors.warning;
            case 'ACCEPTED': return colors.info;
            case 'READY': return colors.primary;
            case 'COMPLETED': return colors.success;
            case 'CANCELLED': return colors.error;
            default: return colors.textMuted;
        }
    };

    if (loading) {
        return (
            <SafeView>
                <ImmersiveBackground />
                <GlassHeader title="Order Details" />
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            </SafeView>
        );
    }

    if (!order) {
        return (
            <SafeView>
                <ImmersiveBackground />
                <GlassHeader title="Order Details" />
                <View style={styles.center}>
                    <Text style={styles.errorText}>Order not found</Text>
                </View>
            </SafeView>
        );
    }

    return (
        <SafeView style={{ flex: 1 }}>
            <ImmersiveBackground />
            <GlassHeader title={`Order #${order.id.slice(0, 8)}`} />

            <ScrollView contentContainerStyle={styles.container}>
                {/* Status Card */}
                <Animated.View entering={FadeInDown.delay(100).springify()}>
                    <GlassCard style={styles.statusCard} intensity={20}>
                        <View style={styles.statusHeader}>
                            <Text style={styles.statusLabel}>Status</Text>
                            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) + '20' }]}>
                                <Text style={[styles.statusText, { color: getStatusColor(order.status) }]}>{order.status}</Text>
                            </View>
                        </View>
                        <Text style={styles.statusDesc}>
                            {order.status === 'PENDING' ? 'Waiting for your acceptance' :
                                order.status === 'ACCEPTED' ? 'Prepare the items now' :
                                    order.status === 'READY' ? 'Ready for pickup/delivery' :
                                        order.status === 'COMPLETED' ? 'Order delivered successfully' : 'Order cancelled'}
                        </Text>
                    </GlassCard>
                </Animated.View>

                {/* Customer Details */}
                <Animated.View entering={FadeInDown.delay(200).springify()}>
                    <GlassCard style={styles.sectionCard} intensity={20}>
                        <View style={styles.sectionHeader}>
                            <Ionicons name="person" size={20} color={colors.primary} />
                            <Text style={styles.sectionTitle}>Customer</Text>
                        </View>
                        <View style={styles.customerRow}>
                            <View>
                                <Text style={styles.customerName}>{order.customer_name || 'Guest User'}</Text>
                                <Text style={styles.customerAddress}>
                                    {[
                                        order.address_line1,
                                        order.address_line2,
                                        order.city,
                                        order.pincode
                                    ].filter(Boolean).join(', ')}
                                </Text>
                            </View>
                            <TouchableOpacity style={styles.callButton} onPress={handleCallCustomer}>
                                <Ionicons name="call" size={20} color="#fff" />
                            </TouchableOpacity>
                        </View>
                    </GlassCard>
                </Animated.View>

                {/* Order Items */}
                <Animated.View entering={FadeInDown.delay(300).springify()}>
                    <GlassCard style={styles.sectionCard} intensity={20}>
                        <View style={styles.sectionHeader}>
                            <Ionicons name="basket" size={20} color={colors.primary} />
                            <Text style={styles.sectionTitle}>Items ({order.items.length})</Text>
                        </View>
                        {order.items.map((item: any, index: number) => (
                            <View key={index} style={styles.itemRow}>
                                <Image
                                    source={{ uri: item.images?.[0] || 'https://via.placeholder.com/100' }}
                                    style={styles.itemImage}
                                />
                                <View style={styles.itemInfo}>
                                    <Text style={styles.itemName}>{item.name}</Text>
                                    <View style={styles.itemMeta}>
                                        <Text style={styles.itemQty}>x{item.quantity}</Text>
                                        <Text style={styles.itemPrice}>₹{item.price_at_purchase}</Text>
                                    </View>
                                </View>
                                <Text style={styles.itemTotal}>₹{item.quantity * item.price_at_purchase}</Text>
                            </View>
                        ))}
                    </GlassCard>
                </Animated.View>

                {/* Payment Breakdown */}
                <Animated.View entering={FadeInDown.delay(400).springify()}>
                    <GlassCard style={styles.sectionCard} intensity={20}>
                        <View style={styles.sectionHeader}>
                            <Ionicons name="wallet" size={20} color={colors.primary} />
                            <Text style={styles.sectionTitle}>Payment</Text>
                        </View>
                        <View style={styles.paymentRow}>
                            <Text style={styles.paymentLabel}>Item Total</Text>
                            <Text style={styles.paymentValue}>₹{order.total_amount - (order.delivery_fee || 0) - (order.tax_amount || 0)}</Text>
                        </View>
                        <View style={styles.paymentRow}>
                            <Text style={styles.paymentLabel}>Taxes</Text>
                            <Text style={styles.paymentValue}>₹{order.tax_amount || 0}</Text>
                        </View>
                        <View style={styles.paymentRow}>
                            <Text style={styles.paymentLabel}>Delivery Fee</Text>
                            <Text style={styles.paymentValue}>₹{order.delivery_fee || 0}</Text>
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.paymentRow}>
                            <Text style={styles.totalLabel}>Customer Pays</Text>
                            <Text style={styles.totalValue}>₹{order.total_amount}</Text>
                        </View>
                        <View style={styles.paymentRow}>
                            <Text style={styles.paymentLabel}>Platform Fee (5%)</Text>
                            <Text style={[styles.paymentValue, { color: colors.error }]}>-₹{((order.total_amount - (order.delivery_fee || 0) - (order.tax_amount || 0)) * 0.05).toFixed(2)}</Text>
                        </View>
                        <View style={styles.payoutBox}>
                            <Text style={styles.payoutLabel}>Your Net Payout</Text>
                            <Text style={styles.payoutValue}>₹{(order.total_amount - ((order.total_amount - (order.delivery_fee || 0) - (order.tax_amount || 0)) * 0.05)).toFixed(2)}</Text>
                        </View>
                    </GlassCard>
                </Animated.View>

                <View style={{ height: 100 }} />
            </ScrollView>

            {/* Action Bar */}
            {order.status !== 'COMPLETED' && order.status !== 'CANCELLED' && (
                <GlassCard style={styles.actionBar} intensity={80}>
                    {order.status === 'PENDING' && (
                        <>
                            <TouchableOpacity
                                style={[styles.actionBtn, styles.rejectBtn]}
                                onPress={() => handleUpdateStatus('CANCELLED')}
                                disabled={updating}
                            >
                                <Text style={styles.btnText}>Reject</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.actionBtn, styles.acceptBtn]}
                                onPress={() => handleUpdateStatus('ACCEPTED')}
                                disabled={updating}
                            >
                                <Text style={styles.btnText}>Accept Order</Text>
                            </TouchableOpacity>
                        </>
                    )}
                    {order.status === 'ACCEPTED' && (
                        <TouchableOpacity
                            style={[styles.actionBtn, styles.primaryBtn]}
                            onPress={() => handleUpdateStatus('READY')}
                            disabled={updating}
                        >
                            <Text style={styles.btnText}>Mark Read for Pickup</Text>
                        </TouchableOpacity>
                    )}
                    {order.status === 'READY' && (
                        <TouchableOpacity
                            style={[styles.actionBtn, styles.successBtn]}
                            onPress={() => handleUpdateStatus('COMPLETED')}
                            disabled={updating}
                        >
                            <Text style={styles.btnText}>Mark Completed</Text>
                        </TouchableOpacity>
                    )}
                </GlassCard>
            )}
        </SafeView>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: spacing.lg,
        gap: spacing.lg,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorText: {
        color: colors.error,
        fontSize: 16,
    },
    statusCard: {
        padding: spacing.md,
        borderRadius: 16,
    },
    statusHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.xs,
    },
    statusLabel: {
        color: colors.textMuted,
        fontSize: 14,
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusText: {
        fontSize: 12,
        fontWeight: 'bold',
    },
    statusDesc: {
        color: colors.text,
        fontSize: 16,
        fontWeight: '500',
    },
    sectionCard: {
        padding: spacing.md,
        borderRadius: 16,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        marginBottom: spacing.md,
    },
    sectionTitle: {
        color: colors.text,
        fontSize: 16,
        fontWeight: 'bold',
    },
    customerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    customerName: {
        color: colors.text,
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    customerAddress: {
        color: colors.textMuted,
        fontSize: 14,
        maxWidth: '80%',
    },
    callButton: {
        backgroundColor: colors.success,
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    itemRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    itemImage: {
        width: 50,
        height: 50,
        borderRadius: 8,
        marginRight: spacing.md,
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    itemInfo: {
        flex: 1,
    },
    itemName: {
        color: colors.text,
        fontSize: 14,
        marginBottom: 2,
    },
    itemMeta: {
        flexDirection: 'row',
        gap: spacing.md,
    },
    itemQty: {
        color: colors.textMuted,
        fontSize: 12,
    },
    itemPrice: {
        color: colors.textMuted,
        fontSize: 12,
    },
    itemTotal: {
        color: colors.text,
        fontWeight: 'bold',
    },
    paymentRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: spacing.sm,
    },
    paymentLabel: {
        color: colors.textMuted,
        fontSize: 14,
    },
    paymentValue: {
        color: colors.text,
        fontSize: 14,
    },
    divider: {
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.1)',
        marginVertical: spacing.md,
    },
    totalLabel: {
        color: colors.text,
        fontSize: 16,
        fontWeight: 'bold',
    },
    totalValue: {
        color: colors.primary,
        fontSize: 18,
        fontWeight: 'bold',
    },
    payoutBox: {
        marginTop: spacing.md,
        padding: spacing.md,
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        borderRadius: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    payoutLabel: {
        color: colors.success,
        fontWeight: 'bold',
    },
    payoutValue: {
        color: colors.success,
        fontWeight: 'bold',
        fontSize: 16,
    },
    actionBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: spacing.lg,
        paddingBottom: spacing.xl + 20,
        flexDirection: 'row',
        gap: spacing.md,
    },
    actionBtn: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    rejectBtn: {
        backgroundColor: colors.error,
    },
    acceptBtn: {
        backgroundColor: colors.success,
    },
    primaryBtn: {
        backgroundColor: colors.primary,
    },
    successBtn: {
        backgroundColor: colors.success,
    },
    btnText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    }
});
