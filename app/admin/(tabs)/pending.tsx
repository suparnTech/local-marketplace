// app/admin/(tabs)/pending.tsx
// Admin - Pending KYC Approvals List

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
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
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

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
            setLoading(false);
            setRefreshing(false);
        } catch (error) {
            console.error('Fetch pending shops error:', error);
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchPendingShops();
    }, []);

    const handleRefresh = () => {
        setRefreshing(true);
        fetchPendingShops();
    };

    const handleShopPress = (shopId: string) => {
        router.push(`/admin/kyc-review/${shopId}`);
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
                No pending KYC approvals at the moment
            </Text>
        </View>
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

    return (
        <SafeView gradient={gradients.background as any}>
            <ImmersiveBackground />
            <GlassHeader
                title="Pending Approvals"
                rightElement={
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                        {shops.length > 0 && (
                            <View style={styles.countBadge}>
                                <Text style={styles.countText}>{shops.length}</Text>
                            </View>
                        )}
                        <TouchableOpacity onPress={handleLogout} activeOpacity={0.7}>
                            <Ionicons name="log-out-outline" size={24} color={colors.error} />
                        </TouchableOpacity>
                    </View>
                }
            />

            <FlatList
                data={shops}
                renderItem={renderShopCard}
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
});
