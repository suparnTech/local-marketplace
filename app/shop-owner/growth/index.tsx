import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    FlatList,
    KeyboardAvoidingView,
    Modal,
    Platform,
    RefreshControl,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import Animated, { FadeInDown, FadeInUp, Layout } from 'react-native-reanimated';
import { GlassCard } from '../../../src/components/ui/GlassCard';
import { GlassHeader } from '../../../src/components/ui/GlassHeader';
import { ImmersiveBackground } from '../../../src/components/ui/ImmersiveBackground';
import { SafeView } from '../../../src/components/ui/SafeView';
import { useShopOwnerCoupons, useShopOwnerProfile } from '../../../src/hooks/useShopOwner';
import { api } from '../../../src/lib/api';
import { colors } from '../../../src/theme/colors';
import { spacing } from '../../../src/theme/spacing';

const { width } = Dimensions.get('window');

interface Coupon {
    id: string;
    code: string;
    discount_type: 'fixed' | 'percentage';
    discount_value: number;
    min_order_amount: number;
    is_active: boolean;
    used_count: number;
    valid_until: string | null;
}

export default function GrowthHubScreen() {
    const {
        data: profile,
        isLoading: profileLoading,
        refetch: refetchProfile
    } = useShopOwnerProfile();

    const {
        data: coupons = [],
        isLoading: couponsLoading,
        refetch: refetchCoupons
    } = useShopOwnerCoupons();

    const loading = profileLoading || couponsLoading;
    const isFeatured = profile?.shop?.is_featured || false;

    const [modalVisible, setModalVisible] = useState(false);
    const [newCoupon, setNewCoupon] = useState({
        code: '',
        discountType: 'percentage' as 'fixed' | 'percentage',
        discountValue: '',
        minOrderAmount: '',
        usageLimit: ''
    });

    const onRefresh = async () => {
        await Promise.all([refetchProfile(), refetchCoupons()]);
    };

    const handleCreateCoupon = async () => {
        if (!newCoupon.code || !newCoupon.discountValue) {
            Alert.alert('Missing Info', 'Please fill in the required fields.');
            return;
        }

        try {
            await api.post('/api/shop-owner/growth/coupons', {
                ...newCoupon,
                discountValue: parseFloat(newCoupon.discountValue),
                minOrderAmount: parseFloat(newCoupon.minOrderAmount || '0'),
                usageLimit: parseInt(newCoupon.usageLimit || '0') || null
            });
            Alert.alert('Success', 'Coupon created successfully!');
            setModalVisible(false);
            setNewCoupon({
                code: '',
                discountType: 'percentage',
                discountValue: '',
                minOrderAmount: '',
                usageLimit: ''
            });
            onRefresh();
        } catch (error: any) {
            const msg = error.response?.data?.error || 'Failed to create coupon';
            Alert.alert('Error', msg);
        }
    };

    const toggleCoupon = async (id: string, currentStatus: boolean) => {
        try {
            await api.patch(`/api/shop-owner/growth/coupons/${id}`, { isActive: !currentStatus });
            onRefresh();
        } catch (error) {
            Alert.alert('Error', 'Failed to update coupon status');
        }
    };

    const deleteCoupon = async (id: string) => {
        Alert.alert(
            'Delete Coupon',
            'Are you sure you want to delete this coupon? This action cannot be undone.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await api.delete(`/api/shop-owner/growth/coupons/${id}`);
                            onRefresh();
                        } catch (error) {
                            Alert.alert('Error', 'Failed to delete coupon');
                        }
                    }
                }
            ]
        );
    };

    const renderCoupon = ({ item, index }: { item: Coupon; index: number }) => (
        <Animated.View
            entering={FadeInDown.delay(index * 100)}
            layout={Layout.springify()}
            style={styles.couponContainer}
        >
            <GlassCard style={styles.couponCard}>
                <View style={styles.couponMain}>
                    <View style={styles.couponInfo}>
                        <Text style={styles.couponCode}>{item.code}</Text>
                        <Text style={styles.couponDiscount}>
                            {item.discount_type === 'percentage' ? `${item.discount_value}% OFF` : `₹${item.discount_value} OFF`}
                        </Text>
                        <Text style={styles.couponMeta}>
                            Min. Order: ₹{item.min_order_amount} • Used: {item.used_count}
                        </Text>
                    </View>
                    <TouchableOpacity
                        onPress={() => toggleCoupon(item.id, item.is_active)}
                        style={[styles.statusBadge, { backgroundColor: item.is_active ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)' }]}
                    >
                        <Text style={[styles.statusText, { color: item.is_active ? colors.success : colors.error }]}>
                            {item.is_active ? 'Active' : 'Paused'}
                        </Text>
                    </TouchableOpacity>
                </View>
                <View style={styles.couponActions}>
                    <TouchableOpacity style={styles.actionBtn} onPress={() => deleteCoupon(item.id)}>
                        <Ionicons name="trash-outline" size={18} color={colors.error} />
                        <Text style={[styles.actionBtnText, { color: colors.error }]}>Delete</Text>
                    </TouchableOpacity>
                </View>
            </GlassCard>
        </Animated.View>
    );

    return (
        <SafeView>
            <ImmersiveBackground />
            <GlassHeader
                title="Growth Hub"
                subtitle="Boost your reach and revenue"
                showBackButton={true}
            />

            <FlatList
                data={coupons}
                keyExtractor={(item) => item.id}
                renderItem={renderCoupon}
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl refreshing={loading} onRefresh={onRefresh} tintColor={colors.primary} />
                }
                ListHeaderComponent={
                    <View style={styles.headerComponent}>
                        <Animated.View entering={FadeInUp.delay(200)}>
                            <GlassCard style={styles.statsCard}>
                                <LinearGradient
                                    colors={isFeatured ? [colors.primary, colors.primaryDark] : ['#374151', '#111827']}
                                    style={styles.statsGradient}
                                >
                                    <View style={styles.statsIconBox}>
                                        <Ionicons name={isFeatured ? "star" : "star-outline"} size={32} color="#fff" />
                                    </View>
                                    <View style={styles.statsInfo}>
                                        <Text style={styles.statsLabel}>Visibility Status</Text>
                                        <Text style={styles.statsValue}>{isFeatured ? 'FEATURED STORE' : 'STANDARD LISTING'}</Text>
                                        <Text style={styles.statsSub}>
                                            {isFeatured ? 'You are appearing at the top of search results!' : 'Get 5x more reach by becoming a Featured Store.'}
                                        </Text>
                                    </View>
                                </LinearGradient>
                                {!isFeatured && (
                                    <TouchableOpacity style={styles.boostBtn}>
                                        <Text style={styles.boostBtnText}>Boost Visibility</Text>
                                        <Ionicons name="arrow-forward" size={16} color={colors.primary} />
                                    </TouchableOpacity>
                                )}
                            </GlassCard>
                        </Animated.View>

                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Active Coupons</Text>
                            <TouchableOpacity style={styles.addBtn} onPress={() => setModalVisible(true)}>
                                <Ionicons name="add" size={20} color="#fff" />
                                <Text style={styles.addBtnText}>New Coupon</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                }
                ListEmptyComponent={
                    !loading ? (
                        <View style={styles.emptyContainer}>
                            <Ionicons name="ticket-outline" size={64} color="rgba(255,255,255,0.1)" />
                            <Text style={styles.emptyText}>No coupons created yet.</Text>
                            <Text style={styles.emptySub}>Start by creating a special discount for your customers.</Text>
                        </View>
                    ) : (
                        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
                    )
                }
            />

            <Modal
                visible={modalVisible}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <GlassCard style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Create Coupon</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <Ionicons name="close" size={24} color="#fff" />
                            </TouchableOpacity>
                        </View>

                        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>Coupon Code</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="e.g. WELCOME10"
                                    placeholderTextColor={colors.textMuted}
                                    value={newCoupon.code}
                                    onChangeText={(text) => setNewCoupon({ ...newCoupon, code: text.toUpperCase() })}
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>Discount Type</Text>
                                <View style={styles.typeSelector}>
                                    {['percentage', 'fixed'].map((type) => (
                                        <TouchableOpacity
                                            key={type}
                                            style={[styles.typeBtn, newCoupon.discountType === type && styles.typeBtnActive]}
                                            onPress={() => setNewCoupon({ ...newCoupon, discountType: type as any })}
                                        >
                                            <Text style={[styles.typeBtnText, newCoupon.discountType === type && styles.typeBtnTextActive]}>
                                                {type === 'percentage' ? 'Percentage (%)' : 'Fixed (₹)'}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>

                            <View style={styles.inputRow}>
                                <View style={[styles.inputGroup, { flex: 1 }]}>
                                    <Text style={styles.inputLabel}>Value</Text>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="10"
                                        placeholderTextColor={colors.textMuted}
                                        keyboardType="numeric"
                                        value={newCoupon.discountValue}
                                        onChangeText={(text) => setNewCoupon({ ...newCoupon, discountValue: text })}
                                    />
                                </View>
                                <View style={[styles.inputGroup, { flex: 1, marginLeft: 12 }]}>
                                    <Text style={styles.inputLabel}>Min. Order</Text>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="499"
                                        placeholderTextColor={colors.textMuted}
                                        keyboardType="numeric"
                                        value={newCoupon.minOrderAmount}
                                        onChangeText={(text) => setNewCoupon({ ...newCoupon, minOrderAmount: text })}
                                    />
                                </View>
                            </View>

                            <TouchableOpacity style={styles.createBtn} onPress={handleCreateCoupon}>
                                <LinearGradient
                                    colors={[colors.primary, colors.primaryDark]}
                                    style={styles.createGradient}
                                >
                                    <Text style={styles.createBtnText}>Create Coupon</Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        </KeyboardAvoidingView>
                    </GlassCard>
                </View>
            </Modal>
        </SafeView>
    );
}

const styles = StyleSheet.create({
    scrollContent: {
        padding: spacing.xl,
        paddingBottom: spacing.xxl * 2,
    },
    headerComponent: {
        marginBottom: spacing.xl,
    },
    statsCard: {
        overflow: 'hidden',
        padding: 0,
        marginBottom: spacing.xl,
    },
    statsGradient: {
        flexDirection: 'row',
        padding: spacing.lg,
        alignItems: 'center',
    },
    statsIconBox: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.lg,
    },
    statsInfo: {
        flex: 1,
    },
    statsLabel: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 12,
        fontWeight: '600',
        textTransform: 'uppercase',
    },
    statsValue: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '800',
        marginVertical: 4,
    },
    statsSub: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 12,
        lineHeight: 16,
    },
    boostBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: spacing.md,
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        gap: 8,
    },
    boostBtnText: {
        color: colors.primary,
        fontWeight: '700',
        fontSize: 14,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: spacing.lg,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#fff',
    },
    addBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.primary,
        paddingHorizontal: spacing.md,
        paddingVertical: 8,
        borderRadius: 12,
        gap: 4,
    },
    addBtnText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 13,
    },
    couponContainer: {
        marginBottom: spacing.md,
    },
    couponCard: {
        padding: spacing.lg,
    },
    couponMain: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    couponInfo: {
        flex: 1,
    },
    couponCode: {
        fontSize: 18,
        fontWeight: '800',
        color: '#fff',
        letterSpacing: 1,
    },
    couponDiscount: {
        fontSize: 14,
        fontWeight: '700',
        color: colors.primary,
        marginVertical: 4,
    },
    couponMeta: {
        fontSize: 12,
        color: colors.textMuted,
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    statusText: {
        fontSize: 11,
        fontWeight: '700',
        textTransform: 'uppercase',
    },
    couponActions: {
        flexDirection: 'row',
        marginTop: spacing.md,
        paddingTop: spacing.md,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.05)',
    },
    actionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    actionBtnText: {
        fontSize: 13,
        fontWeight: '600',
    },
    emptyContainer: {
        alignItems: 'center',
        marginTop: 60,
    },
    emptyText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '700',
        marginTop: spacing.md,
    },
    emptySub: {
        color: colors.textMuted,
        textAlign: 'center',
        fontSize: 13,
        marginTop: 8,
        paddingHorizontal: 40,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.8)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        borderBottomLeftRadius: 0,
        borderBottomRightRadius: 0,
        padding: spacing.xl,
        maxHeight: '80%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.xl,
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: '800',
        color: '#fff',
    },
    inputGroup: {
        marginBottom: spacing.lg,
    },
    inputLabel: {
        color: colors.textMuted,
        fontSize: 12,
        fontWeight: '600',
        marginBottom: 8,
        textTransform: 'uppercase',
    },
    input: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 12,
        padding: spacing.md,
        color: '#fff',
        fontSize: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    typeSelector: {
        flexDirection: 'row',
        gap: spacing.md,
    },
    typeBtn: {
        flex: 1,
        padding: spacing.md,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.05)',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    typeBtnActive: {
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        borderColor: colors.primary,
    },
    typeBtnText: {
        color: colors.textMuted,
        fontWeight: '600',
    },
    typeBtnTextActive: {
        color: colors.primary,
    },
    inputRow: {
        flexDirection: 'row',
    },
    createBtn: {
        marginTop: spacing.xl,
        borderRadius: 16,
        overflow: 'hidden',
    },
    createGradient: {
        padding: spacing.lg,
        alignItems: 'center',
    },
    createBtnText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '800',
    },
});
