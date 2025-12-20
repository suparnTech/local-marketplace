import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
    Dimensions,
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import Animated, {
    FadeInDown,
} from 'react-native-reanimated';
import { useSelector } from 'react-redux';
import { GlassCard } from '../../src/components/ui/GlassCard';
import { GlassHeader } from '../../src/components/ui/GlassHeader';
import { ImmersiveBackground } from '../../src/components/ui/ImmersiveBackground';
import { KineticCard } from '../../src/components/ui/KineticCard';
import { SafeView } from '../../src/components/ui/SafeView';
import { Skeleton } from '../../src/components/ui/Skeleton';
import { useCategories } from '../../src/hooks/useCategories';
import { colors } from '../../src/theme/colors';
import { spacing } from '../../src/theme/spacing';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - spacing.lg * 3) / 2;

interface Category {
    id: string;
    name: string;
    slug: string;
    icon: string;
    color: string;
    description?: string;
    shop_count?: number;
}

export default function CategoriesScreen() {
    const { selectedTown } = useSelector((state: any) => state.location);
    const [searchQuery, setSearchQuery] = useState('');

    // Use React Query hook
    const { data: categories = [], isLoading: loading, refetch } = useCategories();
    const [refreshing, setRefreshing] = useState(false);

    const handleRefresh = async () => {
        setRefreshing(true);
        await refetch();
        setRefreshing(false);
    };

    const filteredCategories = categories.filter(cat =>
        cat.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const renderCategory = ({ item, index }: { item: Category; index: number }) => (
        <KineticCard
            cardWidth={CARD_WIDTH}
            onPress={() => router.push(`/shops?category=${item.slug}&town=${selectedTown?.id}`)}
            style={styles.categoryCardWrapper}
            key={item.id}
        >
            <GlassCard style={styles.categoryContent} intensity={25}>
                <View style={[styles.iconGlowContainer, { backgroundColor: (item.color || colors.primary) + '15' }]}>
                    <LinearGradient
                        colors={[(item.color || colors.primary) + '80', 'transparent']}
                        style={styles.iconGlow}
                    />
                    <Ionicons name={(item.icon as any) || 'grid'} size={40} color={item.color || colors.primary} />
                </View>

                <View style={styles.categoryInfo}>
                    <Text style={styles.categoryName} numberOfLines={1}>{item.name}</Text>
                    <View style={styles.badge}>
                        <Text style={styles.badgeText}>{item.shop_count || 0} Shops</Text>
                    </View>
                </View>
            </GlassCard>
        </KineticCard>
    );

    return (
        <SafeView>
            <ImmersiveBackground />

            <GlassHeader
                title="Discovery Portal"
                subtitle={`Explore ${categories.length} niches in ${selectedTown?.name || 'your area'}`}
                rightElement={<Ionicons name="apps" size={22} color={colors.primary} />}
            />

            <View style={styles.container}>
                {/* Immersive Search Portal */}
                <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.searchPortal}>
                    <GlassCard style={styles.searchCard} intensity={30}>
                        <Ionicons name="search" size={20} color={colors.primary} />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Find a category..."
                            placeholderTextColor={colors.textMuted}
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />
                        {searchQuery.length > 0 && (
                            <TouchableOpacity onPress={() => setSearchQuery('')}>
                                <Ionicons name="close-circle" size={20} color={colors.textMuted} />
                            </TouchableOpacity>
                        )}
                    </GlassCard>
                </Animated.View>

                {loading ? (
                    <View style={styles.gridContainer}>
                        {[1, 2, 3, 4, 5, 6].map(i => (
                            <View key={i} style={styles.categoryCardWrapper}>
                                <GlassCard style={[styles.categoryContent, { minHeight: 180 }]} intensity={10}>
                                    <Skeleton width={60} height={60} borderRadius={30} />
                                    <Skeleton width={80} height={14} style={{ marginTop: 15 }} />
                                    <Skeleton width={50} height={12} style={{ marginTop: 8 }} />
                                </GlassCard>
                            </View>
                        ))}
                    </View>
                ) : (
                    <FlatList
                        data={filteredCategories}
                        renderItem={renderCategory}
                        keyExtractor={item => item.id}
                        numColumns={2}
                        columnWrapperStyle={styles.row}
                        contentContainerStyle={styles.listContent}
                        showsVerticalScrollIndicator={false}
                        refreshControl={
                            <RefreshControl
                                refreshing={refreshing}
                                onRefresh={handleRefresh}
                                tintColor={colors.primary}
                            />
                        }
                        ListEmptyComponent={
                            <View style={styles.emptyContainer}>
                                <Ionicons name="search-outline" size={64} color={colors.primary} />
                                <Text style={styles.emptyText}>Portal holds no such niche</Text>
                                <Text style={styles.emptySubtext}>Try a wider search</Text>
                            </View>
                        }
                    />
                )}
            </View>
        </SafeView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    searchPortal: {
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.md,
        marginBottom: spacing.md,
    },
    searchCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        paddingHorizontal: spacing.md,
        paddingVertical: 12,
        borderRadius: 24,
        borderWidth: 1.5,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: '#fff',
        fontWeight: '500',
    },
    listContent: {
        padding: spacing.lg,
        paddingTop: spacing.sm,
        paddingBottom: 100,
    },
    row: {
        gap: spacing.md,
        marginBottom: spacing.md,
    },
    categoryCardWrapper: {
        width: CARD_WIDTH,
    },
    categoryContent: {
        padding: spacing.lg,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 190,
        borderRadius: 32,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    iconGlowContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        marginBottom: spacing.md,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    iconGlow: {
        ...StyleSheet.absoluteFillObject,
        borderRadius: 40,
    },
    categoryInfo: {
        alignItems: 'center',
        gap: 8,
    },
    categoryName: {
        fontSize: 17,
        fontWeight: '900',
        color: '#fff',
        letterSpacing: -0.5,
    },
    badge: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    badgeText: {
        fontSize: 11,
        color: 'rgba(255,255,255,0.5)',
        fontWeight: 'bold',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    gridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        padding: spacing.lg,
        gap: spacing.md,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: spacing.xl * 3,
        gap: 12,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
    },
    emptySubtext: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.4)',
    },
});
