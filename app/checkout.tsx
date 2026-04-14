// app/checkout.tsx - Revolutionary Checkout Screen
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    FlatList,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import Animated, {
    FadeInDown,
    FadeInRight,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withTiming
} from 'react-native-reanimated';
import { useDispatch, useSelector } from 'react-redux';
import { useQueryClient } from '@tanstack/react-query';
import { GlassCard } from '../src/components/ui/GlassCard';
import { GlassHeader } from '../src/components/ui/GlassHeader';
import { SafeView } from '../src/components/ui/SafeView';
import { api } from '../src/lib/api';
import { selectAddress, setAddresses } from '../src/store/slices/addressSlice';
import { clearCart } from '../src/store/slices/cartSlice';
import { colors } from '../src/theme/colors';
import { gradients } from '../src/theme/gradients';
import { borderRadius, spacing } from '../src/theme/spacing';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.75;

export default function CheckoutScreen() {
    const dispatch = useDispatch();
    const queryClient = useQueryClient();
    const cartItems = useSelector((state: any) => state.cart.items);
    const total = useSelector((state: any) => state.cart.total);

    const addresses = useSelector((state: any) => state.address.addresses);
    const selectedAddress = useSelector((state: any) => state.address.selectedAddress);
    const [paymentMethod, setPaymentMethod] = useState<'cod' | 'online'>('cod');
    const [currentStep, setCurrentStep] = useState(0); // 0: Address, 1: Payment, 2: Review
    const [placing, setPlacing] = useState(false);
    const [couponCode, setCouponCode] = useState('');
    const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
    const [validatingCoupon, setValidatingCoupon] = useState(false);

    const deliveryFee = 40;
    const tax = Math.round(total * 0.05);
    const discount = appliedCoupon ? appliedCoupon.discount_amount : 0;
    const grandTotal = total + deliveryFee + tax - discount;

    // Shimmer effect for button
    const shimmerValue = useSharedValue(-1);
    useEffect(() => {
        shimmerValue.value = withRepeat(
            withTiming(2, { duration: 1500 }),
            -1,
            false
        );
    }, []);

    const shimmerStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: shimmerValue.value * width }],
    }));

    // Fetch addresses when screen comes into focus
    useFocusEffect(
        useCallback(() => {
            fetchAddresses();
        }, [])
    );

    const fetchAddresses = async () => {
        try {
            const response = await api.get('/api/addresses');
            dispatch(setAddresses(response.data));
            // Auto-select first address if none selected
            if (!selectedAddress && response.data.length > 0) {
                dispatch(selectAddress(response.data[0]));
            }
        } catch (error) {
            console.error('Failed to fetch addresses:', error);
        }
    };

    const handlePlaceOrder = async () => {
        if (!selectedAddress) {
            Alert.alert('Address Required', 'Please select a delivery address');
            return;
        }

        if (paymentMethod === 'online') {
            handleRazorpayPayment();
        } else {
            handleCODPayment();
        }
    };

    const handleRazorpayPayment = async () => {
        try {
            setPlacing(true);
            const { data } = await api.post('/api/orders/create-razorpay-order', {
                amount: grandTotal,
                orderId: `temp_${Date.now()}`,
            });

            Alert.alert(
                '🔐 Secure Payment',
                `Ready to pay ₹${grandTotal} via Razorpay Secure Gateway?`,
                [
                    { text: 'Cancel', style: 'cancel', onPress: () => setPlacing(false) },
                    {
                        text: 'Yes, Pay Now',
                        onPress: async () => {
                            await createOrder({
                                razorpay_payment_id: `mock_pay_${Date.now()}`,
                                razorpay_order_id: data.razorpayOrderId,
                                razorpay_signature: 'mock_signature',
                            });
                        },
                    },
                ]
            );
        } catch (error) {
            Alert.alert('Error', 'Failed to initiate payment');
            setPlacing(false);
        }
    };

    const handleCODPayment = async () => {
        Alert.alert(
            'Confirm Order',
            `Place your order for ₹${grandTotal} with Cash on Delivery?`,
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Confirm Order', onPress: () => createOrder({}) },
            ]
        );
    };

    const handleApplyCoupon = async () => {
        if (!couponCode.trim()) return;

        try {
            setValidatingCoupon(true);
            const response = await api.post('/api/orders/validate-coupon', {
                code: couponCode,
                items: cartItems
            });

            setAppliedCoupon(response.data);
            Alert.alert('Success', response.data.message);
        } catch (error: any) {
            const errorMsg = error.response?.data?.error || 'Failed to apply coupon';
            Alert.alert('Coupon Error', errorMsg);
            setAppliedCoupon(null);
        } finally {
            setValidatingCoupon(false);
        }
    };

    const createOrder = async (paymentData: any) => {
        try {
            setPlacing(true);
            const itemsByStore: any = {};
            cartItems.forEach((item: any) => {
                const storeId = item.store_id || item.shop_id;
                if (!itemsByStore[storeId]) itemsByStore[storeId] = [];
                itemsByStore[storeId].push(item);
            });

            const orderPromises = Object.entries(itemsByStore).map(([storeId, items]: [string, any]) => {
                const storeTotal = items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);
                return api.post('/api/orders', {
                    items: items.map((item: any) => ({
                        product_id: item.product_id || item.id,
                        quantity: item.quantity,
                        price: item.price,
                        store_id: storeId,
                    })),
                    address_id: selectedAddress.id,
                    payment_method: paymentMethod,
                    subtotal: storeTotal,
                    delivery_fee: deliveryFee,
                    tax,
                    total: storeTotal + deliveryFee + tax,
                    coupon_code: appliedCoupon?.code === couponCode ? couponCode : null,
                    ...paymentData,
                });
            });

            await Promise.all(orderPromises);
            dispatch(clearCart());
            await queryClient.invalidateQueries({ queryKey: ['orders'] });
            router.replace('/(tabs)/orders');
        } catch (error) {
            Alert.alert('Error', 'Failed to place order. Please try again.');
        } finally {
            setPlacing(false);
        }
    };

    const renderAddressCard = ({ item }: { item: any }) => (
        <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => dispatch(selectAddress(item))}
            style={[
                styles.addressCardContainer,
                selectedAddress?.id === item.id && styles.addressCardSelected
            ]}
        >
            <GlassCard intensity={selectedAddress?.id === item.id ? 30 : 15} style={styles.addressCard}>
                <View style={styles.addressHeader}>
                    <MaterialCommunityIcons
                        name={item.is_default ? "home-heart" : "map-marker"}
                        size={24}
                        color={selectedAddress?.id === item.id ? colors.primary : colors.textMuted}
                    />
                    {item.is_default && <View style={styles.defaultBadge}><Text style={styles.defaultText}>Default</Text></View>}
                </View>
                <Text style={styles.addressName} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.addressText} numberOfLines={2}>
                    {item.address_line1}, {item.city}
                </Text>
                <View style={styles.addressFooter}>
                    <Ionicons name="call-outline" size={14} color={colors.textMuted} />
                    <Text style={styles.addressPhone}>{item.phone}</Text>
                </View>
                {selectedAddress?.id === item.id && (
                    <Animated.View entering={FadeInRight} style={styles.checkBadge}>
                        <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                    </Animated.View>
                )}
            </GlassCard>
        </TouchableOpacity>
    );

    const StepIndicator = () => (
        <View style={styles.stepIndicator}>
            {['Address', 'Payment', 'Review'].map((step, idx) => (
                <View key={step} style={styles.stepItem}>
                    <View style={[
                        styles.stepDot,
                        currentStep >= idx && styles.stepDotActive,
                        currentStep === idx && styles.stepDotPulse
                    ]}>
                        {currentStep > idx ? (
                            <Ionicons name="checkmark" size={12} color={colors.text} />
                        ) : (
                            <Text style={styles.stepNumber}>{idx + 1}</Text>
                        )}
                    </View>
                    <Text style={[styles.stepText, currentStep >= idx && styles.stepTextActive]}>{step}</Text>
                    {idx < 2 && <View style={[styles.stepLine, currentStep > idx && styles.stepLineActive]} />}
                </View>
            ))}
        </View>
    );

    return (
        <SafeView gradient={gradients.background as any}>
            <View style={styles.container}>
                {/* Header */}
                <GlassHeader
                    title="Secure Checkout"
                    showBackButton
                    rightElement={
                        <View style={styles.lockIcon}>
                            <Ionicons name="lock-closed" size={18} color={colors.primary} />
                        </View>
                    }
                />

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                    <Animated.View entering={FadeInDown.delay(100)}>
                        <StepIndicator />
                    </Animated.View>

                    {/* Section 1: Address */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Delivery Destination</Text>
                            <TouchableOpacity onPress={() => router.push('/addresses')}>
                                <Text style={styles.manageBtn}>Manage All</Text>
                            </TouchableOpacity>
                        </View>
                        <FlatList
                            horizontal
                            data={addresses}
                            renderItem={renderAddressCard}
                            keyExtractor={(item) => item.id.toString()}
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.carouselContainer}
                            snapToInterval={CARD_WIDTH + spacing.md}
                            decelerationRate="fast"
                            ListEmptyComponent={
                                <TouchableOpacity style={styles.addAddressCard} onPress={() => router.push('/addresses')}>
                                    <Ionicons name="add" size={40} color={colors.primary} />
                                    <Text style={styles.addAddressText}>Add New Address</Text>
                                </TouchableOpacity>
                            }
                        />
                    </View>

                    {/* Section 2: Payment */}
                    <Animated.View entering={FadeInDown.delay(300)} style={styles.section}>
                        <Text style={styles.sectionTitle}>Payment Method</Text>
                        <View style={styles.paymentContainer}>
                            <TouchableOpacity
                                onPress={() => {
                                    setPaymentMethod('cod');
                                    setCurrentStep(1);
                                }}
                                style={[styles.paymentCard, paymentMethod === 'cod' && styles.paymentSelected]}
                            >
                                <GlassCard intensity={paymentMethod === 'cod' ? 40 : 15} style={styles.glassPayment}>
                                    <MaterialCommunityIcons name="cash-multiple" size={32} color={paymentMethod === 'cod' ? colors.primary : colors.textMuted} />
                                    <Text style={[styles.paymentLabel, paymentMethod === 'cod' && styles.paymentLabelActive]}>Pay on Delivery</Text>
                                    <Text style={styles.paymentDesc}>Pay when you receive</Text>
                                </GlassCard>
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={() => {
                                    setPaymentMethod('online');
                                    setCurrentStep(1);
                                }}
                                style={[styles.paymentCard, paymentMethod === 'online' && styles.paymentSelected]}
                            >
                                <GlassCard intensity={paymentMethod === 'online' ? 40 : 15} style={styles.glassPayment}>
                                    <MaterialCommunityIcons name="credit-card-wireless" size={32} color={paymentMethod === 'online' ? colors.primary : colors.textMuted} />
                                    <Text style={[styles.paymentLabel, paymentMethod === 'online' && styles.paymentLabelActive]}>Razorpay Secure</Text>
                                    <Text style={styles.paymentDesc}>Cards, UPI, Netbanking</Text>
                                </GlassCard>
                            </TouchableOpacity>
                        </View>
                    </Animated.View>

                    {/* Rewards Teaser - NEW REVOLUTIONARY ELEMENT */}
                    <Animated.View entering={FadeInDown.delay(400)}>
                        <LinearGradient
                            colors={['rgba(132, 204, 22, 0.1)', 'rgba(16, 185, 129, 0.05)']}
                            style={styles.rewardsBox}
                        >
                            <View style={styles.rewardsLeft}>
                                <View style={styles.giftIcon}>
                                    <MaterialCommunityIcons name="gift-outline" size={24} color={colors.primary} />
                                </View>
                                <View>
                                    <Text style={styles.rewardsTitle}>Earn 50 Reward Points</Text>
                                    <Text style={styles.rewardsSubtitle}>Unlock exclusive deals on next order</Text>
                                </View>
                            </View>
                            <Ionicons name="chevron-forward" size={18} color={colors.primary} />
                        </LinearGradient>
                    </Animated.View>

                    {/* Section: Coupons & Offers */}
                    <Animated.View entering={FadeInDown.delay(450)} style={styles.section}>
                        <GlassCard style={styles.couponSectionGlass}>
                            <View style={styles.couponHeader}>
                                <MaterialCommunityIcons name="ticket-percent" size={20} color={colors.primary} />
                                <Text style={styles.couponTitle}>Coupons & Offers</Text>
                            </View>
                            <View style={styles.couponInputRow}>
                                <TextInput
                                    style={styles.couponInput}
                                    placeholder="Enter coupon code"
                                    placeholderTextColor={colors.textMuted}
                                    value={couponCode}
                                    onChangeText={(text) => setCouponCode(text.toUpperCase())}
                                    autoCapitalize="characters"
                                    editable={!appliedCoupon}
                                />
                                {appliedCoupon ? (
                                    <TouchableOpacity
                                        style={styles.removeCouponBtn}
                                        onPress={() => {
                                            setAppliedCoupon(null);
                                            setCouponCode('');
                                        }}
                                    >
                                        <Text style={styles.removeCouponText}>Remove</Text>
                                    </TouchableOpacity>
                                ) : (
                                    <TouchableOpacity
                                        style={[styles.applyCouponBtn, !couponCode && styles.applyCouponBtnDisabled]}
                                        onPress={handleApplyCoupon}
                                        disabled={!couponCode || validatingCoupon}
                                    >
                                        {validatingCoupon ? (
                                            <ActivityIndicator size="small" color="#fff" />
                                        ) : (
                                            <Text style={styles.applyCouponText}>Apply</Text>
                                        )}
                                    </TouchableOpacity>
                                )}
                            </View>
                            {appliedCoupon && (
                                <View style={styles.appliedBadge}>
                                    <Ionicons name="checkmark-circle" size={14} color="#10B981" />
                                    <Text style={styles.appliedText}>
                                        '{appliedCoupon.code}' applied! You saved ₹{appliedCoupon.discount_amount}
                                    </Text>
                                </View>
                            )}
                        </GlassCard>
                    </Animated.View>

                    {/* Section 3: Summary */}
                    <Animated.View entering={FadeInDown.delay(500)} style={styles.section}>
                        <GlassCard style={styles.summaryCard}>
                            <View style={styles.summaryHeader}>
                                <Text style={styles.summaryTitle}>Bill Summary</Text>
                                <View style={styles.totalBadge}>
                                    <Text style={styles.totalBadgeText}>{cartItems.length} Items</Text>
                                </View>
                            </View>

                            <View style={styles.priceRow}>
                                <Text style={styles.priceLabel}>Items Total</Text>
                                <Text style={styles.priceValue}>₹{total}</Text>
                            </View>
                            <View style={styles.priceRow}>
                                <Text style={styles.priceLabel}>Delivery Partner Fee</Text>
                                <Text style={styles.priceValue}>₹{deliveryFee}</Text>
                            </View>
                            <View style={styles.priceRow}>
                                <Text style={styles.priceLabel}>Platform Tax & Charges</Text>
                                <Text style={styles.priceValue}>₹{tax}</Text>
                            </View>
                            {discount > 0 && (
                                <View style={styles.priceRow}>
                                    <Text style={styles.discountLabel}>Coupon Discount</Text>
                                    <Text style={styles.discountValue}>-₹{discount}</Text>
                                </View>
                            )}

                            <View style={styles.divider} />

                            <View style={styles.grandTotalRow}>
                                <View>
                                    <Text style={styles.grandTotalLabel}>Grand Total</Text>
                                    <Text style={styles.inclusiveText}>Inclusive of all taxes</Text>
                                </View>
                                <Text style={styles.grandTotalValue}>₹{grandTotal}</Text>
                            </View>

                            <View style={styles.savingsBox}>
                                <MaterialCommunityIcons name="heart-flash" size={20} color={colors.primary} />
                                <Text style={styles.savingsText}>You're supporting local shops in your town!</Text>
                            </View>
                        </GlassCard>
                    </Animated.View>

                    {/* Trust Architecture */}
                    <View style={styles.trustRow}>
                        <View style={styles.trustItem}>
                            <Ionicons name="shield-checkmark" size={20} color={colors.primary} />
                            <Text style={styles.trustText}>100% Safe</Text>
                        </View>
                        <View style={styles.trustItem}>
                            <Ionicons name="flash" size={20} color={colors.primary} />
                            <Text style={styles.trustText}>Fast Delivery</Text>
                        </View>
                        <View style={styles.trustItem}>
                            <Ionicons name="storefront" size={20} color={colors.primary} />
                            <Text style={styles.trustText}>Verified Shop</Text>
                        </View>
                    </View>

                    <View style={{ height: 140 }} />
                </ScrollView>

                {/* Footer Button */}
                <BlurView intensity={80} tint="dark" style={styles.footerContainer}>
                    <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={handlePlaceOrder}
                        disabled={placing || !selectedAddress}
                        style={styles.payButton}
                    >
                        <LinearGradient
                            colors={gradients.primary as any}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.payGradient}
                        >
                            <Animated.View style={[styles.shimmer, shimmerStyle]}>
                                <LinearGradient
                                    colors={['transparent', 'rgba(255,255,255,0.3)', 'transparent']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={StyleSheet.absoluteFill}
                                />
                            </Animated.View>

                            {placing ? (
                                <ActivityIndicator color={colors.text} size="small" />
                            ) : (
                                <View style={styles.buttonContent}>
                                    <View>
                                        <Text style={styles.buttonPrice}>₹{grandTotal}</Text>
                                        <Text style={styles.buttonAction}>Confirm & Pay</Text>
                                    </View>
                                    <View style={styles.buttonEmoji}>
                                        <Text style={{ fontSize: 24 }}>✨</Text>
                                        <Ionicons name="chevron-forward" size={20} color={colors.text} />
                                    </View>
                                </View>
                            )}
                        </LinearGradient>
                    </TouchableOpacity>
                </BlurView>
            </View>
        </SafeView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.xl,
        paddingVertical: spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)',
    },
    backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center' },
    title: { fontSize: 18, fontWeight: '800', color: colors.text, letterSpacing: 0.5 },
    lockIcon: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
    scrollContent: { paddingHorizontal: spacing.lg, paddingTop: spacing.md },
    stepIndicator: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xl, paddingHorizontal: spacing.sm },
    stepItem: { flex: 1, position: 'relative', alignItems: 'center' },
    stepDot: { width: 24, height: 24, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center', zIndex: 2 },
    stepDotActive: { backgroundColor: colors.primary },
    stepDotPulse: { borderWidth: 3, borderColor: 'rgba(16, 185, 129, 0.3)' },
    stepNumber: { fontSize: 10, fontWeight: '800', color: colors.textMuted },
    stepText: { fontSize: 10, color: colors.textMuted, marginTop: 4, fontWeight: '600' },
    stepTextActive: { color: colors.primary },
    stepLine: { position: 'absolute', top: 12, left: '60%', width: '80%', height: 2, backgroundColor: 'rgba(255,255,255,0.05)', zIndex: 1 },
    stepLineActive: { backgroundColor: colors.primary },

    section: { marginBottom: spacing.xl },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
    sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.text, opacity: 0.9 },
    manageBtn: { fontSize: 13, color: colors.primary, fontWeight: '600' },
    carouselContainer: { paddingRight: spacing.xl },
    addressCardContainer: { width: CARD_WIDTH, marginRight: spacing.md },
    addressCard: { padding: spacing.md, height: 150, borderLeftWidth: 3, borderLeftColor: 'transparent' },
    addressCardSelected: { transform: [{ scale: 1.02 }] },
    addressHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
    defaultBadge: { backgroundColor: 'rgba(16, 185, 129, 0.1)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
    defaultText: { color: colors.primary, fontSize: 10, fontWeight: '800', textTransform: 'uppercase' },
    addressName: { fontSize: 16, fontWeight: '800', color: colors.text, marginBottom: 4 },
    addressText: { fontSize: 13, color: colors.textMuted, lineHeight: 18 },
    addressFooter: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 'auto' },
    addressPhone: { fontSize: 13, color: colors.textMuted, fontWeight: '500' },
    checkBadge: { position: 'absolute', bottom: spacing.md, right: spacing.md },
    addAddressCard: { width: CARD_WIDTH, height: 150, borderRadius: borderRadius.lg, borderStyle: 'dashed', borderWidth: 2, borderColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center', gap: spacing.sm },
    addAddressText: { color: colors.textMuted, fontSize: 14, fontWeight: '600' },

    paymentContainer: { flexDirection: 'row', gap: spacing.md },
    paymentCard: { flex: 1 },
    glassPayment: { padding: spacing.md, alignItems: 'center', gap: spacing.xs, height: 110 },
    paymentSelected: { borderColor: colors.primary, borderWidth: 1, borderRadius: borderRadius.lg },
    paymentLabel: { fontSize: 14, fontWeight: '700', color: colors.text, marginTop: 4 },
    paymentLabelActive: { color: colors.primary },
    paymentDesc: { fontSize: 10, color: colors.textMuted, textAlign: 'center' },

    summaryCard: { padding: spacing.lg },
    summaryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg },
    summaryTitle: { fontSize: 18, fontWeight: '900', color: colors.text },
    totalBadge: { backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
    totalBadgeText: { color: colors.text, fontSize: 12, fontWeight: '700' },
    priceRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.md },
    priceLabel: { fontSize: 14, color: colors.textMuted, fontWeight: '500' },
    priceValue: { fontSize: 15, color: colors.text, fontWeight: '700' },
    divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.05)', marginVertical: spacing.md },
    grandTotalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    grandTotalLabel: { fontSize: 16, fontWeight: '800', color: colors.text },
    inclusiveText: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
    grandTotalValue: { fontSize: 24, fontWeight: '900', color: colors.primary },
    savingsBox: { backgroundColor: 'rgba(16, 185, 129, 0.05)', padding: spacing.md, borderRadius: borderRadius.md, marginTop: spacing.lg, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    savingsText: { color: colors.primary, fontSize: 11, fontWeight: '600', flex: 1 },

    rewardsBox: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: spacing.md,
        borderRadius: borderRadius.lg,
        marginVertical: spacing.sm,
        borderWidth: 1,
        borderColor: 'rgba(132, 204, 22, 0.2)',
    },
    rewardsLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
    giftIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(16, 185, 129, 0.1)', justifyContent: 'center', alignItems: 'center' },
    rewardsTitle: { fontSize: 14, fontWeight: '800', color: colors.text },
    rewardsSubtitle: { fontSize: 11, color: colors.textMuted, fontWeight: '500' },

    trustRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.xl, paddingHorizontal: spacing.sm },
    trustItem: { alignItems: 'center', gap: 6 },
    trustText: { fontSize: 10, color: colors.textMuted, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },

    footerContainer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: spacing.lg, paddingBottom: spacing.xl, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)' },
    payButton: { borderRadius: borderRadius.xl, overflow: 'hidden', elevation: 10, shadowColor: colors.primary, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 20 },
    payGradient: { paddingVertical: spacing.lg, paddingHorizontal: spacing.xl, minHeight: 70, justifyContent: 'center' },
    buttonContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    buttonPrice: { color: colors.text, fontSize: 24, fontWeight: '900' },
    buttonAction: { color: colors.text, fontSize: 14, fontWeight: '600', opacity: 0.9 },
    buttonEmoji: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    shimmer: { position: 'absolute', top: 0, left: 0, width: '40%', height: '100%', opacity: 0.5 },

    couponSectionGlass: { padding: spacing.md, borderRadius: borderRadius.lg },
    couponHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: spacing.sm },
    couponTitle: { fontSize: 14, fontWeight: '700', color: colors.text },
    couponInputRow: { flexDirection: 'row', gap: spacing.sm },
    couponInput: { flex: 1, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 10, color: '#fff', fontSize: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    applyCouponBtn: { backgroundColor: colors.primary, borderRadius: 12, paddingHorizontal: 20, justifyContent: 'center' },
    applyCouponBtnDisabled: { opacity: 0.5 },
    applyCouponText: { color: '#fff', fontWeight: '700', fontSize: 14 },
    removeCouponBtn: { backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: 12, paddingHorizontal: 15, justifyContent: 'center' },
    removeCouponText: { color: '#EF4444', fontWeight: '700', fontSize: 13 },
    appliedBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10, backgroundColor: 'rgba(16, 185, 129, 0.05)', padding: 8, borderRadius: 8 },
    appliedText: { color: '#10B981', fontSize: 12, fontWeight: '600' },
    discountLabel: { fontSize: 14, color: '#10B981', fontWeight: '600' },
    discountValue: { fontSize: 15, color: '#10B981', fontWeight: '800' },
});
