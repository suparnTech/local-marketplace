// app/(tabs)/cart.tsx - THE COOLEST CART SCREEN EVER! 🚀
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
    Alert,
    Dimensions,
    FlatList,
    Image,
    PanResponder,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import Animated, {
    FadeInDown,
    FadeInUp,
    SlideInRight,
    ZoomIn,
    interpolate,
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    withTiming
} from 'react-native-reanimated';
import { useDispatch, useSelector } from 'react-redux';
import { GlassCard } from '../../src/components/ui/GlassCard';
import { GlassHeader } from '../../src/components/ui/GlassHeader';
import { ImmersiveBackground } from '../../src/components/ui/ImmersiveBackground';
import { KineticCard } from '../../src/components/ui/KineticCard';
import { SafeView } from '../../src/components/ui/SafeView';
import { clearCart, removeFromCart, updateQuantity } from '../../src/store/slices/cartSlice';
import { colors } from '../../src/theme/colors';
import { gradients } from '../../src/theme/gradients';
import { borderRadius, spacing } from '../../src/theme/spacing';

const { width } = Dimensions.get('window');
const SWIPE_THRESHOLD = -100;

export default function CartScreen() {
    const dispatch = useDispatch();
    const cartItems = useSelector((state: any) => state.cart.items);
    const total = useSelector((state: any) => state.cart.total);
    const [expandedShops, setExpandedShops] = useState<Set<string>>(new Set());

    // Group items by shop
    const groupedItems = cartItems.reduce((acc: any, item: any) => {
        if (!acc[item.shop_id]) {
            acc[item.shop_id] = {
                shop_name: item.shop_name,
                items: [],
            };
        }
        acc[item.shop_id].items.push(item);
        return acc;
    }, {});

    // Calculate savings (mock - in production, compare with original prices)
    const totalSavings = Math.floor(total * 0.15); // 15% savings
    const deliveryFee = 40;
    const estimatedDelivery = '25-30 min';

    const toggleShopExpanded = (shopId: string) => {
        setExpandedShops(prev => {
            const newSet = new Set(prev);
            if (newSet.has(shopId)) {
                newSet.delete(shopId);
            } else {
                newSet.add(shopId);
            }
            return newSet;
        });
    };

    const handleUpdateQuantity = (itemId: string, newQuantity: number) => {
        if (newQuantity === 0) {
            handleRemoveItem(itemId);
        } else {
            dispatch(updateQuantity({ id: itemId, quantity: newQuantity }));
        }
    };

    const handleRemoveItem = (itemId: string) => {
        Alert.alert(
            'Remove Item',
            'Remove this item from cart?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Remove',
                    style: 'destructive',
                    onPress: () => dispatch(removeFromCart(itemId)),
                },
            ]
        );
    };

    const handleClearCart = () => {
        Alert.alert(
            'Clear Cart',
            'Remove all items from cart?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Clear All',
                    style: 'destructive',
                    onPress: () => dispatch(clearCart()),
                },
            ]
        );
    };

    const SwipeableCartItem = ({ item, index }: { item: any; index: number }) => {
        const translateX = useSharedValue(0);
        const itemHeight = useSharedValue(100);
        const opacity = useSharedValue(1);
        const [isRemoving, setIsRemoving] = useState(false);

        const confirmRemoval = () => {
            Alert.alert(
                'Remove Item',
                'Remove this item from cart?',
                [
                    {
                        text: 'Cancel',
                        style: 'cancel',
                        onPress: () => {
                            // Reset position if cancelled
                            translateX.value = withSpring(0);
                        }
                    },
                    {
                        text: 'Remove',
                        style: 'destructive',
                        onPress: () => {
                            setIsRemoving(true);
                            translateX.value = withTiming(-width);
                            itemHeight.value = withTiming(0);
                            opacity.value = withTiming(0);
                            setTimeout(() => dispatch(removeFromCart(item.id)), 300);
                        },
                    },
                ]
            );
        };

        const panResponder = useRef(
            PanResponder.create({
                onMoveShouldSetPanResponder: (_, gestureState) => {
                    return Math.abs(gestureState.dx) > 5;
                },
                onPanResponderMove: (_, gestureState) => {
                    if (gestureState.dx < 0 && !isRemoving) {
                        translateX.value = gestureState.dx;
                    }
                },
                onPanResponderRelease: (_, gestureState) => {
                    if (gestureState.dx < SWIPE_THRESHOLD && !isRemoving) {
                        // Show confirmation dialog
                        runOnJS(confirmRemoval)();
                    } else {
                        translateX.value = withSpring(0);
                    }
                },
            })
        ).current;

        const animatedStyle = useAnimatedStyle(() => ({
            transform: [{ translateX: translateX.value }],
            height: itemHeight.value,
            opacity: opacity.value,
        }));

        const deleteButtonStyle = useAnimatedStyle(() => ({
            opacity: interpolate(
                translateX.value,
                [0, SWIPE_THRESHOLD],
                [0, 1]
            ),
        }));

        return (
            <Animated.View
                entering={FadeInDown.delay(index * 50).springify()}
                style={styles.swipeableContainer}
            >
                {/* Delete Button (revealed on swipe) */}
                <Animated.View style={[styles.deleteAction, deleteButtonStyle]}>
                    <LinearGradient
                        colors={['#ef4444', '#dc2626']}
                        style={styles.deleteGradient}
                    >
                        <Ionicons name="trash" size={24} color="#fff" />
                        <Text style={styles.deleteText}>Delete</Text>
                    </LinearGradient>
                </Animated.View>

                {/* Swipeable Item */}
                <Animated.View
                    style={animatedStyle}
                    {...panResponder.panHandlers}
                >
                    <KineticCard cardWidth={width - spacing.lg * 2} borderRadius={borderRadius.lg} style={{ elevation: 0 }}>
                        <GlassCard style={styles.itemCard} intensity={20}>
                            <Image source={{ uri: item.image }} style={styles.itemImage} />

                            <View style={styles.itemInfo}>
                                <Text style={styles.itemName} numberOfLines={2}>
                                    {item.name}
                                </Text>
                                <View style={styles.priceRow}>
                                    <Text style={styles.itemPrice}>₹{item.price}</Text>
                                    {item.price > 100 && (
                                        <View style={styles.savingsBadge}>
                                            <Text style={styles.savingsText}>
                                                Save ₹{Math.floor(item.price * 0.15)}
                                            </Text>
                                        </View>
                                    )}
                                </View>
                            </View>

                            <View style={styles.itemActions}>
                                <View style={styles.quantityControl}>
                                    <TouchableOpacity
                                        onPress={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                                        style={styles.quantityButton}
                                    >
                                        <Ionicons name="remove" size={16} color={colors.text} />
                                    </TouchableOpacity>
                                    <Animated.Text
                                        key={item.quantity}
                                        entering={ZoomIn.springify()}
                                        style={styles.quantityText}
                                    >
                                        {item.quantity}
                                    </Animated.Text>
                                    <TouchableOpacity
                                        onPress={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                                        style={styles.quantityButton}
                                    >
                                        <Ionicons name="add" size={16} color={colors.text} />
                                    </TouchableOpacity>
                                </View>

                                <Text style={styles.itemTotal}>
                                    ₹{item.price * item.quantity}
                                </Text>
                            </View>
                        </GlassCard>
                    </KineticCard>
                </Animated.View>
            </Animated.View>
        );
    };

    const renderShopGroup = ({ item: [shopId, shopData], index }: any) => {
        const isExpanded = expandedShops.has(shopId);
        const shopTotal = shopData.items.reduce((sum: number, item: any) =>
            sum + item.price * item.quantity, 0
        );

        return (
            <Animated.View
                entering={FadeInDown.delay(index * 100).springify()}
                style={styles.shopGroup}
            >
                {/* Shop Header - Collapsible */}
                <TouchableOpacity
                    onPress={() => toggleShopExpanded(shopId)}
                    activeOpacity={0.7}
                >
                    <GlassCard style={styles.shopHeader}>
                        <View style={styles.shopHeaderLeft}>
                            <LinearGradient
                                colors={[colors.primary, colors.primaryDark]}
                                style={styles.shopIconContainer}
                            >
                                <Ionicons name="storefront" size={20} color="#fff" />
                            </LinearGradient>
                            <View style={styles.shopHeaderInfo}>
                                <Text style={styles.shopName}>{shopData.shop_name}</Text>
                                <Text style={styles.shopItemCount}>
                                    {shopData.items.length} {shopData.items.length === 1 ? 'item' : 'items'}
                                </Text>
                            </View>
                        </View>
                        <View style={styles.shopHeaderRight}>
                            <Text style={styles.shopTotal}>₹{shopTotal}</Text>
                            <Ionicons
                                name={isExpanded ? "chevron-up" : "chevron-down"}
                                size={20}
                                color={colors.textMuted}
                            />
                        </View>
                    </GlassCard>
                </TouchableOpacity>

                {/* Items List - Collapsible */}
                {isExpanded && (
                    <Animated.View entering={SlideInRight.springify()}>
                        <FlatList
                            data={shopData.items}
                            renderItem={({ item, index }) => (
                                <SwipeableCartItem item={item} index={index} />
                            )}
                            keyExtractor={(item) => item.id}
                            scrollEnabled={false}
                        />
                    </Animated.View>
                )}
            </Animated.View>
        );
    };

    if (cartItems.length === 0) {
        return (
            <SafeView gradient={gradients.background as any}>
                <View style={styles.container}>
                    <GlassHeader title="My Cart" />

                    <View style={styles.emptyContainer}>
                        {/* Animated Cart Icon with Floating Items */}
                        <Animated.View
                            entering={ZoomIn.delay(200).springify()}
                            style={styles.emptyIconContainer}
                        >
                            <LinearGradient
                                colors={[colors.primary + '30', colors.primaryDark + '30']}
                                style={styles.emptyIcon}
                            >
                                <Ionicons name="cart-outline" size={80} color={colors.primary} />
                            </LinearGradient>

                            {/* Floating Product Icons */}
                            <Animated.View
                                entering={FadeInUp.delay(400).springify()}
                                style={[styles.floatingIcon, styles.floatingIcon1]}
                            >
                                <LinearGradient
                                    colors={['#f97316', '#ea580c']}
                                    style={styles.floatingIconGradient}
                                >
                                    <Ionicons name="fast-food" size={24} color="#fff" />
                                </LinearGradient>
                            </Animated.View>

                            <Animated.View
                                entering={FadeInUp.delay(500).springify()}
                                style={[styles.floatingIcon, styles.floatingIcon2]}
                            >
                                <LinearGradient
                                    colors={['#8b5cf6', '#7c3aed']}
                                    style={styles.floatingIconGradient}
                                >
                                    <Ionicons name="shirt" size={24} color="#fff" />
                                </LinearGradient>
                            </Animated.View>

                            <Animated.View
                                entering={FadeInUp.delay(600).springify()}
                                style={[styles.floatingIcon, styles.floatingIcon3]}
                            >
                                <LinearGradient
                                    colors={['#06b6d4', '#0891b2']}
                                    style={styles.floatingIconGradient}
                                >
                                    <Ionicons name="phone-portrait" size={24} color="#fff" />
                                </LinearGradient>
                            </Animated.View>
                        </Animated.View>

                        {/* Compelling Copy */}
                        <Animated.Text
                            entering={FadeInUp.delay(700).springify()}
                            style={styles.emptyTitle}
                        >
                            Your cart feels lonely! 😢
                        </Animated.Text>
                        <Animated.Text
                            entering={FadeInUp.delay(800).springify()}
                            style={styles.emptySubtitle}
                        >
                            Fill it with amazing products from local shops
                        </Animated.Text>

                        {/* Special Offer Badge */}
                        <Animated.View
                            entering={ZoomIn.delay(900).springify()}
                            style={styles.offerBadge}
                        >
                            <LinearGradient
                                colors={['#10b981', '#059669']}
                                style={styles.offerGradient}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                            >
                                <Ionicons name="gift" size={16} color="#fff" />
                                <Text style={styles.offerText}>
                                    Free delivery on first order!
                                </Text>
                            </LinearGradient>
                        </Animated.View>

                        {/* Quick Category Suggestions */}
                        <Animated.View
                            entering={FadeInUp.delay(1000).springify()}
                            style={styles.quickCategories}
                        >
                            <Text style={styles.quickCategoriesTitle}>Popular Categories</Text>
                            <View style={styles.categoryChips}>
                                <TouchableOpacity
                                    style={styles.categoryChip}
                                    onPress={() => router.push('/(tabs)')}
                                >
                                    <LinearGradient
                                        colors={[colors.primary + '20', colors.primaryDark + '20']}
                                        style={styles.categoryChipGradient}
                                    >
                                        <Ionicons name="restaurant" size={16} color={colors.primary} />
                                        <Text style={styles.categoryChipText}>Food</Text>
                                    </LinearGradient>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.categoryChip}
                                    onPress={() => router.push('/(tabs)')}
                                >
                                    <LinearGradient
                                        colors={['#f97316' + '20', '#ea580c' + '20']}
                                        style={styles.categoryChipGradient}
                                    >
                                        <Ionicons name="storefront" size={16} color="#f97316" />
                                        <Text style={[styles.categoryChipText, { color: '#f97316' }]}>Grocery</Text>
                                    </LinearGradient>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.categoryChip}
                                    onPress={() => router.push('/(tabs)')}
                                >
                                    <LinearGradient
                                        colors={['#8b5cf6' + '20', '#7c3aed' + '20']}
                                        style={styles.categoryChipGradient}
                                    >
                                        <Ionicons name="medkit" size={16} color="#8b5cf6" />
                                        <Text style={[styles.categoryChipText, { color: '#8b5cf6' }]}>Health</Text>
                                    </LinearGradient>
                                </TouchableOpacity>
                            </View>
                        </Animated.View>

                        {/* Primary CTA */}
                        <Animated.View
                            entering={FadeInUp.delay(1100).springify()}
                            style={styles.ctaContainer}
                        >
                            <TouchableOpacity
                                style={styles.primaryCTA}
                                onPress={() => router.push('/(tabs)')}
                            >
                                <LinearGradient
                                    colors={gradients.primary as any}
                                    style={styles.primaryCTAGradient}
                                >
                                    <Ionicons name="storefront" size={24} color="#fff" />
                                    <Text style={styles.primaryCTAText}>Explore Shops</Text>
                                    <Ionicons name="arrow-forward" size={20} color="#fff" />
                                </LinearGradient>
                            </TouchableOpacity>

                            {/* Secondary CTA */}
                            <TouchableOpacity
                                style={styles.secondaryCTA}
                                onPress={() => router.push('/(tabs)/categories')}
                            >
                                <Text style={styles.secondaryCTAText}>Browse Categories</Text>
                                <Ionicons name="chevron-forward" size={16} color={colors.primary} />
                            </TouchableOpacity>
                        </Animated.View>

                        {/* Trust Indicators */}
                        <Animated.View
                            entering={FadeInUp.delay(1200).springify()}
                            style={styles.trustIndicators}
                        >
                            <View style={styles.trustItem}>
                                <Ionicons name="shield-checkmark" size={20} color={colors.primary} />
                                <Text style={styles.trustText}>Secure</Text>
                            </View>
                            <View style={styles.trustItem}>
                                <Ionicons name="flash" size={20} color={colors.primary} />
                                <Text style={styles.trustText}>Fast Delivery</Text>
                            </View>
                            <View style={styles.trustItem}>
                                <Ionicons name="heart" size={20} color={colors.primary} />
                                <Text style={styles.trustText}>Quality</Text>
                            </View>
                        </Animated.View>
                    </View>
                </View>
            </SafeView>
        );
    }

    return (
        <SafeView>
            <ImmersiveBackground />
            <View style={styles.container}>
                <GlassHeader
                    title={`Cart (${cartItems.length})`}
                    subtitle="Swipe left to remove items"
                    rightElement={
                        <TouchableOpacity onPress={handleClearCart}>
                            <Text style={styles.clearButton}>Clear All</Text>
                        </TouchableOpacity>
                    }
                />

                {/* Savings Banner */}
                {totalSavings > 0 && (
                    <Animated.View entering={FadeInDown.delay(200).springify()}>
                        <LinearGradient
                            colors={['#10b981', '#059669']}
                            style={styles.savingsBanner}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                        >
                            <Ionicons name="pricetag" size={20} color="#fff" />
                            <Text style={styles.savingsBannerText}>
                                You're saving ₹{totalSavings} on this order! 🎉
                            </Text>
                        </LinearGradient>
                    </Animated.View>
                )}

                {/* Cart Items */}
                <FlatList
                    data={Object.entries(groupedItems)}
                    renderItem={renderShopGroup}
                    keyExtractor={([shopId]) => shopId}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                />

                {/* Checkout Footer with Blur */}
                <Animated.View
                    entering={FadeInUp.delay(300).springify()}
                    style={styles.footer}
                >
                    <View style={styles.footerPortal}>
                        <GlassCard style={styles.totalCard} intensity={40}>
                            {/* Bill Details */}
                            <View style={styles.billDetails}>
                                <View style={styles.billRow}>
                                    <Text style={styles.billLabel}>Subtotal</Text>
                                    <Text style={styles.billValue}>₹{total}</Text>
                                </View>
                                <View style={styles.billRow}>
                                    <Text style={styles.billLabel}>Delivery Fee</Text>
                                    <Text style={styles.billValue}>₹{deliveryFee}</Text>
                                </View>
                                {totalSavings > 0 && (
                                    <View style={styles.billRow}>
                                        <Text style={[styles.billLabel, styles.savingsLabel]}>
                                            Savings
                                        </Text>
                                        <Text style={[styles.billValue, styles.savingsValue]}>
                                            -₹{totalSavings}
                                        </Text>
                                    </View>
                                )}
                                <View style={styles.divider} />
                                <View style={styles.totalRow}>
                                    <Text style={styles.totalLabel}>Total</Text>
                                    <Animated.Text
                                        key={total}
                                        entering={ZoomIn.springify()}
                                        style={styles.totalAmount}
                                    >
                                        ₹{total + deliveryFee - totalSavings}
                                    </Animated.Text>
                                </View>
                            </View>

                            {/* Delivery Estimate */}
                            <View style={styles.deliveryEstimate}>
                                <Ionicons name="time-outline" size={16} color={colors.primary} />
                                <Text style={styles.deliveryText}>
                                    Estimated delivery: {estimatedDelivery}
                                </Text>
                            </View>

                            {/* Checkout Button */}
                            <TouchableOpacity
                                style={styles.checkoutButton}
                                onPress={() => router.push('/checkout')}
                            >
                                <LinearGradient
                                    colors={gradients.primary as any}
                                    style={styles.checkoutGradient}
                                >
                                    <Text style={styles.checkoutText}>Proceed to Checkout</Text>
                                    <Ionicons name="arrow-forward" size={20} color="#fff" />
                                </LinearGradient>
                            </TouchableOpacity>
                        </GlassCard>
                        <View style={styles.footerGlow} />
                    </View>
                </Animated.View>
            </View>
        </SafeView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    headerContainer: {
        marginBottom: spacing.sm,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        padding: spacing.lg,
        paddingBottom: spacing.sm,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: colors.text,
    },
    subtitle: {
        fontSize: 12,
        color: colors.textMuted,
        marginTop: 4,
    },
    clearButton: {
        fontSize: 14,
        color: colors.primary,
        fontWeight: '600',
    },
    savingsBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        marginHorizontal: spacing.lg,
        borderRadius: borderRadius.md,
    },
    savingsBannerText: {
        flex: 1,
        fontSize: 14,
        fontWeight: '700',
        color: '#fff',
    },
    listContent: {
        padding: spacing.lg,
        paddingTop: spacing.md,
        paddingBottom: 320, // Reduced since footer moved down
    },
    shopGroup: {
        marginBottom: spacing.lg,
        gap: spacing.sm,
    },
    shopHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: spacing.md,
    },
    shopHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        flex: 1,
    },
    shopIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    shopHeaderInfo: {
        flex: 1,
    },
    shopName: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.text,
    },
    shopItemCount: {
        fontSize: 12,
        color: colors.textMuted,
        marginTop: 2,
    },
    shopHeaderRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
    },
    shopTotal: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.primary,
    },
    swipeableContainer: {
        marginBottom: spacing.sm,
        position: 'relative',
    },
    deleteAction: {
        position: 'absolute',
        right: 0,
        top: 0,
        bottom: 0,
        width: 100,
        justifyContent: 'center',
        alignItems: 'center',
    },
    deleteGradient: {
        flex: 1,
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: borderRadius.md,
        gap: 4,
    },
    deleteText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '700',
    },
    itemCard: {
        flexDirection: 'row',
        gap: spacing.md,
        padding: spacing.md,
    },
    itemImage: {
        width: 80,
        height: 80,
        borderRadius: borderRadius.md,
        backgroundColor: colors.surface,
    },
    itemInfo: {
        flex: 1,
        justifyContent: 'space-between',
    },
    itemName: {
        fontSize: 15,
        fontWeight: '600',
        color: colors.text,
        marginBottom: 4,
    },
    priceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
    },
    itemPrice: {
        fontSize: 17,
        fontWeight: 'bold',
        color: colors.primary,
    },
    savingsBadge: {
        backgroundColor: '#10b981' + '20',
        paddingHorizontal: spacing.xs,
        paddingVertical: 2,
        borderRadius: borderRadius.sm,
    },
    savingsText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#10b981',
    },
    itemActions: {
        justifyContent: 'space-between',
        alignItems: 'flex-end',
    },
    quantityControl: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
        backgroundColor: colors.surface,
        borderRadius: borderRadius.md,
        padding: 4,
    },
    quantityButton: {
        width: 28,
        height: 28,
        borderRadius: borderRadius.sm,
        backgroundColor: colors.background,
        alignItems: 'center',
        justifyContent: 'center',
    },
    quantityText: {
        fontSize: 14,
        fontWeight: '700',
        color: colors.text,
        minWidth: 24,
        textAlign: 'center',
    },
    itemTotal: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.text,
        marginTop: spacing.xs,
    },
    footer: {
        position: 'absolute',
        bottom: 60,
        left: 0,
        right: 0,
    },
    footerPortal: {
        marginHorizontal: spacing.lg,
        position: 'relative',
    },
    totalCard: {
        padding: spacing.lg,
        borderRadius: 32,
        borderWidth: 1.5,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    footerGlow: {
        position: 'absolute',
        bottom: -20,
        left: 40,
        right: 40,
        height: 40,
        backgroundColor: colors.primary,
        opacity: 0.15,
        borderRadius: 40,
        zIndex: -1,
    },
    billDetails: {
        marginBottom: spacing.md,
    },
    billRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.xs,
    },
    billLabel: {
        fontSize: 14,
        color: colors.textMuted,
        fontWeight: '500',
    },
    billValue: {
        fontSize: 14,
        fontWeight: '700',
        color: colors.text,
    },
    savingsLabel: {
        color: '#10b981',
    },
    savingsValue: {
        color: '#10b981',
    },
    divider: {
        height: 1,
        backgroundColor: colors.border + '40',
        marginVertical: spacing.sm,
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    totalLabel: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.text,
    },
    totalAmount: {
        fontSize: 28,
        fontWeight: 'bold',
        color: colors.primary,
    },
    deliveryEstimate: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.md,
        backgroundColor: colors.primary + '15',
        borderRadius: borderRadius.md,
        marginBottom: spacing.md,
    },
    deliveryText: {
        fontSize: 13,
        fontWeight: '600',
        color: colors.primary,
    },
    checkoutButton: {
        borderRadius: borderRadius.lg,
        overflow: 'hidden',
    },
    checkoutGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.sm,
        paddingVertical: spacing.md + 2,
    },
    checkoutText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.xl,
    },
    emptyIconContainer: {
        position: 'relative',
        marginBottom: spacing.xl,
    },
    emptyIcon: {
        width: 160,
        height: 160,
        borderRadius: 80,
        alignItems: 'center',
        justifyContent: 'center',
    },
    floatingIcon: {
        position: 'absolute',
        width: 56,
        height: 56,
        borderRadius: 28,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    floatingIcon1: {
        top: -10,
        right: -20,
    },
    floatingIcon2: {
        bottom: 10,
        left: -25,
    },
    floatingIcon3: {
        top: 50,
        right: -30,
    },
    floatingIconGradient: {
        width: '100%',
        height: '100%',
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyTitle: {
        fontSize: 26,
        fontWeight: 'bold',
        color: colors.text,
        marginBottom: spacing.sm,
        textAlign: 'center',
    },
    emptySubtitle: {
        fontSize: 15,
        color: colors.textMuted,
        marginBottom: spacing.lg,
        textAlign: 'center',
        paddingHorizontal: spacing.lg,
    },
    offerBadge: {
        marginBottom: spacing.xl,
    },
    offerGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.full,
    },
    offerText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#fff',
    },
    quickCategories: {
        width: '100%',
        marginBottom: spacing.xl,
    },
    quickCategoriesTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.textMuted,
        marginBottom: spacing.md,
        textAlign: 'center',
    },
    categoryChips: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: spacing.sm,
        flexWrap: 'wrap',
    },
    categoryChip: {
        borderRadius: borderRadius.full,
        overflow: 'hidden',
    },
    categoryChipGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
    },
    categoryChipText: {
        fontSize: 13,
        fontWeight: '600',
        color: colors.primary,
    },
    ctaContainer: {
        width: '100%',
        gap: spacing.md,
        marginBottom: spacing.xl,
    },
    primaryCTA: {
        borderRadius: borderRadius.lg,
        overflow: 'hidden',
    },
    primaryCTAGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.sm,
        paddingVertical: spacing.md + 4,
    },
    primaryCTAText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
    },
    secondaryCTA: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.xs,
        paddingVertical: spacing.md,
    },
    secondaryCTAText: {
        fontSize: 15,
        fontWeight: '600',
        color: colors.primary,
    },
    trustIndicators: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: spacing.xl,
    },
    trustItem: {
        alignItems: 'center',
        gap: spacing.xs,
    },
    trustText: {
        fontSize: 11,
        fontWeight: '600',
        color: colors.textMuted,
    },
    shopButton: {
        borderRadius: borderRadius.lg,
        overflow: 'hidden',
    },
    shopButtonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        paddingHorizontal: spacing.xl + spacing.md,
        paddingVertical: spacing.md + 2,
    },
    shopButtonText: {
        fontSize: 17,
        fontWeight: 'bold',
        color: '#fff',
    },
});
