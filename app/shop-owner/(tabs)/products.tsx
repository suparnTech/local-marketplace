// app/shop-owner/(tabs)/products.tsx
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Dimensions, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { GlassCard } from '../../../src/components/ui/GlassCard';
import { GlassHeader } from '../../../src/components/ui/GlassHeader';
import { ImmersiveBackground } from '../../../src/components/ui/ImmersiveBackground';
import { KineticCard } from '../../../src/components/ui/KineticCard';
import { SafeView } from '../../../src/components/ui/SafeView';
import { useShopOwnerProducts } from '../../../src/hooks/useShopOwner';
import { colors } from '../../../src/theme/colors';
import { spacing } from '../../../src/theme/spacing';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - spacing.lg * 2;

export default function ShopProducts() {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState('');

    // Use React Query hook instead of manual fetching
    const { data: products = [], isLoading: loading, error, refetch } = useShopOwnerProducts();

    const shopMissing = error && (error as any).response?.status === 404;

    const onRefresh = async () => {
        await refetch();
    };


    const handleAddProduct = () => {
        router.push('/shop-owner/products/add');
    };

    const filteredProducts = products.filter((p: any) =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (shopMissing) {
        return (
            <SafeView>
                <ImmersiveBackground />
                <GlassHeader title="My Products" showBackButton={false} />
                <View style={styles.center}>
                    <GlassCard style={styles.emptyState} intensity={20}>
                        <Ionicons name="storefront-outline" size={64} color={colors.primary} />
                        <Text style={styles.emptyText}>Shop Not Found</Text>
                        <Text style={styles.emptySubText}>
                            It looks like your shop details are missing. Please complete the setup to manage products.
                        </Text>
                        <TouchableOpacity
                            style={styles.setupButton}
                            onPress={() => router.push('/shop-owner/register?mode=setup')}
                        >
                            <Text style={styles.setupButtonText}>Complete Shop Setup</Text>
                        </TouchableOpacity>
                    </GlassCard>
                </View>
            </SafeView>
        );
    }

    return (
        <SafeView>
            <ImmersiveBackground />
            <GlassHeader title="My Products" showBackButton={false} />

            <View style={styles.content}>
                {/* Search Bar */}
                <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.searchContainer}>
                    <GlassCard style={styles.searchCard} intensity={20}>
                        <Ionicons name="search" size={20} color={colors.primary} />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Search your inventory..."
                            placeholderTextColor={colors.textMuted}
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />
                    </GlassCard>
                </Animated.View>

                {/* Loading State */}
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
                        {filteredProducts.length === 0 ? (
                            <GlassCard style={styles.emptyState} intensity={10}>
                                <Ionicons name="cube-outline" size={64} color={colors.primary} />
                                <Text style={styles.emptyText}>No products found.</Text>
                                <Text style={styles.emptySubText}>Add your first product to start selling!</Text>
                            </GlassCard>
                        ) : (
                            filteredProducts.map((product: any, index: number) => (
                                <Animated.View key={product.id} entering={FadeInDown.delay(200 + index * 100).springify()}>
                                    <KineticCard style={{ width: '100%' }} onPress={() => router.push(`/shop-owner/products/${product.id}`)} cardWidth={CARD_WIDTH}>
                                        <GlassCard style={styles.productCard} intensity={25}>
                                            <View style={styles.productHeader}>
                                                <View style={styles.productInfo}>
                                                    <Text style={styles.productName}>{product.name}</Text>
                                                    <Text style={styles.stockText}>
                                                        {product.inventory.stock} {product.inventory.unit} in stock
                                                    </Text>
                                                </View>
                                                <View style={[
                                                    styles.statusBadge,
                                                    { backgroundColor: product.inventory.stock > 0 ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)' }
                                                ]}>
                                                    <Text style={[
                                                        styles.statusText,
                                                        { color: product.inventory.stock > 0 ? colors.success : colors.error }
                                                    ]}>
                                                        {product.inventory.stock > 0 ? 'Active' : 'Empty'}
                                                    </Text>
                                                </View>
                                            </View>

                                            <View style={styles.divider} />

                                            <View style={styles.productFooter}>
                                                <View>
                                                    <Text style={styles.priceLabel}>Customer Pays</Text>
                                                    <Text style={styles.priceValue}>₹{product.pricing.customerPrice}</Text>
                                                </View>
                                                <View style={styles.earningsContainer}>
                                                    <Text style={styles.priceLabel}>You Earn</Text>
                                                    <Text style={styles.earningsValue}>₹{product.pricing.shopPrice}</Text>
                                                </View>
                                            </View>
                                        </GlassCard>
                                    </KineticCard>
                                </Animated.View>
                            ))
                        )}
                        <View style={{ height: 100 }} />
                    </ScrollView>
                )}

                {/* FAB */}
                <TouchableOpacity style={styles.fab} onPress={handleAddProduct} activeOpacity={0.8}>
                    <GlassCard style={styles.fabInner} intensity={40}>
                        <Ionicons name="add" size={32} color="#FFF" />
                    </GlassCard>
                </TouchableOpacity>
            </View>
        </SafeView>
    );
}

const styles = StyleSheet.create({
    content: {
        flex: 1,
        padding: spacing.lg,
    },
    searchContainer: {
        marginBottom: spacing.lg,
    },
    searchCard: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.md,
        height: 50,
        gap: spacing.sm,
        borderRadius: 25,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    searchInput: {
        flex: 1,
        color: colors.text,
        fontSize: 16,
    },
    listContainer: {
        gap: spacing.lg,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyState: {
        alignItems: 'center',
        padding: spacing.xl,
        gap: spacing.md,
        marginTop: 50,
        borderRadius: 30,
    },
    emptyText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: colors.text,
    },
    emptySubText: {
        fontSize: 14,
        color: colors.textMuted,
        textAlign: 'center',
    },
    productCard: {
        padding: spacing.md,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
    },
    productHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    productInfo: {
        gap: 4,
    },
    productName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.text,
    },
    stockText: {
        fontSize: 14,
        color: colors.textMuted,
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusText: {
        fontSize: 12,
        fontWeight: 'bold',
    },
    divider: {
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.1)',
        marginVertical: spacing.md,
    },
    productFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    priceLabel: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.5)',
        marginBottom: 2,
    },
    priceValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.text,
    },
    earningsContainer: {
        alignItems: 'flex-end',
    },
    earningsValue: {
        fontSize: 20,
        fontWeight: '900',
        color: colors.primary, // Highlight earnings
    },
    fab: {
        position: 'absolute',
        bottom: spacing.xxl,
        right: spacing.lg,
    },
    fabInner: {
        width: 64,
        height: 64,
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.primary, // Solid color for pop or glass? User wants premium.
        // Let's use glass effect over primary color similar to quick actions
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.5,
        shadowRadius: 16,
        elevation: 8,
    },
    setupButton: {
        backgroundColor: colors.primary,
        paddingHorizontal: spacing.xl,
        paddingVertical: spacing.md,
        borderRadius: 12,
        marginTop: spacing.md,
    },
    setupButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
});
