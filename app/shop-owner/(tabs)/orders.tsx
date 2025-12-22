import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Dimensions, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { GlassCard } from '../../../src/components/ui/GlassCard';
import { GlassHeader } from '../../../src/components/ui/GlassHeader';
import { ImmersiveBackground } from '../../../src/components/ui/ImmersiveBackground';
import { KineticCard } from '../../../src/components/ui/KineticCard';
import { SafeView } from '../../../src/components/ui/SafeView';
import { useShopOwnerOrders } from '../../../src/hooks/useShopOwner';
import { api } from '../../../src/lib/api';
import { colors } from '../../../src/theme/colors';
import { spacing } from '../../../src/theme/spacing';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - spacing.lg * 2;

export default function ShopOrders() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('All');

    // Use React Query hook instead of manual fetching
    const { data: orders = [], isLoading: loading, refetch } = useShopOwnerOrders();

    const onRefresh = async () => {
        await refetch();
    };


    const handleUpdateStatus = async (orderId: string, newStatus: string) => {
        try {
            await api.put(`/api/shop-owner/orders/${orderId}/status`, { status: newStatus });
            // Refetch using React Query
            refetch();
        } catch (error) {
            console.error('Failed to update status:', error);
        }
    };


    const getFilteredOrders = () => {
        if (activeTab === 'All') return orders;
        if (activeTab === 'Pending') return orders.filter((o: any) => o.status === 'PENDING');
        if (activeTab === 'Active') return orders.filter((o: any) => ['ACCEPTED', 'READY', 'OUT_FOR_DELIVERY'].includes(o.status));
        if (activeTab === 'History') return orders.filter((o: any) => ['COMPLETED', 'CANCELLED'].includes(o.status));
        return orders;
    };

    const filteredOrders = getFilteredOrders();

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'PENDING': return colors.warning;
            case 'ACCEPTED': return colors.primary;
            case 'READY': return colors.primary;
            case 'COMPLETED': return colors.success;
            case 'CANCELLED': return colors.error;
            default: return colors.textMuted;
        }
    };

    return (
        <SafeView>
            <ImmersiveBackground />
            <GlassHeader title="Orders" showBackButton={false} />

            <View style={styles.container}>
                {/* Tabs */}
                <View style={styles.tabsContainer}>
                    {['All', 'Pending', 'Active', 'History'].map((tab) => (
                        <TouchableOpacity
                            key={tab}
                            onPress={() => setActiveTab(tab)}
                            style={[
                                styles.tab,
                                activeTab === tab && styles.activeTab
                            ]}
                        >
                            <Text style={[
                                styles.tabText,
                                activeTab === tab && styles.activeTabText
                            ]}>{tab}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {loading ? (
                    <View style={styles.center}>
                        <ActivityIndicator size="large" color={colors.primary} />
                    </View>
                ) : (
                    <ScrollView
                        contentContainerStyle={styles.listContainer}
                        refreshControl={<RefreshControl refreshing={false} onRefresh={onRefresh} tintColor={colors.primary} />}
                        showsVerticalScrollIndicator={false}
                    >
                        {filteredOrders.length === 0 ? (
                            <GlassCard style={styles.emptyState} intensity={10}>
                                <Ionicons name="receipt-outline" size={64} color={colors.primary} />
                                <Text style={styles.emptyText}>No orders found</Text>
                            </GlassCard>
                        ) : (
                            filteredOrders.map((order: any, index: number) => (
                                <Animated.View key={order.id} entering={FadeInDown.delay(index * 100).springify()}>
                                    <KineticCard style={{ width: '100%' }} cardWidth={CARD_WIDTH}>
                                        <TouchableOpacity
                                            activeOpacity={0.9}
                                            onPress={() => router.push({ pathname: '/shop-owner/orders/[id]', params: { id: order.id } })}
                                        >
                                            <GlassCard style={styles.orderCard} intensity={20}>
                                                <View style={styles.orderHeader}>
                                                    <Text style={styles.orderId}>Order #{order.id.slice(0, 8)}</Text>
                                                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) + '20' }]}>
                                                        <Text style={[styles.statusText, { color: getStatusColor(order.status) }]}>{order.status}</Text>
                                                    </View>
                                                </View>

                                                <Text style={styles.customerName}>{order.customer_name || 'Guest User'}</Text>
                                                <Text style={styles.orderTime}>{new Date(order.created_at).toLocaleString()}</Text>

                                                <View style={styles.divider} />

                                                <View style={styles.orderFooter}>
                                                    <Text style={styles.amount}>₹{order.total_amount}</Text>

                                                    {order.status === 'PENDING' && (
                                                        <View style={styles.actionButtons}>
                                                            <TouchableOpacity
                                                                style={[styles.actionBtn, { backgroundColor: colors.error }]}
                                                                onPress={(e) => {
                                                                    e.stopPropagation();
                                                                    handleUpdateStatus(order.id, 'CANCELLED');
                                                                }}
                                                            >
                                                                <Ionicons name="close" size={20} color="#fff" />
                                                            </TouchableOpacity>
                                                            <TouchableOpacity
                                                                style={[styles.actionBtn, { backgroundColor: colors.success }]}
                                                                onPress={(e) => {
                                                                    e.stopPropagation();
                                                                    handleUpdateStatus(order.id, 'ACCEPTED');
                                                                }}
                                                            >
                                                                <Ionicons name="checkmark" size={20} color="#fff" />
                                                            </TouchableOpacity>
                                                        </View>
                                                    )}

                                                    {order.status === 'ACCEPTED' && (
                                                        <TouchableOpacity
                                                            style={styles.fullWidthBtn}
                                                            onPress={(e) => {
                                                                e.stopPropagation();
                                                                handleUpdateStatus(order.id, 'READY');
                                                            }}
                                                        >
                                                            <Text style={styles.btnText}>Mark Ready</Text>
                                                        </TouchableOpacity>
                                                    )}
                                                </View>
                                            </GlassCard>
                                        </TouchableOpacity>
                                    </KineticCard>
                                </Animated.View>
                            ))
                        )}
                        <View style={{ height: 100 }} />
                    </ScrollView>
                )}
            </View>
        </SafeView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: spacing.lg,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    tabsContainer: {
        flexDirection: 'row',
        marginBottom: spacing.lg,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 12,
        padding: 4,
    },
    tab: {
        flex: 1,
        paddingVertical: 8,
        alignItems: 'center',
        borderRadius: 8,
    },
    activeTab: {
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    tabText: {
        color: colors.textMuted,
        fontWeight: '600',
    },
    activeTabText: {
        color: colors.text,
    },
    listContainer: {
        gap: spacing.md,
    },
    orderCard: {
        padding: spacing.md,
        borderRadius: 16,
    },
    orderHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.xs,
    },
    orderId: {
        color: colors.textMuted,
        fontSize: 12,
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 12,
    },
    statusText: {
        fontSize: 10,
        fontWeight: 'bold',
    },
    customerName: {
        color: colors.text,
        fontSize: 16,
        fontWeight: 'bold',
        marginTop: 4,
    },
    orderTime: {
        color: colors.textMuted,
        fontSize: 12,
    },
    divider: {
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.1)',
        marginVertical: spacing.md,
    },
    orderFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    amount: {
        color: colors.primary, // Using primary for price emphasis
        fontSize: 18,
        fontWeight: 'bold',
    },
    actionButtons: {
        flexDirection: 'row',
        gap: spacing.md,
    },
    actionBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    fullWidthBtn: {
        backgroundColor: colors.primary,
        paddingHorizontal: spacing.md,
        paddingVertical: 6,
        borderRadius: 8,
    },
    btnText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 12,
    },
    emptyState: {
        padding: spacing.xl,
        alignItems: 'center',
        gap: spacing.md,
    },
    emptyText: {
        color: colors.textMuted,
        fontSize: 16,
    }
});
