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
  TouchableOpacity,
  View
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { GlassCard } from '../../src/components/ui/GlassCard';
import { GlassHeader } from '../../src/components/ui/GlassHeader';
import { ImmersiveBackground } from '../../src/components/ui/ImmersiveBackground';
import { KineticCard } from '../../src/components/ui/KineticCard';
import { SafeView } from '../../src/components/ui/SafeView';
import { OrderCardSkeleton } from '../../src/components/ui/Skeleton';
import { useOrders } from '../../src/hooks/useOrders';
import { colors } from '../../src/theme/colors';
import { gradients } from '../../src/theme/gradients';
import { borderRadius, spacing } from '../../src/theme/spacing';

const { width } = Dimensions.get('window');

const STATUS_CONFIG: any = {
  pending: { label: 'Pending', color: colors.accent, icon: 'time', glow: colors.accent + '40' },
  accepted: { label: 'Accepted', color: '#10B981', icon: 'checkmark-circle', glow: '#10B98140' },
  preparing: { label: 'Preparing', color: '#F59E0B', icon: 'restaurant', glow: '#F59E0B40' },
  out_for_delivery: { label: 'Out for Delivery', color: '#3B82F6', icon: 'bicycle', glow: '#3B82F640' },
  delivered: { label: 'Delivered', color: '#10B981', icon: 'checkmark-done', glow: '#10B98140' },
  cancelled: { label: 'Cancelled', color: colors.error, icon: 'close-circle', glow: colors.error + '40' },
};

export default function OrdersScreen() {
  const [filter, setFilter] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Use React Query hook
  const { data: allOrders = [], isLoading: loading, refetch } = useOrders();

  // Filter orders client-side
  const orders = filter
    ? allOrders.filter(order => order.status === filter)
    : allOrders;

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const renderOrderCard = ({ item, index }: { item: any; index: number }) => {
    const statusConfig = STATUS_CONFIG[item.status] || STATUS_CONFIG.pending;
    const orderDate = new Date(item.created_at).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

    return (
      <KineticCard
        cardWidth={width - spacing.lg * 2}
        onPress={() => router.push(`/order/${item.id}` as any)}
        style={styles.orderCardWrapper}
        key={item.id}
      >
        <GlassCard style={styles.orderCard} intensity={20}>
          {/* Header */}
          <View style={styles.orderHeader}>
            <View style={styles.orderInfo}>
              <Text style={styles.orderId}>Order #{item.id.slice(0, 8)}</Text>
              <Text style={styles.orderDate}>{orderDate}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: statusConfig.glow, borderColor: statusConfig.color + '40' }]}>
              <Ionicons name={statusConfig.icon} size={14} color={statusConfig.color} />
              <Text style={[styles.statusText, { color: statusConfig.color }]}>{statusConfig.label}</Text>
            </View>
          </View>

          {/* Shop Info */}
          <View style={styles.shopSection}>
            <View style={styles.shopLine}>
              <View style={styles.shopIconGlow}>
                <Ionicons name="storefront" size={16} color={colors.primary} />
              </View>
              <Text style={styles.shopName}>{item.shop_name}</Text>
            </View>
            <View style={styles.addressLine}>
              <Ionicons name="location-outline" size={14} color={colors.textMuted} />
              <Text style={styles.addressText} numberOfLines={1}>
                {item.city}, {item.state}
              </Text>
            </View>
          </View>

          {/* Footer */}
          <View style={styles.orderFooter}>
            <View style={styles.amountBox}>
              <Text style={styles.amountLabel}>Portfolio Value</Text>
              <Text style={styles.amountValue}>₹{item.total_amount}</Text>
            </View>
            <View style={styles.actionPortal}>
              <Text style={styles.actionText}>Track Order</Text>
              <View style={styles.actionCircle}>
                <Ionicons name="chevron-forward" size={16} color={colors.primary} />
              </View>
            </View>
          </View>
        </GlassCard>
      </KineticCard>
    );
  };

  const renderFilterButton = (status: string | null, label: string) => (
    <TouchableOpacity
      onPress={() => setFilter(status)}
      style={[styles.filterButton, filter === status && styles.filterButtonActive]}
    >
      {filter === status && (
        <LinearGradient
          colors={gradients.primary as any}
          style={StyleSheet.absoluteFill}
        />
      )}
      <Text style={[styles.filterText, filter === status && styles.filterTextActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeView gradient={gradients.background as any}>
        <View style={styles.container}>
          <GlassHeader title="My Orders" />
          <View style={styles.listContent}>
            {[1, 2, 3, 4, 5].map((i) => (
              <OrderCardSkeleton key={i} />
            ))}
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
          title="My Orders"
          subtitle="Track your local orders"
          rightElement={<Ionicons name="receipt" size={20} color={colors.primary} />}
        />

        {/* Filters */}
        <View style={styles.filtersContainer}>
          <Animated.View entering={FadeInDown.springify()}>
            <View style={styles.filters}>
              {renderFilterButton(null, 'All')}
              {renderFilterButton('pending', 'Pending')}
              {renderFilterButton('delivered', 'Delivered')}
              {renderFilterButton('cancelled', 'Cancelled')}
            </View>
          </Animated.View>
        </View>

        {/* Orders List */}
        {orders.length === 0 ? (
          <View style={styles.emptyContainer}>
            <LinearGradient
              colors={gradients.primary as any}
              style={styles.emptyIcon}
            >
              <Ionicons name="receipt-outline" size={64} color={colors.text} />
            </LinearGradient>
            <Text style={styles.emptyTitle}>No orders yet</Text>
            <Text style={styles.emptySubtitle}>
              Start shopping to see your orders here
            </Text>
            <TouchableOpacity
              style={styles.shopButton}
              onPress={() => router.push('/(tabs)')}
            >
              <LinearGradient
                colors={gradients.primary as any}
                style={styles.shopButtonGradient}
              >
                <Text style={styles.shopButtonText}>Start Shopping</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={orders}
            renderItem={renderOrderCard}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={colors.primary}
              />
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: spacing.lg,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
  },
  filtersContainer: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  filters: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  filterButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  filterButtonActive: {
    backgroundColor: 'transparent',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textMuted,
  },
  filterTextActive: {
    color: colors.text,
  },
  listContent: {
    padding: spacing.lg,
    paddingTop: 0,
  },
  orderCardWrapper: {
    marginBottom: spacing.lg,
  },
  orderCard: {
    padding: spacing.md,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  orderInfo: {
    flex: 1,
  },
  orderId: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 2,
  },
  orderDate: {
    fontSize: 12,
    color: colors.textMuted,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  shopSection: {
    marginVertical: spacing.md,
    gap: 10,
  },
  shopLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  shopName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  shopIconGlow: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.primary + '30',
  },
  addressLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginLeft: 4,
  },
  addressText: {
    fontSize: 12,
    color: colors.textMuted,
    flex: 1,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
  amountBox: {
    gap: 2,
  },
  amountLabel: {
    fontSize: 10,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  amountValue: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.primary,
  },
  actionPortal: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.primary + '10',
    paddingLeft: 14,
    paddingVertical: 6,
    paddingRight: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.primary + '20',
  },
  actionText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.primary,
  },
  actionCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyIcon: {
    width: 140,
    height: 140,
    borderRadius: 70,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  emptyTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  emptySubtitle: {
    fontSize: 15,
    color: colors.textMuted,
    marginBottom: spacing.xl,
    textAlign: 'center',
  },
  shopButton: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  shopButtonGradient: {
    paddingHorizontal: spacing.xl + spacing.md,
    paddingVertical: spacing.md + 2,
  },
  shopButtonText: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#fff',
  },
});
