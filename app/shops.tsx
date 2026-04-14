// app/shops.tsx - Shops List Screen
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Dimensions,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import Animated, { FadeInDown, ZoomIn } from 'react-native-reanimated';
import { useSelector } from 'react-redux';
import { GlassCard } from '../src/components/ui/GlassCard';
import { GlassHeader } from '../src/components/ui/GlassHeader';
import { ImmersiveBackground } from '../src/components/ui/ImmersiveBackground';
import { KineticCard } from '../src/components/ui/KineticCard';
import { SafeView } from '../src/components/ui/SafeView';
import { Skeleton } from '../src/components/ui/Skeleton';
import { useCategories } from '../src/hooks/useCategories';
import { useShops } from '../src/hooks/useShops';
import { colors } from '../src/theme/colors';
import { gradients } from '../src/theme/gradients';
import { borderRadius, spacing } from '../src/theme/spacing';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - spacing.lg * 2);

interface Shop {
    id: string;
    name: string;
    description: string;
    logo_url?: string;
    rating: number;
    category_name: string;
    address_line1: string;
    is_open: boolean;
    delivery_radius_km: number;
    min_order_amount: number;
}

interface Category {
    id: string;
    name: string;
    slug: string;
    icon: string;
    color: string;
}

export default function ShopsScreen() {
    const { category: categoryParam, town: townParam, search: searchParam } = useLocalSearchParams();
    const { selectedTown } = useSelector((state: any) => state.location);

    const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
    const [refreshing, setRefreshing] = useState(false);
    const [showCategoryPicker, setShowCategoryPicker] = useState(false);

    const townId = townParam || selectedTown?.id;
    const townName = selectedTown?.name || 'your area';

    // Use React Query hooks
    const { data: categories = [], isLoading: loadingCategories } = useCategories();
    const { data: shops = [], isLoading: loadingShops, refetch: refetchShops } = useShops({
        categoryId: selectedCategory?.id,
        townId: townId as string,
        search: typeof searchParam === 'string' ? searchParam : undefined,
    });

    const loading = loadingCategories || loadingShops;

    useEffect(() => {
        if (categoryParam && categories.length > 0) {
            const cat = categories.find(c => c.slug === categoryParam || c.id === categoryParam);
            setSelectedCategory(cat || null);
        }
    }, [categoryParam, categories]);

    const onRefresh = async () => {
        setRefreshing(true);
        await refetchShops();
        setRefreshing(false);
    };

    const handleCategorySelect = (category: Category | null) => {
        setSelectedCategory(category);
        setShowCategoryPicker(false);
    };

    const renderShop = ({ item, index }: { item: Shop; index: number }) => (
        <Animated.View key={item.id} entering={FadeInDown.delay(index * 100).springify()}>
            <KineticCard 
                cardWidth={CARD_WIDTH} 
                style={styles.kineticWrapper}
                onPress={() => router.push(`/shop/${item.id}`)}
            >
                <GlassCard style={styles.shopCard} intensity={15}>
                        {/* Cover Image Section */}
                        <View style={styles.coverImageContainer}>
                            {item.logo_url ? (
                                <Image
                                    source={{ uri: item.logo_url }}
                                    style={styles.coverImage}
                                    contentFit="cover"
                                    transition={500}
                                />
                            ) : (
                                <LinearGradient
                                    colors={gradients.primaryDark}
                                    style={styles.coverImagePlaceholder}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                >
                                    <Ionicons name="storefront" size={48} color={colors.primary} />
                                </LinearGradient>
                            )}

                            {/* Status Badge */}
                            <View style={styles.statusBadge}>
                                <GlassCard
                                    style={[
                                        styles.statusGlass,
                                        { backgroundColor: item.is_open ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)' },
                                        { borderColor: item.is_open ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)' }
                                    ]}
                                    intensity={40}
                                >
                                    <View style={[
                                        styles.statusDot,
                                        { backgroundColor: item.is_open ? '#10B981' : '#EF4444' }
                                    ]} />
                                    <Text style={styles.statusText}>{item.is_open ? 'Live Now' : 'Closed'}</Text>
                                </GlassCard>
                            </View>

                            <LinearGradient
                                colors={['transparent', 'rgba(0,0,0,0.8)']}
                                style={styles.imageOverlay}
                            />

                            <View style={styles.floatingTag}>
                                <Ionicons name="star" size={12} color={colors.accent} />
                                <Text style={styles.ratingTextSmall}>
                                    {item.rating ? Number(item.rating).toFixed(1) : '0.0'}
                                </Text>
                            </View>
                        </View>

                        {/* Shop Info Section */}
                        <View style={styles.shopInfoContainer}>
                            <View style={styles.shopHeaderRow}>
                                <Text style={styles.shopName} numberOfLines={1}>{item.name}</Text>
                                <View style={styles.categoryPill}>
                                    <Text style={styles.categoryPillText}>{item.category_name}</Text>
                                </View>
                            </View>

                            <Text style={styles.shopDescription} numberOfLines={2}>
                                {item.description || 'Discover premium local products and exclusive collections.'}
                            </Text>

                            <View style={styles.metaRow}>
                                <View style={styles.locationContainer}>
                                    <View style={styles.iconGlowSmall}>
                                        <Ionicons name="bicycle" size={12} color={colors.primary} />
                                    </View>
                                    <Text style={styles.distanceText}>
                                        {item.delivery_radius_km}km • Min ₹{item.min_order_amount}
                                    </Text>
                                </View>

                                <View style={styles.actionPortal}>
                                    <Text style={styles.actionText}>View Products</Text>
                                    <Ionicons name="chevron-forward" size={14} color={colors.primary} />
                                </View>
                            </View>
                        </View>
                </GlassCard>
            </KineticCard>
        </Animated.View>
    );

    const renderSkeleton = () => (
        <View style={styles.shopCard}>
            <Skeleton width={CARD_WIDTH - 32} height={140} borderRadius={borderRadius.md} />
            <View style={{ padding: spacing.md, gap: spacing.xs }}>
                <Skeleton width={CARD_WIDTH - 80} height={20} />
                <Skeleton width={CARD_WIDTH - 100} height={16} />
                <Skeleton width={CARD_WIDTH - 120} height={14} />
                <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs }}>
                    <Skeleton width={60} height={24} borderRadius={borderRadius.sm} />
                </View>
            </View>
        </View>
    );

    return (
        <SafeView gradient={gradients.background as any}>
            <ImmersiveBackground />
            <View style={styles.container}>
                <GlassHeader
                    title="Discovery"
                    subtitle={`Premium curation in ${townName} `}
                    showBackButton
                    rightElement={
                        <TouchableOpacity
                            style={styles.filterToggle}
                            onPress={() => setShowCategoryPicker(!showCategoryPicker)}
                        >
                            <View style={[styles.filterIconGlow, showCategoryPicker && styles.filterIconGlowActive]}>
                                <Ionicons
                                    name={showCategoryPicker ? "close" : "options-outline"}
                                    size={20}
                                    color={showCategoryPicker ? "#fff" : colors.primary}
                                />
                            </View>
                        </TouchableOpacity>
                    }
                />

                <ScrollView
                    style={styles.content}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.scrollContent}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            tintColor={colors.primary}
                        />
                    }
                >
                    {/* Category Filter */}
                    <View style={styles.filterSection}>
                        {showCategoryPicker && (
                            <Animated.View entering={FadeInDown.springify()} style={styles.categoryPickerWrapper}>
                                <ScrollView
                                    horizontal
                                    showsHorizontalScrollIndicator={false}
                                    contentContainerStyle={styles.categoryList}
                                >
                                    <TouchableOpacity
                                        style={[
                                            styles.categoryChip,
                                            !selectedCategory && styles.categoryChipActive
                                        ]}
                                        onPress={() => handleCategorySelect(null)}
                                    >
                                        <Text style={[
                                            styles.categoryChipText,
                                            !selectedCategory && styles.categoryChipTextActive
                                        ]}>
                                            All Spaces
                                        </Text>
                                    </TouchableOpacity>
                                    {categories.map((cat) => (
                                        <TouchableOpacity
                                            key={cat.id}
                                            style={[
                                                styles.categoryChip,
                                                selectedCategory?.id === cat.id && styles.categoryChipActive
                                            ]}
                                            onPress={() => handleCategorySelect(cat)}
                                        >
                                            <Ionicons
                                                name={cat.icon as any}
                                                size={16}
                                                color={selectedCategory?.id === cat.id ? '#fff' : colors.primary}
                                            />
                                            <Text style={[
                                                styles.categoryChipText,
                                                selectedCategory?.id === cat.id && styles.categoryChipTextActive
                                            ]}>
                                                {cat.name}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </Animated.View>
                        )}
                    </View>

                    {/* Shop List */}
                    {loading ? (
                        <View style={styles.list}>
                            {[1, 2, 3, 4].map((i) => (
                                <View key={i} style={styles.skeletonCard}>
                                    <Skeleton width={CARD_WIDTH} height={180} borderRadius={24} />
                                    <View style={{ padding: 16, gap: 8 }}>
                                        <Skeleton width={150} height={20} />
                                        <Skeleton width={CARD_WIDTH - 64} height={14} />
                                    </View>
                                </View>
                            ))}
                        </View>
                    ) : shops.length > 0 ? (
                        <View style={styles.list}>
                            {shops.map((item, index) => renderShop({ item, index }))}
                        </View>
                    ) : (
                        <Animated.View entering={ZoomIn} style={styles.empty}>
                            <View style={styles.emptyIconGlow}>
                                <Ionicons name="storefront-outline" size={64} color={colors.primary} />
                            </View>
                            <Text style={styles.emptyTitle}>No Spaces Found</Text>
                            <Text style={styles.emptyText}>
                                {selectedCategory
                                    ? `Our ${selectedCategory.name.toLowerCase()} curation hasn't reached ${townName} yet.`
                                    : `No premium spaces available in ${townName} at the moment.`
                                }
                            </Text >
                            {selectedCategory && (
                                <TouchableOpacity
                                    style={styles.clearFilterButton}
                                    onPress={() => handleCategorySelect(null)}
                                >
                                    <GlassCard style={styles.clearFilterCard} intensity={20}>
                                        <Text style={styles.clearFilterText}>Explore All Spaces</Text>
                                    </GlassCard>
                                </TouchableOpacity>
                            )}
                        </Animated.View >
                    )}
                    <View style={styles.bottomSpacer} />
                </ScrollView >
            </View >
        </SafeView >
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        paddingTop: spacing.md,
    },
    content: {
        flex: 1,
    },
    filterToggle: {
        padding: spacing.xs,
    },
    filterIconGlow: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: colors.primary + '15',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: colors.primary + '20',
    },
    filterIconGlowActive: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    filterSection: {
        paddingHorizontal: spacing.lg,
        marginBottom: spacing.md,
    },
    categoryPickerWrapper: {
        marginBottom: spacing.md,
    },
    categoryList: {
        gap: spacing.sm,
        paddingBottom: 4,
    },
    categoryChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        backgroundColor: colors.surface + '80',
        borderWidth: 1,
        borderColor: colors.primary + '20',
    },
    categoryChipActive: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    categoryChipText: {
        fontSize: 14,
        color: colors.primary,
        fontWeight: '700',
    },
    categoryChipTextActive: {
        color: '#fff',
    },
    list: {
        paddingHorizontal: spacing.lg,
        gap: spacing.lg,
    },
    kineticWrapper: {
        marginBottom: spacing.md,
    },
    shopCard: {
        overflow: 'hidden',
        borderRadius: 24,
        padding: 0,
    },
    coverImageContainer: {
        width: '100%',
        height: 180,
        position: 'relative',
        backgroundColor: colors.surface,
    },
    coverImage: {
        width: '100%',
        height: '100%',
    },
    imageOverlay: {
        ...StyleSheet.absoluteFillObject,
    },
    coverImagePlaceholder: {
        width: '100%',
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
    },
    statusBadge: {
        position: 'absolute',
        top: 12,
        right: 12,
        zIndex: 10,
    },
    statusGlass: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        backgroundColor: 'rgba(16, 185, 129, 0.2)',
        borderColor: 'rgba(16, 185, 129, 0.4)',
    },
    statusDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#10B981',
        shadowColor: '#10B981',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 4,
    },
    statusText: {
        fontSize: 11,
        fontWeight: '900',
        color: '#fff',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    floatingTag: {
        position: 'absolute',
        bottom: 12,
        right: 12,
        backgroundColor: 'rgba(0,0,0,0.6)',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    ratingTextSmall: {
        fontSize: 12,
        fontWeight: '800',
        color: '#fff',
    },
    shopInfoContainer: {
        padding: spacing.lg,
        gap: spacing.sm,
    },
    shopHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    shopName: {
        fontSize: 20,
        fontWeight: '800',
        color: colors.text,
        flex: 1,
    },
    categoryPill: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 8,
        backgroundColor: colors.primary + '15',
        borderWidth: 1,
        borderColor: colors.primary + '30',
    },
    categoryPillText: {
        fontSize: 10,
        fontWeight: '900',
        color: colors.primary,
        textTransform: 'uppercase',
    },
    shopDescription: {
        fontSize: 14,
        color: colors.textMuted,
        lineHeight: 20,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: spacing.sm,
    },
    locationContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    iconGlowSmall: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: colors.primary + '10',
        alignItems: 'center',
        justifyContent: 'center',
    },
    distanceText: {
        fontSize: 13,
        color: colors.textMuted,
        fontWeight: '600',
    },
    actionPortal: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    actionText: {
        fontSize: 13,
        fontWeight: '700',
        color: colors.primary,
    },
    skeletonCard: {
        borderRadius: 24,
        backgroundColor: colors.surface + '40',
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    empty: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.xl * 2,
        marginTop: 60,
    },
    emptyIconGlow: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: colors.primary + '10',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.xl,
    },
    emptyTitle: {
        fontSize: 24,
        fontWeight: '900',
        color: colors.text,
        marginBottom: spacing.sm,
    },
    emptyText: {
        fontSize: 16,
        color: colors.textMuted,
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: spacing.xl,
    },
    clearFilterButton: {
        borderRadius: 20,
        overflow: 'hidden',
    },
    clearFilterCard: {
        paddingHorizontal: 24,
        paddingVertical: 12,
    },
    clearFilterText: {
        color: colors.primary,
        fontWeight: '800',
        fontSize: 15,
    },
    bottomSpacer: {
        height: 100,
    },
});

