import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import {
    Alert,
    Dimensions,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import Animated, {
    FadeInDown,
    FadeInUp
} from 'react-native-reanimated';
import { useDispatch, useSelector } from 'react-redux';
import { ProductDetailModal } from '../../src/components/ProductDetailModal';
import { GlassCard } from '../../src/components/ui/GlassCard';
import { GlassHeader } from '../../src/components/ui/GlassHeader';
import { ImmersiveBackground } from '../../src/components/ui/ImmersiveBackground';
import { KineticCard } from '../../src/components/ui/KineticCard';
import { SafeView } from '../../src/components/ui/SafeView';
import { Skeleton } from '../../src/components/ui/Skeleton';
import { useShopDetail, useShopProducts } from '../../src/hooks/useShopDetail';
import { useShopCoupons } from '../../src/hooks/useShops';
import { addToCart } from '../../src/store/slices/cartSlice';
import { colors } from '../../src/theme/colors';
import { gradients } from '../../src/theme/gradients';
import { spacing } from '../../src/theme/spacing';

const { width } = Dimensions.get('window');
const PRODUCT_CARD_WIDTH = (width - spacing.lg * 3) / 2;
const HERO_HEIGHT = 300;
const HEADER_HEIGHT = 100;

// Types
interface Shop {
    id: string;
    name: string;
    description: string;
    logo_url?: string;
    rating: number;
    address_line1: string;
    phone: string;
    category_name: string;
    is_open: boolean;
    delivery_radius_km: number;
    min_order_amount: number;
}

interface Product {
    id: string;
    name: string;
    price: number;
    images: string[];
    rating: number;
    stock_quantity: number;
    shop_id?: string;
    store_id?: string;
    shop_name?: string;
}

export default function ShopDetailScreen() {
    const { id } = useLocalSearchParams();
    const shopId = typeof id === 'string' ? id : undefined;
    const dispatch = useDispatch();
    const cartItems = useSelector((state: any) => state.cart.items);
    const cartCount = cartItems.length;

    // Use React Query hooks
    const { data: shop, isLoading: loadingShop, refetch: refetchShop } = useShopDetail(shopId);
    const { data: products = [], isLoading: loadingProducts, refetch: refetchProducts } = useShopProducts(shopId);
    const { data: coupons = [], isLoading: loadingCoupons } = useShopCoupons(shopId || '');

    const loading = loadingShop || loadingProducts;
    const [refreshing, setRefreshing] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [modalVisible, setModalVisible] = useState(false);

    const onRefresh = async () => {
        setRefreshing(true);
        await Promise.all([refetchShop(), refetchProducts()]);
        setRefreshing(false);
    };

    const handleQuickAdd = (product: Product) => {
        if (product.stock_quantity === 0) {
            Alert.alert('Out of Stock', 'This product is currently unavailable');
            return;
        }

        dispatch(addToCart({
            id: `${product.id}-${Date.now()}`,
            product_id: product.id,
            shop_id: shop?.id || '',
            store_id: shop?.id || '', // Same as shop_id for compatibility
            shop_name: shop?.name || 'Shop',
            name: product.name,
            price: product.price,
            quantity: 1,
            image: product.images[0] || '',
            selected_variant: null,
        }));

        Alert.alert('Added to Cart', `${product.name} has been added to your cart`);
    };

    const handleLongPress = (product: Product) => {
        const productWithShop: Product = {
            ...product,
            shop_id: shop?.id || '',
            store_id: shop?.id || '',
            shop_name: shop?.name || 'Shop',
        };
        setSelectedProduct(productWithShop);
        setModalVisible(true);
    };

    const renderProduct = ({ item, index }: { item: Product; index: number }) => (
        <Animated.View
            entering={FadeInDown.delay(index * 60).springify()}
            style={styles.productCardWrapper}
        >
            <KineticCard 
                cardWidth={PRODUCT_CARD_WIDTH}
                onPress={() => handleQuickAdd(item)}
                onLongPress={() => handleLongPress(item)}
            >
                <GlassCard style={styles.productContent} intensity={15}>
                        {/* Product Image */}
                        <View style={styles.productImageContainer}>
                            <Image
                                source={{ uri: item.images[0] || 'https://via.placeholder.com/150' }}
                                style={styles.productImage}
                                contentFit="cover"
                                transition={500}
                            />
                            <LinearGradient
                                colors={['transparent', 'rgba(0,0,0,0.4)']}
                                style={styles.imageOverlay}
                            />
                            {item.stock_quantity <= 0 && (
                                <View style={styles.outOfStockOverlay}>
                                    <Text style={styles.outOfStockText}>Out of Stock</Text>
                                </View>
                            )}
                            {item.stock_quantity > 0 && (
                                <View style={styles.addButton}>
                                    <View style={styles.addButtonGlow}>
                                        <Ionicons name="add" size={20} color="#fff" />
                                    </View>
                                </View>
                            )}
                        </View>

                        {/* Product Info */}
                        <View style={styles.productInfo}>
                            <Text style={styles.productName} numberOfLines={1}>
                                {item.name}
                            </Text>
                            <View style={styles.productMeta}>
                                <Text style={styles.productPrice}>₹{item.price}</Text>
                                <View style={styles.productRatingSmall}>
                                    <Ionicons name="star" size={10} color={colors.accent} />
                                    <Text style={styles.ratingTextSmall}>
                                        {item.rating ? Number(item.rating).toFixed(1) : '0.0'}
                                    </Text>
                                </View>
                            </View>
                        </View>
                </GlassCard>
            </KineticCard>
        </Animated.View>
    );

    const renderProductSkeleton = () => (
        <View style={styles.productCardWrapper}>
            <GlassCard style={[styles.productContent, { height: 200 }]} intensity={10}>
                <Skeleton width={PRODUCT_CARD_WIDTH} height={140} />
                <View style={{ padding: 12, gap: 8 }}>
                    <Skeleton width={PRODUCT_CARD_WIDTH - 40} height={16} />
                    <Skeleton width={60} height={14} />
                </View>
            </GlassCard>
        </View>
    );



    if (loading) {
        return (
            <SafeView gradient={gradients.background as any}>
                <ImmersiveBackground />
                <View style={styles.container}>
                    <GlassHeader title="Loading..." />
                    <ScrollView style={{ flex: 1 }}>
                        <Skeleton width={width} height={HERO_HEIGHT} />
                        <View style={{ padding: spacing.lg, gap: spacing.md }}>
                            <Skeleton width={250} height={32} />
                            <Skeleton width={width - spacing.lg * 2} height={60} />
                            <View style={styles.productRow}>
                                {[1, 2, 3, 4].map((i) => (
                                    <View key={i} style={styles.productCardWrapper}>
                                        <Skeleton width={PRODUCT_CARD_WIDTH} height={200} borderRadius={24} />
                                    </View>
                                ))}
                            </View>
                        </View>
                    </ScrollView>
                </View>
            </SafeView>
        );
    }

    if (!shop) {
        return (
            <SafeView gradient={gradients.background as any}>
                <ImmersiveBackground />
                <View style={styles.error}>
                    <Ionicons name="alert-circle" size={64} color={colors.error} />
                    <Text style={styles.errorText}>Shop not found</Text>
                    <TouchableOpacity style={styles.backToHomeButton} onPress={() => router.back()}>
                        <Text style={styles.backToHomeText}>Go Back</Text>
                    </TouchableOpacity>
                </View>
            </SafeView>
        );
    }

    return (
        <SafeView gradient={gradients.background as any}>
            <ImmersiveBackground />

            {/* Parallax Hero Background */}
            <View style={styles.heroBackground}>
                {shop.logo_url ? (
                    <Image
                        source={{ uri: shop.logo_url }}
                        style={styles.heroImage}
                        contentFit="cover"
                        transition={600}
                    />
                ) : (
                    <LinearGradient
                        colors={[colors.primary + '40', colors.primaryDark + '60']}
                        style={styles.heroPlaceholder}
                    >
                        <Ionicons name="storefront" size={80} color={colors.primary} />
                    </LinearGradient>
                )}
                <LinearGradient
                    colors={['transparent', 'rgba(10,15,10,0.5)', '#0A0F0A']}
                    style={styles.heroOverlay}
                />
            </View>

            {/* Dynamic Header */}
            <View style={styles.headerPortal}>
                <GlassHeader
                    title={shop.name}
                    subtitle={shop.category_name}
                    showBackButton
                    intensity={20}
                />
            </View>

            <ScrollView
                style={styles.container}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
                }
            >
                <View style={styles.scrollContent}>
                    {/* Shop Branding Portal */}
                    <View style={styles.spacer} />
                    <Animated.View entering={FadeInUp.delay(200).springify()}>
                        <GlassCard style={styles.shopCard} intensity={25}>
                            <View style={styles.shopBrandingHeader}>
                                <View style={styles.shopTitleContainer}>
                                    <View style={styles.shopIdentityRow}>
                                        <Text style={styles.shopNameLarge}>{shop.name}</Text>
                                        <View style={[
                                            styles.statusBadgeSmall,
                                            { backgroundColor: shop.is_open ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)' },
                                            { borderColor: shop.is_open ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)' }
                                        ]}>
                                            <View style={[
                                                styles.statusDotSmall,
                                                { backgroundColor: shop.is_open ? '#10B981' : '#EF4444' }
                                            ]} />
                                            <Text style={[
                                                styles.statusTextSmall,
                                                { color: shop.is_open ? '#10B981' : '#EF4444' }
                                            ]}>
                                                {shop.is_open ? 'Open Now' : 'Closed'}
                                            </Text>
                                        </View>
                                    </View>
                                    <Text style={styles.categoryTextSmall}>{shop.category_name}</Text>
                                </View>
                                <View style={styles.ratingPortal}>
                                    <Ionicons name="star" size={16} color={colors.accent} />
                                    <Text style={styles.ratingValueLarge}>
                                        {shop.rating ? Number(shop.rating).toFixed(1) : '0.0'}
                                    </Text>
                                </View>
                            </View>

                            <Text style={styles.shopDescriptionLarge}>{shop.description}</Text>

                            <View style={styles.shopMetaGrid}>
                                <View style={styles.metaItem}>
                                    <View style={styles.metaIconGlow}>
                                        <Ionicons name="location-outline" size={16} color={colors.primary} />
                                    </View>
                                    <Text style={styles.metaLabel} numberOfLines={1}>{shop.address_line1}</Text>
                                </View>
                                <View style={styles.metaItem}>
                                    <View style={styles.metaIconGlow}>
                                        <Ionicons name="call-outline" size={16} color={colors.primary} />
                                    </View>
                                    <Text style={styles.metaLabel}>{shop.phone}</Text>
                                </View>
                            </View>

                            <View style={styles.deliveryMetaRow}>
                                <View style={styles.deliveryMetaItem}>
                                    <Ionicons name="bicycle" size={16} color={colors.primary} />
                                    <Text style={styles.deliveryMetaText}>Delivery in {shop.delivery_radius_km}km</Text>
                                </View>
                                <View style={styles.deliveryMetaDivider} />
                                <View style={styles.deliveryMetaItem}>
                                    <Ionicons name="wallet-outline" size={16} color={colors.primary} />
                                    <Text style={styles.deliveryMetaText}>Min ₹{shop.min_order_amount}</Text>
                                </View>
                            </View>
                        </GlassCard>
                    </Animated.View>

                    {/* Available Offers Section */}
                    {coupons.length > 0 && (
                        <Animated.View entering={FadeInUp.delay(350).springify()}>
                            <View style={styles.offersSection}>
                                <View style={styles.sectionHeader}>
                                    <Ionicons name="pricetag" size={18} color={colors.primary} />
                                    <Text style={styles.sectionTitle}>Available Offers</Text>
                                </View>
                                <ScrollView
                                    horizontal
                                    showsHorizontalScrollIndicator={false}
                                    contentContainerStyle={styles.offersList}
                                >
                                    {coupons.map((coupon) => (
                                        <TouchableOpacity
                                            key={coupon.id}
                                            style={styles.couponCard}
                                            onPress={() => {
                                                Alert.alert('Coupon Code', `Use code ${coupon.code} at checkout!`, [
                                                    { text: 'Copy Code', onPress: () => { /* Add clipboard logic if needed */ } },
                                                    { text: 'OK' }
                                                ]);
                                            }}
                                        >
                                            <GlassCard style={styles.couponGlass} intensity={30}>
                                                <View style={styles.couponLeft}>
                                                    <LinearGradient
                                                        colors={[colors.primary, colors.primaryDark]}
                                                        style={styles.couponBadge}
                                                    >
                                                        <Text style={styles.couponBadgeText}>
                                                            {coupon.discount_type === 'percentage' ? `${coupon.discount_value}%` : `₹${coupon.discount_value}`}
                                                        </Text>
                                                        <Text style={styles.couponBadgeSub}>OFF</Text>
                                                    </LinearGradient>
                                                </View>
                                                <View style={styles.couponRight}>
                                                    <Text style={styles.couponCodeText}>{coupon.code}</Text>
                                                    <Text style={styles.couponMinOrder}>Min. ₹{coupon.min_order_amount}</Text>
                                                </View>
                                            </GlassCard>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </View>
                        </Animated.View>
                    )}

                    {/* Product Ecosystem */}
                    <View style={styles.productsSectionPortal}>
                        <View style={styles.sectionHeaderPortal}>
                            <Text style={styles.sectionTitlePortal}>Master Collection</Text>
                            <View style={styles.itemCountBadge}>
                                <Text style={styles.itemCountText}>{products.length} Items</Text>
                            </View>
                        </View>

                        {products.length > 0 ? (
                            <View style={styles.productGrid}>
                                {products.map((item, index) => (
                                    <React.Fragment key={item.id}>
                                        {renderProduct({ item, index })}
                                    </React.Fragment>
                                ))}
                            </View>
                        ) : (
                            <GlassCard style={styles.emptyPortal} intensity={10}>
                                <Ionicons name="cube-outline" size={48} color={colors.textMuted} />
                                <Text style={styles.emptyPortalTitle}>Vault Empty</Text>
                                <Text style={styles.emptyPortalText}>This curator hasn't listed any artifacts yet.</Text>
                            </GlassCard>
                        )}
                    </View>
                    <View style={styles.bottomSpacer} />
                </View>
            </ScrollView>

            {/* Floating Cart Button */}
            {cartCount > 0 && (
                <Animated.View
                    entering={FadeInUp.springify()}
                    style={styles.floatingCartContainer}
                >
                    <TouchableOpacity
                        onPress={() => router.push('/(tabs)/cart')}
                        activeOpacity={0.9}
                    >
                        <BlurView intensity={40} tint="light" style={styles.floatingCartGlass}>
                            <LinearGradient
                                colors={[colors.primary + 'EE', colors.primaryDark + 'EE']}
                                style={styles.floatingCartGradient}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                            >
                                <Ionicons name="cart-sharp" size={26} color="#fff" />
                                <View style={styles.cartBadgeFloating}>
                                    <Text style={styles.cartBadgeTextFloating}>{cartCount}</Text>
                                </View>
                                {/* Glossy Overlay */}
                                <View style={styles.glossOverlay} />
                            </LinearGradient>
                        </BlurView>
                    </TouchableOpacity>
                </Animated.View>
            )}

            {/* Product Detail Modal */}
            <ProductDetailModal
                visible={modalVisible}
                product={selectedProduct}
                onClose={() => setModalVisible(false)}
            />
        </SafeView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    heroBackground: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: HERO_HEIGHT,
        overflow: 'hidden',
    },
    heroImage: {
        width: '100%',
        height: '100%',
    },
    heroPlaceholder: {
        width: '100%',
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
    },
    heroOverlay: {
        ...StyleSheet.absoluteFillObject,
    },
    headerPortal: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
    },
    scrollContent: {
        paddingTop: 0,
    },
    spacer: {
        height: HERO_HEIGHT - 60,
    },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
    },
    headerIconBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.05)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    cartHeaderBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.05)',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    cartBadge: {
        position: 'absolute',
        top: 8,
        right: 8,
        backgroundColor: colors.primary,
        borderRadius: 10,
        minWidth: 16,
        height: 16,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#000',
    },
    cartBadgeText: {
        color: colors.text,
        fontSize: 10,
        fontWeight: 'bold',
    },
    heroSection: {
        height: 200,
        width: width,
    },
    heroCover: {
        width: '100%',
        height: '100%',
    },
    heroCoverPlaceholder: {
        width: '100%',
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
    },
    floatingHeader: {
        position: 'absolute',
        top: spacing.lg,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.lg,
    },
    // },
    headerButton: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 4,
    },
    headerButtonGradient: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
    },
    shopCard: {
        marginHorizontal: spacing.lg,
        padding: spacing.xl,
        borderRadius: 32,
        gap: spacing.lg,
    },
    shopBrandingHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    shopTitleContainer: {
        flex: 1,
        gap: 4,
    },
    shopIdentityRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    shopNameLarge: {
        fontSize: 28,
        fontWeight: '900',
        color: colors.text,
        letterSpacing: -0.5,
    },
    statusBadgeSmall: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        backgroundColor: 'rgba(16, 185, 129, 0.2)',
        borderWidth: 1,
        borderColor: 'rgba(16, 185, 129, 0.3)',
    },
    statusDotSmall: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#10B981',
    },
    statusTextSmall: {
        fontSize: 10,
        fontWeight: '800',
        color: '#10B981',
        textTransform: 'uppercase',
    },
    categoryTextSmall: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.primary,
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
    ratingPortal: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 16,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    ratingValueLarge: {
        fontSize: 18,
        fontWeight: '900',
        color: colors.text,
    },
    shopDescriptionLarge: {
        fontSize: 15,
        color: colors.textMuted,
        lineHeight: 24,
        fontWeight: '500',
    },
    shopMetaGrid: {
        flexDirection: 'row',
        gap: spacing.md,
    },
    metaItem: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        padding: 12,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
    },
    metaIconGlow: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: colors.primary + '15',
        alignItems: 'center',
        justifyContent: 'center',
    },
    metaLabel: {
        flex: 1,
        fontSize: 13,
        fontWeight: '600',
        color: colors.text,
    },
    deliveryMetaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        marginTop: 4,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.05)',
    },
    deliveryMetaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    deliveryMetaText: {
        fontSize: 13,
        fontWeight: '700',
        color: colors.textMuted,
    },
    deliveryMetaDivider: {
        width: 1,
        height: 12,
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    productsSectionPortal: {
        padding: spacing.lg,
        marginTop: spacing.xl,
    },
    sectionHeaderPortal: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.lg,
        paddingHorizontal: spacing.xs,
    },
    sectionTitlePortal: {
        fontSize: 22,
        fontWeight: '900',
        color: colors.text,
        letterSpacing: -0.5,
    },
    itemCountBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
    },
    itemCountText: {
        fontSize: 12,
        fontWeight: '700',
        color: colors.textMuted,
    },
    productRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.md,
    },
    productGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.md,
    },
    productCardWrapper: {
        width: PRODUCT_CARD_WIDTH,
    },
    productContent: {
        padding: 0,
        overflow: 'hidden',
        borderRadius: 24,
    },
    productImageContainer: {
        width: '100%',
        height: 140,
        backgroundColor: 'rgba(255,255,255,0.05)',
    },
    productImage: {
        width: '100%',
        height: '100%',
    },
    imageOverlay: {
        ...StyleSheet.absoluteFillObject,
    },
    outOfStockOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.7)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    outOfStockText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 12,
    },
    addButton: {
        position: 'absolute',
        bottom: 12,
        right: 12,
    },
    addButtonGlow: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 8,
        elevation: 5,
    },
    productInfo: {
        padding: 12,
        gap: 4,
    },
    productName: {
        fontSize: 15,
        fontWeight: '700',
        color: colors.text,
    },
    productMeta: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    productPrice: {
        fontSize: 16,
        fontWeight: '900',
        color: colors.primary,
    },
    productRatingSmall: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    ratingTextSmall: {
        fontSize: 12,
        fontWeight: '700',
        color: colors.text,
    },
    emptyPortal: {
        padding: 40,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
    },
    emptyPortalTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: colors.text,
    },
    emptyPortalText: {
        fontSize: 14,
        color: colors.textMuted,
        textAlign: 'center',
        lineHeight: 20,
    },
    bottomSpacer: {
        height: 120,
    },
    error: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
        gap: 20,
    },
    errorText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: colors.text,
    },
    backToHomeButton: {
        paddingHorizontal: 30,
        paddingVertical: 15,
        backgroundColor: colors.primary,
        borderRadius: 20,
    },
    backToHomeText: {
        color: '#fff',
        fontWeight: '800',
        fontSize: 16,
    },
    floatingCartContainer: {
        position: 'absolute',
        bottom: 40,
        right: 24,
        zIndex: 100,
    },
    floatingCartGlass: {
        borderRadius: 30,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    floatingCartGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 15,
        gap: 12,
    },
    cartBadgeFloating: {
        backgroundColor: '#fff',
        borderRadius: 10,
        minWidth: 20,
        height: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cartBadgeTextFloating: {
        color: colors.primary,
        fontSize: 12,
        fontWeight: '900',
    },
    glossOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    offersSection: {
        marginTop: spacing.xl,
    },
    offersList: {
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing.md,
        gap: spacing.md,
    },
    couponCard: {
        width: 180,
    },
    couponGlass: {
        flexDirection: 'row',
        padding: spacing.sm,
        alignItems: 'center',
        gap: spacing.md,
        borderRadius: 16,
    },
    couponLeft: {
        alignItems: 'center',
    },
    couponBadge: {
        width: 50,
        height: 50,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    couponBadgeText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '900',
    },
    couponBadgeSub: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 8,
        fontWeight: '700',
        marginTop: -2,
    },
    couponRight: {
        flex: 1,
    },
    couponCodeText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    couponMinOrder: {
        color: colors.textMuted,
        fontSize: 10,
        fontWeight: '600',
        marginTop: 2,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: spacing.md,
        paddingHorizontal: spacing.lg,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: colors.text,
    },
});
