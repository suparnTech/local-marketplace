// app/shop-owner/(tabs)/profile.tsx - Shop Profile Management
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React from 'react';
import { ActivityIndicator, Alert, Dimensions, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp, ZoomIn } from 'react-native-reanimated';
import { GlassCard } from '../../../src/components/ui/GlassCard';
import { GlassHeader } from '../../../src/components/ui/GlassHeader';
import { ImmersiveBackground } from '../../../src/components/ui/ImmersiveBackground';
import { KineticCard } from '../../../src/components/ui/KineticCard';
import { SafeView } from '../../../src/components/ui/SafeView';
import { useAuth } from '../../../src/contexts/AuthContext';
import { useShopOwnerProfile } from '../../../src/hooks/useShopOwner';
import { api } from '../../../src/lib/api';
import { colors } from '../../../src/theme/colors';
import { gradients } from '../../../src/theme/gradients';
import { spacing } from '../../../src/theme/spacing';

const { width } = Dimensions.get('window');

interface ShopProfile {
    id: string;
    isOpen: boolean;
    businessName: string;
    ownerName: string;
    phone: string;
    whatsappNumber?: string;
    email?: string;
    address: {
        line1: string;
        line2?: string;
        pincode: string;
    };
    category: {
        id: string;
        name: string;
    };
    operational: {
        openingHours: any;
        weeklyOff: string[];
        deliveryRadius: number;
        minimumOrderValue: number;
    };
    media: {
        logo?: string;
        cover?: string;
    };
    verification: {
        status: string;
        isApproved: boolean;
    };
    stats: {
        rating: number;
        totalReviews: number;
        totalOrders: number;
    };
}

export default function ShopProfileScreen() {
    const { logout } = useAuth();

    // Use React Query hook instead of manual fetching
    const { data: shop, isLoading: loading, refetch } = useShopOwnerProfile();

    const handleLogout = () => {
        Alert.alert(
            "Sign Out",
            "Are you sure you want to sign out?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Sign Out",
                    style: "destructive",
                    onPress: async () => {
                        await logout();
                        router.replace('/shop-owner/login');
                    }
                }
            ]
        );
    };

    const toggleShopStatus = async () => {
        try {
            const newStatus = !shop?.isOpen;
            await api.put('/api/shop-owner/profile/status', { isOpen: newStatus });
            // Refetch to get updated data
            refetch();
            Alert.alert('Success', `Shop is now ${newStatus ? 'Open' : 'Closed'}`);
        } catch (error) {
            console.error('Failed to toggle status:', error);
            Alert.alert('Error', 'Failed to update shop status');
        }
    };

    if (loading) {
        return (
            <SafeView>
                <ImmersiveBackground />
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            </SafeView>
        );
    }

    const openingTime = shop?.operational?.openingHours?.opening || '09:00';
    const closingTime = shop?.operational?.openingHours?.closing || '21:00';

    return (
        <SafeView scroll>
            <ImmersiveBackground />
            <View style={styles.container}>
                <GlassHeader
                    title="Shop Profile"
                    subtitle="Manage your business"
                    rightElement={
                        <TouchableOpacity onPress={() => { }}>
                            <Ionicons name="settings-outline" size={20} color={colors.primary} />
                        </TouchableOpacity>
                    }
                />

                {/* Cover & Logo Section */}
                <Animated.View entering={FadeInDown.delay(100).springify()}>
                    <KineticCard cardWidth={width - spacing.lg * 2} style={styles.profileKinetic}>
                        <GlassCard style={styles.profileCard} intensity={25}>
                            <View style={styles.coverContainer}>
                                {shop?.media?.cover ? (
                                    <View style={styles.coverImageContainer}>
                                        <Image source={{ uri: shop.media.cover }} style={styles.coverImage} />
                                        <LinearGradient colors={['transparent', 'rgba(0,0,0,0.6)']} style={StyleSheet.absoluteFill} />
                                    </View>
                                ) : (
                                    <LinearGradient colors={gradients.primary} style={styles.coverPlaceholder} />
                                )}
                            </View>

                            <View style={styles.logoPortal}>
                                <View style={styles.logoContainer}>
                                    {shop?.media?.logo ? (
                                        <Image source={{ uri: shop.media.logo }} style={styles.logoImage} />
                                    ) : (
                                        <Text style={styles.logoText}>
                                            {shop?.businessName?.charAt(0).toUpperCase()}
                                        </Text>
                                    )}
                                </View>
                                <Animated.View entering={ZoomIn.delay(300).springify()} style={styles.verifyBadge}>
                                    <Ionicons
                                        name={shop?.verification.isApproved ? "checkmark-circle" : "time"}
                                        size={18}
                                        color={shop?.verification.isApproved ? colors.success : colors.warning}
                                    />
                                </Animated.View>
                            </View>

                            <View style={styles.shopNames}>
                                <Text style={styles.businessName}>{shop?.businessName || 'Business Name'}</Text>
                                <Text style={styles.categoryName}>{shop?.category?.name || 'Category'}</Text>
                                <View style={styles.statsRow}>
                                    <View style={styles.stat}>
                                        <Ionicons name="star" size={14} color={colors.accent} />
                                        <Text style={styles.statText}>{shop?.stats.rating} ({shop?.stats.totalReviews})</Text>
                                    </View>
                                    <View style={styles.statDivider} />
                                    <View style={styles.stat}>
                                        <Ionicons name="bag-handle" size={14} color={colors.primary} />
                                        <Text style={styles.statText}>{shop?.stats.totalOrders} Orders</Text>
                                    </View>
                                </View>
                            </View>

                            <View style={styles.statusToggleContainer}>
                                <TouchableOpacity
                                    style={[
                                        styles.statusBadge,
                                        { backgroundColor: shop?.isOpen ? colors.success + '20' : colors.error + '20' }
                                    ]}
                                    onPress={toggleShopStatus}
                                >
                                    <View style={[
                                        styles.statusDot,
                                        { backgroundColor: shop?.isOpen ? colors.success : colors.error }
                                    ]} />
                                    <Text style={[
                                        styles.statusText,
                                        { color: shop?.isOpen ? colors.success : colors.error }
                                    ]}>
                                        {shop?.isOpen ? 'Shop is Open' : 'Shop is Closed'}
                                    </Text>
                                    <Ionicons
                                        name={shop?.isOpen ? 'toggle' : 'toggle-outline'}
                                        size={24}
                                        color={shop?.isOpen ? colors.success : colors.error}
                                        style={{ marginLeft: 8 }}
                                    />
                                </TouchableOpacity>
                            </View>
                        </GlassCard>
                    </KineticCard>
                </Animated.View>

                {/* Management Sections */}
                <Animated.View entering={FadeInUp.delay(200).springify()} style={styles.sectionsContainer}>
                    <Section title="Business Management" icon="briefcase">
                        <MenuItem
                            icon="storefront-outline"
                            title="Edit Shop Details"
                            subtitle="Name, Category, Description"
                            onPress={() => { }}
                        />
                        <MenuItem
                            icon="location-outline"
                            title="Operational Area"
                            subtitle={`${shop?.operational.deliveryRadius}km Radius, ₹${shop?.operational.minimumOrderValue} Min Order`}
                            onPress={() => router.push('/shop-owner/settings/operational')}
                        />
                        <MenuItem
                            icon="time-outline"
                            title="Store Timings"
                            subtitle={`${openingTime} - ${closingTime} • ${shop?.operational.weeklyOff.join(', ')}`}
                            onPress={() => router.push('/shop-owner/settings/operational')}
                        />
                    </Section>

                    <Section title="Documents & Payouts" icon="card">
                        <MenuItem
                            icon="shield-checkmark-outline"
                            title="KYC Documents"
                            subtitle={shop?.verification.isApproved ? "Verified & Active" : "Verification Pending"}
                            onPress={() => { }}
                        />
                        <MenuItem
                            icon="wallet-outline"
                            title="Payout Settings"
                            subtitle="Bank details & Settlement"
                            onPress={() => { }}
                        />
                    </Section>

                    <Section title="Premium Features" icon="rocket">
                        <MenuItem
                            icon="bar-chart-outline"
                            title="Insights & Analytics"
                            subtitle="Track your growth"
                            onPress={() => router.push('/shop-owner/analytics')}
                        />
                        <MenuItem
                            icon="megaphone-outline"
                            title="Promotions"
                            subtitle="Create offers & coupons"
                            onPress={() => { }}
                        />
                    </Section>

                    <Section title="Support" icon="help-buoy">
                        <MenuItem
                            icon="help-circle-outline"
                            title="Merchant Help Center"
                            onPress={() => { }}
                        />
                        <MenuItem
                            icon="call-outline"
                            title="Support Hotline"
                            onPress={() => { }}
                        />
                        <MenuItem
                            icon="trending-up-outline"
                            title="Growth Hub"
                            onPress={() => router.push('/shop-owner/growth')}
                        />
                        <MenuItem
                            icon="card-outline"
                            title="Payout Settings"
                            onPress={() => router.push('/shop-owner/settings/payouts')}
                        />

                        <MenuItem
                            icon="notifications-outline"
                            title="Notification Settings"
                            onPress={() => { }}
                        />
                    </Section>
                </Animated.View>

                {/* Sign Out Button */}
                <Animated.View entering={FadeInUp.delay(500).springify()}>
                    <TouchableOpacity onPress={handleLogout} style={styles.logoutContainer}>
                        <GlassCard style={styles.logoutCard} intensity={15}>
                            <View style={styles.logoutIconGlow}>
                                <Ionicons name="log-out-outline" size={20} color={colors.error} />
                            </View>
                            <Text style={styles.logoutText}>Sign Out Securely</Text>
                        </GlassCard>
                    </TouchableOpacity>
                </Animated.View>

                <View style={styles.bottomSpacer} />
            </View>
        </SafeView>
    );
}

const Section = ({ title, icon, children }: { title: string; icon: any; children: React.ReactNode }) => (
    <View style={styles.section}>
        <View style={styles.sectionHeader}>
            <Ionicons name={icon} size={16} color={colors.primary} />
            <Text style={styles.sectionTitle}>{title}</Text>
        </View>
        <GlassCard style={styles.menuCard} intensity={15}>
            {children}
        </GlassCard>
    </View>
);

const MenuItem = ({ icon, title, subtitle, onPress }: { icon: any; title: string; subtitle?: string; onPress: () => void }) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
        <View style={styles.menuLeft}>
            <View style={styles.iconGlow}>
                <Ionicons name={icon} size={20} color={colors.primary} />
            </View>
            <View>
                <Text style={styles.menuTitle}>{title}</Text>
                {subtitle && <Text style={styles.menuSubtitle}>{subtitle}</Text>}
            </View>
        </View>
        <Ionicons name="chevron-forward" size={16} color={colors.primary} />
    </TouchableOpacity>
);

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    center: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    profileKinetic: {
        marginBottom: spacing.xl,
    },
    profileCard: {
        padding: 0,
        borderRadius: 24,
        overflow: 'hidden',
    },
    coverContainer: {
        height: 120,
        width: '100%',
    },
    coverImageContainer: {
        flex: 1,
    },
    coverImage: {
        ...StyleSheet.absoluteFillObject,
        resizeMode: 'cover',
    },
    coverPlaceholder: {
        flex: 1,
        opacity: 0.8,
    },
    logoPortal: {
        marginTop: -50,
        alignSelf: 'center',
        position: 'relative',
    },
    logoContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: colors.surface,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 4,
        borderColor: colors.surfaceLight,
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    logoImage: {
        width: 92,
        height: 92,
        borderRadius: 46,
    },
    logoText: {
        fontSize: 42,
        fontWeight: '900',
        color: colors.primary,
    },
    verifyBadge: {
        position: 'absolute',
        bottom: 5,
        right: 0,
        backgroundColor: colors.surface,
        borderRadius: 12,
        padding: 2,
    },
    shopNames: {
        alignItems: 'center',
        paddingVertical: spacing.lg,
        paddingHorizontal: spacing.md,
    },
    businessName: {
        fontSize: 24,
        fontWeight: '800',
        color: colors.text,
        textAlign: 'center',
    },
    categoryName: {
        fontSize: 14,
        color: colors.textMuted,
        marginTop: 4,
    },
    statsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: spacing.md,
        gap: spacing.md,
    },
    stat: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    statDivider: {
        width: 1,
        height: 12,
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    statText: {
        fontSize: 12,
        fontWeight: '600',
        color: colors.textMuted,
    },
    statusToggleContainer: {
        marginTop: spacing.lg,
        alignItems: 'center',
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 8,
    },
    statusText: {
        fontSize: 14,
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    sectionsContainer: {
        gap: spacing.lg,
        paddingHorizontal: spacing.lg,
    },
    section: {
        gap: spacing.sm,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginLeft: 4,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: '800',
        color: colors.textMuted,
        textTransform: 'uppercase',
        letterSpacing: 1.5,
    },
    menuCard: {
        padding: 0,
        borderRadius: 24,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.03)',
    },
    menuLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
    },
    iconGlow: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: colors.primary + '15',
        alignItems: 'center',
        justifyContent: 'center',
    },
    menuTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.text,
    },
    menuSubtitle: {
        fontSize: 12,
        color: colors.textMuted,
        marginTop: 2,
        maxWidth: 200,
    },
    logoutContainer: {
        marginTop: spacing.xxl,
        paddingHorizontal: spacing.lg,
    },
    logoutCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.md,
        paddingVertical: spacing.md,
        borderRadius: 20,
    },
    logoutIconGlow: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: colors.error + '15',
        alignItems: 'center',
        justifyContent: 'center',
    },
    logoutText: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.error,
    },
    bottomSpacer: {
        height: 120,
    },
});
