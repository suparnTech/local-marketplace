// src/components/ProductDetailModal.tsx
// Compact centered modal for product details

import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import {
    Dimensions,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import Animated, {
    FadeInUp,
    interpolate,
    SharedValue,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    withTiming
} from 'react-native-reanimated';
import { useDispatch } from 'react-redux';
import { addToCart } from '../store/slices/cartSlice';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { Product } from '../types/api';

const { width, height } = Dimensions.get('window');
const MODAL_WIDTH = width * 0.92;
const MODAL_HEIGHT = height * 0.85;
const IMAGE_HEIGHT = 380;



interface ProductDetailModalProps {
    visible: boolean;
    product: Product | null;
    onClose: () => void;
}

const PaginationDot = ({ index, position }: { index: number; position: SharedValue<number> }) => {
    const dotStyle = useAnimatedStyle(() => {
        const distance = Math.abs(position.value - index);
        const scale = interpolate(distance, [0, 1, 2], [1.2, 0.8, 0.8]);
        const opacity = interpolate(distance, [0, 1, 2], [1, 0.4, 0.4]);
        const width = interpolate(distance, [0, 1], [24, 8], 'clamp');

        return {
            width,
            height: 8,
            borderRadius: 4,
            backgroundColor: colors.primary,
            marginHorizontal: 4,
            opacity,
            transform: [{ scale }],
        };
    });

    return <Animated.View style={dotStyle} />;
};

export function ProductDetailModal({ visible, product, onClose }: ProductDetailModalProps) {
    const dispatch = useDispatch();
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [quantity, setQuantity] = useState(1);
    const [selectedVariant, setSelectedVariant] = useState<any>(null);

    const modalScale = useSharedValue(0.8);
    const modalOpacity = useSharedValue(0);
    const imageTiltX = useSharedValue(0);
    const imageTiltY = useSharedValue(0);
    const indicatorPosition = useSharedValue(0);

    React.useEffect(() => {
        if (visible) {
            modalScale.value = withSpring(1, { damping: 12, stiffness: 100 });
            modalOpacity.value = withTiming(1, { duration: 400 });
        } else {
            modalScale.value = withSpring(0.8);
            modalOpacity.value = withTiming(0, { duration: 300 });
        }
    }, [visible]);

    const resetImageTilt = () => {
        'worklet';
        imageTiltX.value = withSpring(0);
        imageTiltY.value = withSpring(0);
    };

    const images = product?.images || [];

    const handleAddToCart = () => {
        if (!product) return;
        dispatch(addToCart({
            id: product.id,
            product_id: product.id,
            shop_id: product.store_id || product.shop_id || '',
            store_id: product.store_id || product.shop_id || '',
            shop_name: product.shop_name || product.store?.name || 'Unknown Store',
            name: product.name,
            price: product.price,
            quantity,
            image: product.image_url || (product.images && product.images[0]) || '',
            selected_variant: selectedVariant,
        }));
        onClose();
    };

    const containerStyle = useAnimatedStyle(() => ({
        transform: [{ scale: modalScale.value }],
        opacity: modalOpacity.value,
    }));

    const imageStyle = useAnimatedStyle(() => ({
        transform: [
            { perspective: 1000 },
            { rotateX: `${imageTiltY.value}deg` },
            { rotateY: `${imageTiltX.value}deg` },
        ],
    }));

    const handleImageMove = (event: any) => {
        'worklet';
        const { locationX, locationY } = event.nativeEvent;
        imageTiltX.value = interpolate(locationX, [0, MODAL_WIDTH], [-10, 10]);
        imageTiltY.value = interpolate(locationY, [0, IMAGE_HEIGHT], [10, -10]);
    };

    if (!product) return null;

    return (
        <Modal
            visible={visible}
            transparent
            animationType="none"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />
                <TouchableOpacity
                    style={StyleSheet.absoluteFill}
                    activeOpacity={1}
                    onPress={onClose}
                />

                <Animated.View style={[styles.modalContainer, containerStyle]}>
                    <BlurView intensity={60} tint="dark" style={styles.glassContent}>
                        {/* Immersive Header Image */}
                        <View
                            style={styles.imageWrapper}
                            onTouchMove={handleImageMove}
                            onTouchEnd={resetImageTilt}
                        >
                            <Animated.View style={[styles.imageInner, imageStyle]}>
                                <ScrollView
                                    horizontal
                                    pagingEnabled
                                    showsHorizontalScrollIndicator={false}
                                    onScroll={(e) => {
                                        indicatorPosition.value = e.nativeEvent.contentOffset.x / MODAL_WIDTH;
                                    }}
                                    scrollEventThrottle={16}
                                    onMomentumScrollEnd={(e) => {
                                        const index = Math.round(e.nativeEvent.contentOffset.x / MODAL_WIDTH);
                                        setCurrentImageIndex(index);
                                    }}
                                >
                                    {images.map((image, index) => (
                                        <View key={index} style={styles.imageSlide}>
                                            <Image
                                                source={{ uri: image }}
                                                style={styles.productImage}
                                                contentFit="cover"
                                                transition={500}
                                            />
                                            <LinearGradient
                                                colors={['transparent', 'rgba(0,0,0,0.4)']}
                                                style={styles.imageOverlay}
                                            />
                                        </View>
                                    ))}
                                </ScrollView>

                                {/* Liquid Indicator */}
                                <View style={styles.indicatorContainer}>
                                    {images.map((_, i) => (
                                        <PaginationDot key={i} index={i} position={indicatorPosition} />
                                    ))}
                                </View>
                            </Animated.View>

                            {/* Floating Indicators */}
                            <View style={styles.indicators}>
                                {images.map((_, index) => (
                                    <View
                                        key={index}
                                        style={[
                                            styles.indicator,
                                            index === currentImageIndex && styles.activeIndicator,
                                        ]}
                                    />
                                ))}
                            </View>

                            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                                <BlurView intensity={50} tint="light" style={styles.closeBlur}>
                                    <Ionicons name="close" size={24} color="#fff" />
                                </BlurView>
                            </TouchableOpacity>
                        </View>

                        {/* Liquid Content Section */}
                        <ScrollView style={styles.contentScroll} showsVerticalScrollIndicator={false}>
                            <Animated.View entering={FadeInUp.delay(200).springify()}>
                                <View style={styles.headerInfo}>
                                    <Text style={styles.productName}>{product.name}</Text>
                                    <View style={styles.metaRow}>
                                        <Text style={styles.priceText}>₹{product.price}</Text>
                                        <View style={styles.ratingBadge}>
                                            <Ionicons name="star" size={16} color={colors.accent} />
                                            <Text style={styles.ratingValue}>
                                                {product.rating ? Number(product.rating).toFixed(1) : '0.0'}
                                            </Text>
                                        </View>
                                    </View>
                                </View>
                            </Animated.View>

                            <Animated.View entering={FadeInUp.delay(300).springify()}>
                                <View style={styles.descriptionSection}>
                                    <Text style={styles.sectionTitle}>About this item</Text>
                                    <Text style={styles.descriptionText}>{product.description}</Text>
                                </View>
                            </Animated.View>

                            {/* Additional Detailing (Unique Feature) */}
                            <Animated.View entering={FadeInUp.delay(400).springify()}>
                                <View style={styles.trustBanner}>
                                    <View style={styles.trustItem}>
                                        <Ionicons name="shield-checkmark" size={20} color={colors.primary} />
                                        <Text style={styles.trustText}>Authentic</Text>
                                    </View>
                                    <View style={styles.trustItem}>
                                        <Ionicons name="flash" size={20} color={colors.accent} />
                                        <Text style={styles.trustText}>Fast Delivery</Text>
                                    </View>
                                    <View style={styles.trustItem}>
                                        <Ionicons name="leaf" size={20} color="#10b981" />
                                        <Text style={styles.trustText}>Eco Friendly</Text>
                                    </View>
                                </View>
                            </Animated.View>
                        </ScrollView>

                        {/* Persistent Footer Action */}
                        <BlurView intensity={80} tint="dark" style={styles.footer}>
                            <View style={styles.footerLayout}>
                                <View style={styles.quantityControl}>
                                    <TouchableOpacity
                                        onPress={() => setQuantity(Math.max(1, quantity - 1))}
                                        style={styles.qBtn}
                                    >
                                        <Ionicons name="remove" size={20} color="#fff" />
                                    </TouchableOpacity>
                                    <Text style={styles.qText}>{quantity}</Text>
                                    <TouchableOpacity
                                        onPress={() => setQuantity(Math.min(product.stock_quantity, quantity + 1))}
                                        style={styles.qBtn}
                                    >
                                        <Ionicons name="add" size={20} color="#fff" />
                                    </TouchableOpacity>
                                </View>

                                <TouchableOpacity
                                    style={styles.mainAction}
                                    onPress={handleAddToCart}
                                >
                                    <LinearGradient
                                        colors={[colors.primary, colors.primaryDark]}
                                        style={styles.actionGradient}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 0 }}
                                    >
                                        <Ionicons name="cart" size={22} color="#fff" />
                                        <Text style={styles.actionText}>Add to Cart</Text>
                                    </LinearGradient>
                                </TouchableOpacity>
                            </View>
                        </BlurView>
                    </BlurView>
                </Animated.View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContainer: {
        width: MODAL_WIDTH,
        height: MODAL_HEIGHT,
        borderRadius: 40,
        overflow: 'hidden',
        borderWidth: 1.5,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    glassContent: {
        flex: 1,
    },
    imageWrapper: {
        height: IMAGE_HEIGHT,
        overflow: 'hidden',
        backgroundColor: colors.surface,
    },
    imageInner: {
        flex: 1,
    },
    imageSlide: {
        width: MODAL_WIDTH,
        height: IMAGE_HEIGHT,
        position: 'relative',
    },
    productImage: {
        width: '100%',
        height: '100%',
    },
    imageOverlay: {
        ...StyleSheet.absoluteFillObject,
    },
    closeButton: {
        position: 'absolute',
        top: spacing.lg,
        right: spacing.lg,
        zIndex: 10,
    },
    closeBlur: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    indicators: {
        position: 'absolute',
        bottom: 25,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 8,
    },
    indicator: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: 'rgba(255,255,255,0.4)',
    },
    activeIndicator: {
        backgroundColor: '#fff',
        width: 24,
    },
    contentScroll: {
        flex: 1,
        padding: spacing.xl,
    },
    headerInfo: {
        gap: spacing.sm,
        marginBottom: spacing.xl,
    },
    productName: {
        fontSize: 28,
        fontWeight: '900',
        color: '#fff',
        letterSpacing: -0.5,
    },
    metaRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    priceText: {
        fontSize: 32,
        fontWeight: 'bold',
        color: colors.primary,
    },
    ratingBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: 'rgba(255,215,0,0.15)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    ratingValue: {
        color: colors.accent,
        fontWeight: 'bold',
        fontSize: 16,
    },
    descriptionSection: {
        gap: spacing.sm,
        marginBottom: spacing.xl,
    },
    sectionTitle: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '800',
        opacity: 0.9,
    },
    descriptionText: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 15,
        lineHeight: 24,
    },
    trustBanner: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        backgroundColor: 'rgba(255,255,255,0.05)',
        padding: spacing.lg,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    trustItem: {
        alignItems: 'center',
        gap: 6,
    },
    trustText: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 11,
        fontWeight: '700',
    },
    footer: {
        padding: spacing.lg,
        paddingBottom: spacing.xl,
        borderTopWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    footerLayout: {
        flexDirection: 'row',
        gap: spacing.md,
        alignItems: 'center',
    },
    quantityControl: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 30,
        padding: 6,
    },
    qBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.1)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    qText: {
        color: '#fff',
        width: 40,
        textAlign: 'center',
        fontSize: 18,
        fontWeight: 'bold',
    },
    mainAction: {
        flex: 1,
        height: 60,
        borderRadius: 30,
        overflow: 'hidden',
    },
    actionGradient: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
    },
    actionText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    indicatorContainer: {
        flexDirection: 'row',
        position: 'absolute',
        bottom: 24,
        alignSelf: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.3)',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
    },
});
