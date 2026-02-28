// app/admin/(tabs)/pending.tsx
// Admin - Pending KYC Approvals List

import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { GlassCard } from '../../../src/components/ui/GlassCard';
import { GlassHeader } from '../../../src/components/ui/GlassHeader';
import { ImmersiveBackground } from '../../../src/components/ui/ImmersiveBackground';
import { SafeView } from '../../../src/components/ui/SafeView';
import { colors } from '../../../src/theme/colors';
import { gradients } from '../../../src/theme/gradients';

interface PendingShop {
    id: string;
    businessName: string;
    ownerName: string;
    phone: string;
    submittedAt: string;
    city: string;
}

interface PendingDeliveryPartner {
    id: string;
    fullName: string;
    email: string;
    phone: string;
    city: string;
    vehicleType: string;
    submittedAt: string;
}

import { useAuth } from '../../../src/contexts/AuthContext';
import { api } from '../../../src/lib/api';

// ... other imports

const formatDate = (dateString: string) => {
    if (!dateString) return 'Just now';
    const date = new Date(dateString);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000); // seconds

    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return date.toLocaleDateString();
};

export default function AdminPendingScreen() {
    const router = useRouter();
    const { logout } = useAuth();
    const [shops, setShops] = useState<PendingShop[]>([]);
    const [deliveryPartners, setDeliveryPartners] = useState<PendingDeliveryPartner[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState<'shops' | 'delivery'>('delivery');

    const handleLogout = async () => {
        try {
            await logout();
        } catch (error) {
            console.error('Logout failed:', error);
        }
    };

    const fetchPendingShops = async () => {
        try {
            const response = await api.get('/admin/pending-vendors');
            const mappedShops = response.data.map((shop: any) => ({
                id: shop.id,
                businessName: shop.businessName || 'Business Name',
                ownerName: shop.ownerName || 'Owner Name',
                phone: shop.phone || 'No phone',
                submittedAt: formatDate(shop.submittedAt),
                city: shop.city || 'Unknown Location',
            }));
            setShops(mappedShops);
        } catch (error) {
            console.error('Fetch pending shops error:', error);
        }
    };

    const fetchPendingDeliveryPartners = async () => {
        try {
            const response = await api.get('/admin/pending-delivery-partners');
            const mappedPartners = response.data.map((partner: any) => ({
                id: partner.id,
                fullName: partner.fullName || 'Name',
                email: partner.email || 'No email',
                phone: partner.phone || 'No phone',
                city: partner.city || 'Unknown',
                vehicleType: partner.vehicleType || 'bike',
                submittedAt: formatDate(partner.submittedAt),
            }));
            setDeliveryPartners(mappedPartners);
        } catch (error) {
            console.error('Fetch pending delivery partners error:', error);
        }
    };

    const fetchAll = async () => {
        await Promise.all([fetchPendingShops(), fetchPendingDeliveryPartners()]);
        setLoading(false);
        setRefreshing(false);
    };

    useFocusEffect(
        useCallback(() => {
            fetchAll();
        }, [])
    );

    const handleRefresh = () => {
        setRefreshing(true);
        fetchAll();
    };

    const handleShopPress = (shopId: string) => {
        router.push(`/admin/kyc-review/${shopId}`);
    };

    const handlePartnerPress = (partnerId: string) => {
        router.push(`/admin/delivery-partner-review/${partnerId}` as any);
    };

    const renderShopCard = ({ item, index }: { item: PendingShop; index: number }) => (
        <Animated.View
            entering={FadeInDown.delay(index * 100).springify()}
            style={styles.cardWrapper}
        >
            <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => handleShopPress(item.id)}
            >
                <GlassCard style={styles.shopCard}>
                    <View style={styles.shopHeader}>
                        <View style={styles.shopIcon}>
                            <Ionicons name="storefront" size={24} color="#fbbf24" />
                        </View>
                        <View style={styles.shopInfo}>
                            <Text style={styles.businessName}>{item.businessName}</Text>
                            <Text style={styles.ownerName}>{item.ownerName}</Text>
                        </View>
                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>NEW</Text>
                        </View>
                    </View>

                    <View style={styles.shopDetails}>
                        <View style={styles.detailRow}>
                            <Ionicons name="call-outline" size={16} color={colors.textMuted} />
                            <Text style={styles.detailText}>{item.phone}</Text>
                        </View>
                        <View style={styles.detailRow}>
                            <Ionicons name="location-outline" size={16} color={colors.textMuted} />
                            <Text style={styles.detailText}>{item.city}</Text>
                        </View>
                        <View style={styles.detailRow}>
                            <Ionicons name="time-outline" size={16} color={colors.textMuted} />
                            <Text style={styles.detailText}>Submitted {item.submittedAt}</Text>
                        </View>
                    </View>

                    <View style={styles.actionRow}>
                        <Text style={styles.reviewText}>Tap to review KYC</Text>
                        <Ionicons name="arrow-forward" size={20} color={colors.primary} />
                    </View>
                </GlassCard>
            </TouchableOpacity>
        </Animated.View>
    );

    const renderEmptyState = () => (
        <View style={styles.emptyContainer}>
            <Ionicons name="checkmark-done-circle-outline" size={80} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>All Caught Up!</Text>
            <Text style={styles.emptyText}>
                No pending {activeTab === 'shops' ? 'shop' : 'delivery partner'} approvals
            </Text>
        </View>
    );

    const renderPartnerCard = ({ item, index }: { item: PendingDeliveryPartner; index: number }) => (
        <Animated.View
            entering={FadeInDown.delay(index * 100).springify()}
            style={styles.cardWrapper}
        >
            <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => handlePartnerPress(item.id)}
            >
                <GlassCard style={styles.shopCard}>
                    <View style={styles.shopHeader}>
                        <View style={[styles.shopIcon, { backgroundColor: 'rgba(14, 165, 233, 0.2)' }]}>
                            <Ionicons name="bicycle" size={24} color="#0ea5e9" />
                        </View>
                        <View style={styles.shopInfo}>
                            <Text style={styles.businessName}>{item.fullName}</Text>
                            <Text style={styles.ownerName}>{item.email}</Text>
                        </View>
                        <View style={[styles.badge, { backgroundColor: '#0ea5e9' }]}>
                            <Text style={styles.badgeText}>NEW</Text>
                        </View>
                    </View>

                    <View style={styles.shopDetails}>
                        <View style={styles.detailRow}>
                            <Ionicons name="call-outline" size={16} color={colors.textMuted} />
                            <Text style={styles.detailText}>{item.phone}</Text>
                        </View>
                        <View style={styles.detailRow}>
                            <Ionicons name="bicycle-outline" size={16} color={colors.textMuted} />
                            <Text style={styles.detailText}>{item.vehicleType}</Text>
                        </View>
                        <View style={styles.detailRow}>
                            <Ionicons name="time-outline" size={16} color={colors.textMuted} />
                            <Text style={styles.detailText}>Submitted {item.submittedAt}</Text>
                        </View>
                    </View>

                    <View style={styles.actionRow}>
                        <Text style={styles.reviewText}>Tap to review KYC</Text>
                        <Ionicons name="arrow-forward" size={20} color={colors.primary} />
                    </View>
                </GlassCard>
            </TouchableOpacity>
        </Animated.View>
    );

    if (loading) {
        return (
            <SafeView gradient={gradients.background as any}>
                <ImmersiveBackground />
                <GlassHeader title="Pending Approvals" />
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text style={styles.loadingText}>Loading pending approvals...</Text>
                </View>
            </SafeView>
        );
    }

    const totalPending = shops.length + deliveryPartners.length;

    return (
        <SafeView gradient={gradients.background as any}>
            <ImmersiveBackground />
            <GlassHeader
                title="Pending Approvals"
                rightElement={
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                        {totalPending > 0 && (
                            <View style={styles.countBadge}>
                                <Text style={styles.countText}>{totalPending}</Text>
                            </View>
                        )}
                        <TouchableOpacity onPress={handleLogout} activeOpacity={0.7}>
                            <Ionicons name="log-out-outline" size={24} color={colors.error} />
                        </TouchableOpacity>
                    </View>
                }
            />

            {/* Tabs */}
            <View style={styles.tabs}>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'delivery' && styles.tabActive]}
                    onPress={() => setActiveTab('delivery')}
                >
                    <Ionicons name="bicycle" size={20} color={activeTab === 'delivery' ? '#fff' : colors.textMuted} />
                    <Text style={[styles.tabText, activeTab === 'delivery' && styles.tabTextActive]}>
                        Delivery ({deliveryPartners.length})
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'shops' && styles.tabActive]}
                    onPress={() => setActiveTab('shops')}
                >
                    <Ionicons name="storefront" size={20} color={activeTab === 'shops' ? '#fff' : colors.textMuted} />
                    <Text style={[styles.tabText, activeTab === 'shops' && styles.tabTextActive]}>
                        Shops ({shops.length})
                    </Text>
                </TouchableOpacity>
            </View>

            <FlatList
                data={activeTab === 'delivery' ? deliveryPartners : shops}
                renderItem={activeTab === 'delivery' ? renderPartnerCard : renderShopCard}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={renderEmptyState}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={handleRefresh}
                        tintColor={colors.primary}
                    />
                }
                showsVerticalScrollIndicator={false}
            />
        </SafeView>
    );
}

const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
    },
    loadingText: {
        fontSize: 16,
        color: colors.textMuted,
    },
    listContent: {
        padding: 20,
        paddingBottom: 40,
    },
    cardWrapper: {
        marginBottom: 16,
    },
    shopCard: {
        padding: 20,
    },
    shopHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    shopIcon: {
        width: 48,
        height: 48,
        borderRadius: 12,
        backgroundColor: 'rgba(251, 191, 36, 0.2)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    shopInfo: {
        flex: 1,
    },
    businessName: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.text,
        marginBottom: 4,
    },
    ownerName: {
        fontSize: 14,
        color: colors.textMuted,
    },
    badge: {
        backgroundColor: colors.primary,
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
    },
    badgeText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#fff',
    },
    shopDetails: {
        gap: 12,
        marginBottom: 16,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    detailText: {
        fontSize: 14,
        color: colors.textMuted,
    },
    actionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255, 255, 255, 0.1)',
    },
    reviewText: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.primary,
    },
    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 80,
    },
    emptyTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: colors.text,
        marginTop: 16,
        marginBottom: 8,
    },
    emptyText: {
        fontSize: 16,
        color: colors.textMuted,
        textAlign: 'center',
    },
    countBadge: {
        backgroundColor: colors.primary,
        width: 28,
        height: 28,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    countText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#fff',
    },
    tabs: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        marginBottom: 16,
        gap: 12,
    },
    tab: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    tabActive: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    tabText: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.textMuted,
    },
    tabTextActive: {
        color: '#fff',
    },
});
