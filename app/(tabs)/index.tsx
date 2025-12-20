// app/(tabs)/index.tsx - Revolutionary Home Screen
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Dimensions,
  FlatList,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
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
import { api } from '../../src/lib/api';
import { colors } from '../../src/theme/colors';
import { spacing } from '../../src/theme/spacing';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - spacing.lg * 3) / 2;
const CATEGORY_ICON_SIZE = 64;
const SHOP_IMAGE_HEIGHT = 120;

interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
  color: string;
}

interface Shop {
  id: string;
  name: string;
  logo_url?: string;
  rating: number;
  category_name: string;
  town_name: string;
}

interface QuickAction {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  route: string;
}

const quickActions: QuickAction[] = [
  { id: 'trending', icon: 'flame', label: 'Trending', route: '/trending' },
  { id: 'nearby', icon: 'location', label: 'Nearby', route: '/nearby' },
  { id: 'offers', icon: 'pricetag', label: 'Offers', route: '/offers' },
  { id: 'new', icon: 'sparkles', label: 'New', route: '/new-shops' },
];

export default function HomeScreen() {
  const { selectedTown } = useSelector((state: any) => state.location);

  const [categories, setCategories] = useState<Category[]>([]);
  const [shops, setShops] = useState<Shop[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [loadingShops, setLoadingShops] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchData();
  }, [selectedTown]);

  const fetchData = async () => {
    try {
      setLoadingCategories(true);
      setLoadingShops(true);

      const promises = [
        api.get('/api/categories'),
        selectedTown ? api.get('/api/shops', {
          params: { town_id: selectedTown.id, sort: 'rating' },
        }) : Promise.resolve({ data: [] })
      ];

      const [categoriesRes, shopsRes] = await Promise.all(promises);

      setCategories(categoriesRes.data);
      setShops(shopsRes.data);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoadingCategories(false);
      setLoadingShops(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const renderQuickAction = ({ item, index }: { item: QuickAction; index: number }) => (
    <Animated.View entering={FadeInDown.delay(index * 100).springify()}>
      <TouchableOpacity
        style={styles.quickActionButton}
        onPress={() => router.push(item.route as any)}
      >
        <GlassCard style={styles.quickActionGlass} intensity={25}>
          <LinearGradient
            colors={[colors.primary, colors.primaryDark]}
            style={styles.quickActionGradient}
          >
            <Ionicons name={item.icon} size={24} color="#fff" />
          </LinearGradient>
        </GlassCard>
        <Text style={styles.quickActionLabel}>{item.label}</Text>
      </TouchableOpacity>
    </Animated.View>
  );

  const renderCategory = ({ item, index }: { item: Category; index: number }) => (
    <KineticCard
      cardWidth={CARD_WIDTH}
      onPress={() => router.push(`/shops?category=${item.slug}&town=${selectedTown?.id}`)}
      style={styles.categoryCardWrapper}
      key={item.id}
    >
      <GlassCard style={styles.categoryContent} intensity={20}>
        <View style={[styles.categoryIconGlow, { backgroundColor: (item.color || colors.primary) + '15' }]}>
          <LinearGradient
            colors={[(item.color || colors.primary) + '80', 'transparent']}
            style={styles.categoryGlow}
          />
          <Ionicons name={item.icon as any || 'grid'} size={32} color={item.color || colors.primary} />
        </View>
        <Text style={styles.categoryName} numberOfLines={2}>{item.name}</Text>
      </GlassCard>
    </KineticCard>
  );

  const renderShop = ({ item, index }: { item: Shop; index: number }) => (
    <KineticCard
      cardWidth={CARD_WIDTH}
      onPress={() => router.push(`/shop/${item.id}`)}
      style={styles.shopCardWrapper}
      key={item.id}
    >
      <GlassCard style={styles.shopContent} intensity={15}>
        <View style={styles.shopImageContainer}>
          {item.logo_url ? (
            <Image source={{ uri: item.logo_url }} style={styles.shopImage} />
          ) : (
            <LinearGradient
              colors={[colors.primary + '20', colors.primaryDark + '20']}
              style={styles.shopImagePlaceholder}
            >
              <Ionicons name="storefront" size={40} color={colors.primary} />
            </LinearGradient>
          )}
        </View>
        <View style={styles.shopInfo}>
          <Text style={styles.shopName} numberOfLines={1}>{item.name}</Text>
          <View style={styles.shopMeta}>
            <View style={styles.shopRating}>
              <Ionicons name="star" size={12} color={colors.accent} />
              <Text style={styles.ratingText}>
                {item.rating ? Number(item.rating).toFixed(1) : '0.0'}
              </Text>
            </View>
            <Text style={styles.shopCategory} numberOfLines={1}>• {item.category_name}</Text>
          </View>
        </View>
      </GlassCard>
    </KineticCard>
  );

  return (
    <SafeView>
      <ImmersiveBackground />

      <GlassHeader
        title={`${getGreeting()}! 👋`}
        subtitle={selectedTown?.name || 'Select Town'}
        onBackPress={() => router.push('/select-town')}
        leftElement={
          <TouchableOpacity onPress={() => router.push('/select-town')} style={styles.locationBadge}>
            <Ionicons name="location" size={18} color={colors.primary} />
          </TouchableOpacity>
        }
        rightElement={
          <TouchableOpacity style={styles.notificationButton}>
            <Ionicons name="notifications-outline" size={24} color={colors.text} />
            <View style={styles.notificationBadge} />
          </TouchableOpacity>
        }
      />

      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        <View style={styles.heroSpacing} />

        {/* Premium Portal Search */}
        <Animated.View entering={FadeInDown.delay(200).springify()}>
          <View style={styles.searchPortalWrapper}>
            <GlassCard style={styles.searchCard} intensity={25}>
              <Ionicons name="search" size={22} color={colors.primary} />
              <TextInput
                placeholder="Search products or shops..."
                placeholderTextColor={colors.textMuted}
                style={styles.searchInput}
                value={searchQuery}
                onChangeText={setSearchQuery}
                onSubmitEditing={() => {
                  if (searchQuery.trim()) {
                    router.push(`/shops?search=${searchQuery}` as any);
                  }
                }}
              />
              <View style={styles.searchDivider} />
              <TouchableOpacity style={styles.filterBtn}>
                <Ionicons name="options-outline" size={22} color={colors.primary} />
              </TouchableOpacity>
            </GlassCard>
            <View style={styles.searchShadow} />
          </View>
        </Animated.View>

        {/* Quick Actions Portal */}
        <View style={styles.quickActionsSection}>
          <FlatList
            data={quickActions}
            renderItem={renderQuickAction}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.quickActionsList}
          />
        </View>

        {/* Categories Section */}
        <View style={styles.section}>
          <Animated.View entering={FadeInDown.delay(300).springify()} style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Discovery</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/categories')}>
              <View style={styles.seeAllButton}>
                <Text style={styles.seeAll}>See categories</Text>
                <Ionicons name="chevron-forward" size={16} color={colors.primary} />
              </View>
            </TouchableOpacity>
          </Animated.View>

          {loadingCategories ? (
            <View style={styles.gridContainer}>
              {[1, 2, 3, 4].map((i) => (
                <View key={i} style={styles.categoryCardWrapper}>
                  <GlassCard style={[styles.categoryContent, { height: 120 } as any]} intensity={10}>
                    <Skeleton width={48} height={48} borderRadius={24} />
                    <Skeleton width={60} height={12} style={{ marginTop: 10 }} />
                  </GlassCard>
                </View>
              ))}
            </View>
          ) : (
            <FlatList
              data={categories.slice(0, 4)}
              renderItem={renderCategory}
              keyExtractor={(item) => item.id}
              numColumns={2}
              scrollEnabled={false}
              columnWrapperStyle={styles.gridRow}
            />
          )}
        </View>

        {/* Shops Section */}
        <View style={styles.section}>
          <Animated.View entering={FadeInDown.delay(400).springify()} style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Curated Shops</Text>
            <Text style={styles.sectionSubtitle}>Premier collection in {selectedTown?.name || 'Local'}</Text>
          </Animated.View>

          {loadingShops ? (
            <View style={styles.gridContainer}>
              {[1, 2, 3, 4].map((i) => (
                <View key={i} style={styles.shopCardWrapper}>
                  <GlassCard style={styles.shopContent} intensity={10}>
                    <Skeleton width={CARD_WIDTH - 32} height={SHOP_IMAGE_HEIGHT} borderRadius={16} />
                    <Skeleton width={CARD_WIDTH - 60} height={14} style={{ marginTop: 12 }} />
                  </GlassCard>
                </View>
              ))}
            </View>
          ) : shops.length > 0 ? (
            <FlatList
              data={shops.slice(0, 6)}
              renderItem={renderShop}
              keyExtractor={(item) => item.id}
              numColumns={2}
              scrollEnabled={false}
              columnWrapperStyle={styles.gridRow}
            />
          ) : (
            <GlassCard style={styles.emptyCard} intensity={20}>
              <Ionicons name="storefront-outline" size={48} color={colors.primary} />
              <Text style={styles.emptyTitle}>No Shops Yet</Text>
              <Text style={styles.emptyText}>We are expanding rapidly to {selectedTown?.name || 'your area'}!</Text>
            </GlassCard>
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  heroSpacing: { height: spacing.lg },
  locationBadge: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.03)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  notificationBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    borderWidth: 1.5,
    borderColor: colors.background,
  },
  searchPortalWrapper: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
    position: 'relative',
  },
  searchCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  searchDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginHorizontal: spacing.xs,
  },
  filterBtn: {
    padding: 4,
  },
  searchShadow: {
    position: 'absolute',
    bottom: -10,
    left: spacing.xl,
    right: spacing.xl,
    height: 20,
    backgroundColor: colors.primary,
    opacity: 0.1,
    borderRadius: 40,
    zIndex: -1,
  },
  quickActionsSection: {
    marginBottom: spacing.xl,
  },
  quickActionsList: {
    paddingHorizontal: spacing.lg,
    gap: spacing.lg,
  },
  quickActionButton: {
    alignItems: 'center',
    gap: 8,
  },
  quickActionGlass: {
    padding: 2,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  quickActionGradient: {
    width: 58,
    height: 58,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  section: {
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: -0.5,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 4,
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginBottom: 4,
  },
  seeAll: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: 'bold',
  },
  gridRow: {
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  categoryCardWrapper: {
    width: CARD_WIDTH,
  },
  categoryContent: {
    padding: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    minHeight: 130,
    borderRadius: 28,
  },
  categoryIconGlow: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(16, 185, 129, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.1)',
  },
  categoryGlow: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 30,
  },
  categoryName: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '800',
    textAlign: 'center',
    opacity: 0.9,
  },
  shopCardWrapper: {
    width: CARD_WIDTH,
  },
  shopContent: {
    padding: spacing.sm,
    borderRadius: 28,
  },
  shopImageContainer: {
    width: '100%',
    height: SHOP_IMAGE_HEIGHT,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  shopImage: {
    width: '100%',
    height: '100%',
  },
  shopImagePlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shopInfo: {
    padding: spacing.sm,
    gap: 4,
  },
  shopName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#fff',
  },
  shopMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  shopRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  ratingText: {
    fontSize: 11,
    color: '#fff',
    fontWeight: 'bold',
  },
  shopCategory: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.4)',
    fontWeight: '500',
  },
  emptyCard: {
    padding: spacing.xl * 2,
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  emptyText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
    lineHeight: 18,
  },
});
