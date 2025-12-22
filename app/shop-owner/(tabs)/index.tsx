// app/shop-owner/(tabs)/index.tsx - Premium Shop Dashboard
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React from 'react';
import { ActivityIndicator, Dimensions, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import { GlassCard } from '../../../src/components/ui/GlassCard';
import { ImmersiveBackground } from '../../../src/components/ui/ImmersiveBackground';
import { KineticCard } from '../../../src/components/ui/KineticCard';
import { SafeView } from '../../../src/components/ui/SafeView';
import { useAuth } from '../../../src/contexts/AuthContext';
import { useShopOwnerProducts, useShopOwnerProfile } from '../../../src/hooks/useShopOwner';
import { colors } from '../../../src/theme/colors';
import { gradients } from '../../../src/theme/gradients';
import { borderRadius, spacing } from '../../../src/theme/spacing';

export default function StoreDashboard() {
    const { user, logout } = useAuth();
    const router = useRouter();

    // Use React Query hooks instead of manual fetching
    const { data: shopData, isLoading: profileLoading, refetch: refetchProfile } = useShopOwnerProfile();
    const { data: products = [], isLoading: productsLoading, refetch: refetchProducts } = useShopOwnerProducts();

    const loading = profileLoading || productsLoading;

    const onRefresh = async () => {
        await Promise.all([refetchProfile(), refetchProducts()]);
    };


    const handleLogout = () => {
        logout();
        router.replace('/auth/login');
    };

    // Derived Stats
    const totalProducts = products.length;
    const totalOrders = shopData?.stats?.totalOrders || 0;
    const rating = shopData?.stats?.rating || 0;

    const stats = [
        { id: '1', title: 'Products', value: totalProducts.toString(), icon: 'cube', color: gradients.primary },
        { id: '2', title: 'Orders', value: totalOrders.toString(), icon: 'cart', color: gradients.success },
        { id: '3', title: 'Rating', value: rating > 0 ? rating.toFixed(1) : 'New', icon: 'star', color: gradients.accent },
        { id: '4', title: 'Views', value: shopData?.stats?.viewCount || '0', icon: 'eye', color: gradients.buttonLight },
    ];

    return (
        <SafeView>
            <ImmersiveBackground />

            <ScrollView
                contentContainerStyle={styles.container}
                refreshControl={<RefreshControl refreshing={false} onRefresh={onRefresh} tintColor={colors.primary} />}
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <Animated.View entering={FadeInDown.duration(600)} style={styles.header}>
                    <View>
                        <Text style={styles.greeting}>Welcome back,</Text>
                        <Text style={styles.storeName}>
                            {shopData?.businessName || user?.name || 'Shop Owner'} {shopData?.verification?.isApproved ? '✅' : ''}
                        </Text>
                    </View>
                    <TouchableOpacity onPress={handleLogout}>
                        <GlassCard style={styles.logoutButton} intensity={30}>
                            <Ionicons name="log-out-outline" size={24} color={colors.error} />
                        </GlassCard>
                    </TouchableOpacity>
                </Animated.View>

                {/* Stats Grid */}
                <View style={styles.statsGrid}>
                    {stats.map((stat, index) => (
                        <Animated.View
                            key={stat.id}
                            entering={FadeInDown.delay(index * 100).springify()}
                            style={styles.statWrapper}
                        >
                            <KineticCard style={{ width: '100%' }} cardWidth={Dimensions.get('window').width - spacing.lg * 2}>
                                <GlassCard style={styles.statCard} intensity={25}>
                                    <LinearGradient colors={stat.color} style={styles.statIcon}>
                                        <Ionicons name={stat.icon as any} size={20} color={colors.text} />
                                    </LinearGradient>
                                    <Text style={styles.statValue}>{stat.value}</Text>
                                    <Text style={styles.statTitle}>{stat.title}</Text>
                                </GlassCard>
                            </KineticCard>
                        </Animated.View>
                    ))}
                </View>

                {/* Quick Actions */}
                <Animated.View entering={FadeInRight.delay(300).springify()} style={styles.actionSection}>
                    <Text style={styles.sectionTitle}>Quick Actions</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.actionList}>
                        <TouchableOpacity style={styles.actionButton} onPress={() => router.push('/shop-owner/products/add')}>
                            <LinearGradient colors={gradients.primary} style={styles.actionGradient}>
                                <Ionicons name="add" size={24} color={colors.text} />
                            </LinearGradient>
                            <Text style={styles.actionText}>Add Product</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.actionButton} onPress={() => router.push('/shop-owner/products/bulk-upload')}>
                            <LinearGradient colors={gradients.surfaceLight} style={styles.actionGradient}>
                                <Ionicons name="cloud-upload-outline" size={24} color={colors.text} />
                            </LinearGradient>
                            <Text style={styles.actionText}>Bulk Upload</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.actionButton} onPress={() => router.push('/shop-owner/growth')}>
                            <LinearGradient colors={['#8B5CF6', '#6D28D9']} style={styles.actionGradient}>
                                <Ionicons name="trending-up" size={24} color={colors.text} />
                            </LinearGradient>
                            <Text style={styles.actionText}>Growth Hub</Text>
                        </TouchableOpacity>
                    </ScrollView>
                </Animated.View>

                {/* Recent Products (Replacing Hardcoded Orders) */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Recent Products</Text>
                    <TouchableOpacity onPress={() => router.push('/shop-owner/(tabs)/products')}>
                        <Text style={styles.seeAll}>View All</Text>
                    </TouchableOpacity>
                </View>

                {loading ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                ) : products.length === 0 ? (
                    <GlassCard style={styles.emptyState} intensity={15}>
                        <Text style={styles.emptyText}>No products yet.</Text>
                        <TouchableOpacity onPress={() => router.push('/shop-owner/products/add')}>
                            <Text style={styles.seeAll}>Add your first product</Text>
                        </TouchableOpacity>
                    </GlassCard>
                ) : (
                    <View style={styles.recentList}>
                        {products.slice(0, 3).map((product: any, index: number) => (
                            <Animated.View
                                key={product.id}
                                entering={FadeInDown.delay(400 + (index * 100)).springify()}
                            >
                                <GlassCard style={styles.productRow} intensity={20}>
                                    <View style={styles.productInfo}>
                                        <Text style={styles.productName}>{product.name}</Text>
                                        <Text style={styles.productStock}>
                                            Stock: {product.inventory.stock}
                                        </Text>
                                    </View>
                                    <View>
                                        <Text style={styles.productPrice}>₹{product.pricing.customerPrice}</Text>
                                    </View>
                                </GlassCard>
                            </Animated.View>
                        ))}
                    </View>
                )}

                <View style={{ height: 100 }} />
            </ScrollView>
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
        marginTop: spacing.md,
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
        borderRadius: 16,
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
    recentList: {
        gap: spacing.md,
    },
    productRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: spacing.md,
        borderRadius: 16,
    },
    productInfo: {
        gap: 4,
    },
    productName: {
        color: colors.text,
        fontSize: 16,
        fontWeight: '600',
    },
    productStock: {
        color: colors.textMuted,
        fontSize: 12,
    },
    productPrice: {
        color: colors.primary,
        fontSize: 16,
        fontWeight: 'bold',
    },
    emptyState: {
        padding: spacing.lg,
        alignItems: 'center',
        gap: spacing.sm,
    },
    emptyText: {
        color: colors.textMuted,
        fontSize: 14,
    }
});
