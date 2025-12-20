// app/store-owner/dashboard.tsx - Premium Store Dashboard
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import { GlassCard } from '../../src/components/ui/GlassCard';
import { SafeView } from '../../src/components/ui/SafeView';
import { useAuth } from '../../src/contexts/AuthContext';
import { colors } from '../../src/theme/colors';
import { gradients } from '../../src/theme/gradients';
import { borderRadius, spacing } from '../../src/theme/spacing';

const STATS = [
    { id: '1', title: 'Total Sales', value: '$12,450', icon: 'cash', color: gradients.success },
    { id: '2', title: 'Orders', value: '145', icon: 'cart', color: gradients.primary },
    { id: '3', title: 'Products', value: '24', icon: 'cube', color: gradients.accent },
    { id: '4', title: 'Views', value: '1.2k', icon: 'eye', color: gradients.buttonLight },
];

const RECENT_ORDERS = [
    { id: '101', customer: 'Alex Smith', item: 'Nike Air Max', status: 'Pending', price: '$180' },
    { id: '102', customer: 'Sarah Jones', item: 'Yoga Mat', status: 'Shipped', price: '$45' },
    { id: '103', customer: 'Mike Ross', item: 'Dumbbells', status: 'Delivered', price: '$120' },
];

export default function StoreDashboard() {
    const { user, logout } = useAuth();
    const [activeTab, setActiveTab] = useState('Overview');

    const handleLogout = () => {
        logout();
        router.replace('/auth/login');
    };

    return (
        <SafeView scroll gradient={gradients.backgroundDark}>
            <View style={styles.container}>
                {/* Header */}
                <Animated.View entering={FadeInDown.duration(600)} style={styles.header}>
                    <View>
                        <Text style={styles.greeting}>Store Dashboard</Text>
                        <Text style={styles.storeName}>{user?.name || 'My Store'} 🛍️</Text>
                    </View>
                    <TouchableOpacity onPress={handleLogout}>
                        <GlassCard style={styles.logoutButton}>
                            <Ionicons name="log-out-outline" size={24} color={colors.error} />
                        </GlassCard>
                    </TouchableOpacity>
                </Animated.View>

                {/* Stats Grid */}
                <View style={styles.statsGrid}>
                    {STATS.map((stat, index) => (
                        <Animated.View
                            key={stat.id}
                            entering={FadeInDown.delay(index * 100).springify()}
                            style={styles.statWrapper}
                        >
                            <GlassCard style={styles.statCard}>
                                <LinearGradient colors={stat.color} style={styles.statIcon}>
                                    <Ionicons name={stat.icon as any} size={20} color={colors.text} />
                                </LinearGradient>
                                <Text style={styles.statValue}>{stat.value}</Text>
                                <Text style={styles.statTitle}>{stat.title}</Text>
                            </GlassCard>
                        </Animated.View>
                    ))}
                </View>

                {/* Quick Actions */}
                <Animated.View entering={FadeInRight.delay(300).springify()} style={styles.actionSection}>
                    <Text style={styles.sectionTitle}>Quick Actions</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.actionList}>
                        <TouchableOpacity style={styles.actionButton}>
                            <LinearGradient colors={gradients.primary} style={styles.actionGradient}>
                                <Ionicons name="add" size={24} color={colors.text} />
                            </LinearGradient>
                            <Text style={styles.actionText}>Add Product</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.actionButton}>
                            <LinearGradient colors={gradients.surfaceLight} style={styles.actionGradient}>
                                <Ionicons name="settings-outline" size={24} color={colors.text} />
                            </LinearGradient>
                            <Text style={styles.actionText}>Settings</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.actionButton}>
                            <LinearGradient colors={gradients.surfaceLight} style={styles.actionGradient}>
                                <Ionicons name="megaphone-outline" size={24} color={colors.text} />
                            </LinearGradient>
                            <Text style={styles.actionText}>Promote</Text>
                        </TouchableOpacity>
                    </ScrollView>
                </Animated.View>

                {/* Recent Orders */}
                <View style={styles.ordersSection}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Recent Orders</Text>
                        <TouchableOpacity>
                            <Text style={styles.seeAll}>See All</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.ordersList}>
                        {RECENT_ORDERS.map((order, index) => (
                            <Animated.View
                                key={order.id}
                                entering={FadeInDown.delay(400 + (index * 100)).springify()}
                            >
                                <GlassCard style={styles.orderCard}>
                                    <View style={styles.orderInfo}>
                                        <Text style={styles.orderId}>#{order.id}</Text>
                                        <Text style={styles.orderItem}>{order.item}</Text>
                                        <Text style={styles.orderCustomer}>{order.customer}</Text>
                                    </View>
                                    <View style={styles.orderStatus}>
                                        <View style={[
                                            styles.statusBadge,
                                            {
                                                backgroundColor: order.status === 'Pending' ? 'rgba(245, 158, 11, 0.2)' :
                                                    order.status === 'Shipped' ? 'rgba(59, 130, 246, 0.2)' :
                                                        'rgba(16, 185, 129, 0.2)'
                                            }
                                        ]}>
                                            <Text style={[
                                                styles.statusText,
                                                {
                                                    color: order.status === 'Pending' ? colors.warning :
                                                        order.status === 'Shipped' ? '#3B82F6' :
                                                            colors.success
                                                }
                                            ]}>{order.status}</Text>
                                        </View>
                                        <Text style={styles.orderPrice}>{order.price}</Text>
                                    </View>
                                </GlassCard>
                            </Animated.View>
                        ))}
                    </View>
                </View>

            </View>
        </SafeView>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: spacing.lg,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.xl,
    },
    greeting: {
        color: colors.textMuted,
        fontSize: 14,
        marginBottom: 4,
    },
    storeName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: colors.text,
    },
    logoutButton: {
        padding: spacing.sm,
        borderRadius: borderRadius.md,
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.md,
        marginBottom: spacing.xl,
    },
    statWrapper: {
        width: '47%',
    },
    statCard: {
        padding: spacing.md,
        alignItems: 'flex-start',
    },
    statIcon: {
        padding: spacing.xs,
        borderRadius: borderRadius.md,
        marginBottom: spacing.sm,
    },
    statValue: {
        fontSize: 20,
        fontWeight: 'bold',
        color: colors.text,
        marginBottom: 2,
    },
    statTitle: {
        fontSize: 12,
        color: colors.textMuted,
    },
    actionSection: {
        marginBottom: spacing.xl,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.text,
        marginBottom: spacing.md,
    },
    seeAll: {
        color: colors.primary,
        fontSize: 14,
    },
    actionList: {
        gap: spacing.lg,
    },
    actionButton: {
        alignItems: 'center',
        gap: spacing.sm,
    },
    actionGradient: {
        width: 56,
        height: 56,
        borderRadius: borderRadius.full,
        alignItems: 'center',
        justifyContent: 'center',
    },
    actionText: {
        color: colors.textMuted,
        fontSize: 12,
    },
    ordersSection: {
        flex: 1,
    },
    ordersList: {
        gap: spacing.md,
    },
    orderCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: spacing.md,
    },
    orderInfo: {
        gap: 2,
    },
    orderId: {
        color: colors.textMuted,
        fontSize: 12,
    },
    orderItem: {
        color: colors.text,
        fontWeight: 'bold',
        fontSize: 16,
    },
    orderCustomer: {
        color: colors.textMuted,
        fontSize: 12,
    },
    orderStatus: {
        alignItems: 'flex-end',
        gap: spacing.xs,
    },
    statusBadge: {
        paddingHorizontal: spacing.sm,
        paddingVertical: 2,
        borderRadius: borderRadius.full,
    },
    statusText: {
        fontSize: 11,
        fontWeight: '600',
    },
    orderPrice: {
        color: colors.text,
        fontWeight: 'bold',
        fontSize: 15,
    },
});
