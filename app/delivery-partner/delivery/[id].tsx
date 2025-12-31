// Active Delivery Screen with Status Updates
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Linking,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { GlassCard } from '../../../src/components/ui/GlassCard';
import { GlassHeader } from '../../../src/components/ui/GlassHeader';
import { ImmersiveBackground } from '../../../src/components/ui/ImmersiveBackground';
import { SafeView } from '../../../src/components/ui/SafeView';
import { api } from '../../../src/lib/api';
import { colors } from '../../../src/theme/colors';
import { gradients } from '../../../src/theme/gradients';
import { borderRadius, spacing } from '../../../src/theme/spacing';

const STATUS_FLOW = [
    { key: 'accepted', label: 'Accepted', icon: 'checkmark-circle', color: colors.success },
    { key: 'on_way_to_pickup', label: 'Going to Shop', icon: 'bicycle', color: colors.info },
    { key: 'reached_shop', label: 'Reached Shop', icon: 'location', color: colors.warning },
    { key: 'picked_up', label: 'Picked Up', icon: 'bag-check', color: colors.success },
    { key: 'on_way_to_delivery', label: 'On the Way', icon: 'navigate', color: colors.info },
    { key: 'reached_customer', label: 'Reached Customer', icon: 'home', color: colors.warning },
    { key: 'delivered', label: 'Delivered', icon: 'checkmark-done', color: colors.success },
];

export default function ActiveDelivery() {
    const { id } = useLocalSearchParams();
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [delivery, setDelivery] = useState<any>(null);
    const [otp, setOtp] = useState('');
    const [showOtpInput, setShowOtpInput] = useState(false);
    const [otpType, setOtpType] = useState<'pickup' | 'delivery'>('pickup');

    useEffect(() => {
        fetchDelivery();
    }, [id]);

    const fetchDelivery = async () => {
        try {
            const response = await api.get(`/api/delivery-assignments/${id}`);
            setDelivery(response.data);
        } catch (error) {
            console.error('Fetch delivery error:', error);
            Alert.alert('Error', 'Failed to load delivery details');
        } finally {
            setLoading(false);
        }
    };

    const updateStatus = async (newStatus: string) => {
        setUpdating(true);
        try {
            await api.put(`/api/delivery-assignments/${id}/status`, {
                status: newStatus,
                location: {
                    lat: 0, // TODO: Get actual location
                    lng: 0,
                },
            });

            await fetchDelivery();
            Alert.alert('Success', `Status updated to ${newStatus}`);
        } catch (error) {
            console.error('Update status error:', error);
            Alert.alert('Error', 'Failed to update status');
        } finally {
            setUpdating(false);
        }
    };

    const verifyOTP = async () => {
        if (otp.length !== 6) {
            Alert.alert('Error', 'Please enter 6-digit OTP');
            return;
        }

        setUpdating(true);
        try {
            const endpoint = otpType === 'pickup' ? 'verify-pickup' : 'verify-delivery';
            await api.post(`/api/delivery-assignments/${id}/${endpoint}`, { otp });

            await fetchDelivery();
            setShowOtpInput(false);
            setOtp('');
            Alert.alert('Success', `${otpType === 'pickup' ? 'Pickup' : 'Delivery'} verified!`);
        } catch (error: any) {
            Alert.alert('Error', error.response?.data?.error || 'Invalid OTP');
        } finally {
            setUpdating(false);
        }
    };

    const callShop = () => {
        const phone = delivery?.pickup_location?.phone;
        if (phone) {
            Linking.openURL(`tel:${phone}`);
        }
    };

    const callCustomer = () => {
        const phone = delivery?.delivery_location?.phone;
        if (phone) {
            Linking.openURL(`tel:${phone}`);
        }
    };

    const openMaps = (location: any, label: string) => {
        const url = `https://www.google.com/maps/dir/?api=1&destination=${location.lat},${location.lng}`;
        Linking.openURL(url);
    };

    const getNextAction = () => {
        const currentStatus = delivery?.status;
        const currentIndex = STATUS_FLOW.findIndex((s) => s.key === currentStatus);

        if (currentIndex === -1 || currentIndex >= STATUS_FLOW.length - 1) {
            return null;
        }

        return STATUS_FLOW[currentIndex + 1];
    };

    const handleNextAction = () => {
        const nextAction = getNextAction();
        if (!nextAction) return;

        // Special handling for OTP verification steps
        if (nextAction.key === 'picked_up') {
            setOtpType('pickup');
            setShowOtpInput(true);
        } else if (nextAction.key === 'delivered') {
            setOtpType('delivery');
            setShowOtpInput(true);
        } else {
            updateStatus(nextAction.key);
        }
    };

    if (loading) {
        return (
            <SafeView gradient={gradients.backgroundDark as any}>
                <ImmersiveBackground />
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            </SafeView>
        );
    }

    if (!delivery) {
        return (
            <SafeView gradient={gradients.backgroundDark as any}>
                <ImmersiveBackground />
                <GlassHeader title="Delivery" showBackButton />
                <View style={styles.centerContainer}>
                    <Text style={styles.errorText}>Delivery not found</Text>
                </View>
            </SafeView>
        );
    }

    const nextAction = getNextAction();
    const pickupLocation = delivery.pickup_location;
    const deliveryLocation = delivery.delivery_location;

    return (
        <SafeView gradient={gradients.backgroundDark as any}>
            <ImmersiveBackground />
            <GlassHeader title={`Order #${delivery.order_number}`} showBackButton />

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                {/* Current Status */}
                <Animated.View entering={FadeInDown.delay(100).springify()}>
                    <GlassCard style={styles.statusCard}>
                        <Text style={styles.statusLabel}>Current Status</Text>
                        <View style={styles.statusBadge}>
                            <Ionicons
                                name={STATUS_FLOW.find((s) => s.key === delivery.status)?.icon as any || 'time'}
                                size={24}
                                color={colors.primary}
                            />
                            <Text style={styles.statusText}>
                                {STATUS_FLOW.find((s) => s.key === delivery.status)?.label || delivery.status}
                            </Text>
                        </View>
                    </GlassCard>
                </Animated.View>

                {/* Pickup Location */}
                <Animated.View entering={FadeInDown.delay(200).springify()}>
                    <Text style={styles.sectionTitle}>📍 Pickup Location</Text>
                    <GlassCard style={styles.locationCard}>
                        <View style={styles.locationHeader}>
                            <View style={styles.locationInfo}>
                                <Text style={styles.locationName}>{pickupLocation.shop_name}</Text>
                                <Text style={styles.locationAddress}>{pickupLocation.address}</Text>
                            </View>
                        </View>
                        <View style={styles.locationActions}>
                            <TouchableOpacity style={styles.locationButton} onPress={callShop}>
                                <Ionicons name="call" size={20} color={colors.primary} />
                                <Text style={styles.locationButtonText}>Call</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.locationButton}
                                onPress={() => openMaps(pickupLocation, 'Shop')}
                            >
                                <Ionicons name="navigate" size={20} color={colors.primary} />
                                <Text style={styles.locationButtonText}>Navigate</Text>
                            </TouchableOpacity>
                        </View>
                    </GlassCard>
                </Animated.View>

                {/* Delivery Location */}
                <Animated.View entering={FadeInDown.delay(300).springify()}>
                    <Text style={styles.sectionTitle}>🏠 Delivery Location</Text>
                    <GlassCard style={styles.locationCard}>
                        <View style={styles.locationHeader}>
                            <View style={styles.locationInfo}>
                                <Text style={styles.locationName}>{deliveryLocation.customer_name}</Text>
                                <Text style={styles.locationAddress}>{deliveryLocation.address}</Text>
                            </View>
                        </View>
                        <View style={styles.locationActions}>
                            <TouchableOpacity style={styles.locationButton} onPress={callCustomer}>
                                <Ionicons name="call" size={20} color={colors.primary} />
                                <Text style={styles.locationButtonText}>Call</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.locationButton}
                                onPress={() => openMaps(deliveryLocation, 'Customer')}
                            >
                                <Ionicons name="navigate" size={20} color={colors.primary} />
                                <Text style={styles.locationButtonText}>Navigate</Text>
                            </TouchableOpacity>
                        </View>
                    </GlassCard>
                </Animated.View>

                {/* Earnings */}
                <Animated.View entering={FadeInDown.delay(400).springify()}>
                    <GlassCard style={styles.earningsCard}>
                        <Text style={styles.earningsLabel}>Your Earnings</Text>
                        <Text style={styles.earningsValue}>₹{delivery.partner_earnings}</Text>
                        <Text style={styles.earningsDistance}>
                            {delivery.distance_km} km • {delivery.estimated_time_minutes} min
                        </Text>
                    </GlassCard>
                </Animated.View>

                {/* OTP Input */}
                {showOtpInput && (
                    <Animated.View entering={FadeInDown.springify()}>
                        <GlassCard style={styles.otpCard}>
                            <Text style={styles.otpTitle}>
                                Enter {otpType === 'pickup' ? 'Pickup' : 'Delivery'} OTP
                            </Text>
                            <Text style={styles.otpSubtitle}>
                                {otpType === 'pickup'
                                    ? 'Ask shop owner for 6-digit OTP'
                                    : 'Ask customer for 6-digit OTP'}
                            </Text>
                            <TextInput
                                style={styles.otpInput}
                                value={otp}
                                onChangeText={setOtp}
                                placeholder="000000"
                                keyboardType="number-pad"
                                maxLength={6}
                                placeholderTextColor={colors.textSecondary}
                            />
                            <View style={styles.otpButtons}>
                                <TouchableOpacity
                                    style={[styles.button, styles.buttonSecondary]}
                                    onPress={() => {
                                        setShowOtpInput(false);
                                        setOtp('');
                                    }}
                                >
                                    <Text style={styles.buttonTextSecondary}>Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.button, styles.buttonPrimary]}
                                    onPress={verifyOTP}
                                    disabled={updating}
                                >
                                    {updating ? (
                                        <ActivityIndicator color="#fff" />
                                    ) : (
                                        <Text style={styles.buttonText}>Verify</Text>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </GlassCard>
                    </Animated.View>
                )}

                {/* Next Action Button - LARGE */}
                {nextAction && !showOtpInput && (
                    <Animated.View entering={FadeInDown.delay(500).springify()}>
                        <TouchableOpacity
                            style={styles.nextActionButton}
                            onPress={handleNextAction}
                            disabled={updating}
                        >
                            {updating ? (
                                <ActivityIndicator color="#fff" size="large" />
                            ) : (
                                <>
                                    <Ionicons name={nextAction.icon as any} size={32} color="#fff" />
                                    <Text style={styles.nextActionText}>{nextAction.label}</Text>
                                    <Ionicons name="chevron-forward" size={32} color="#fff" />
                                </>
                            )}
                        </TouchableOpacity>
                    </Animated.View>
                )}
            </ScrollView>
        </SafeView>
    );
}

const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorText: {
        fontSize: 18,
        color: colors.textSecondary,
    },
    content: {
        padding: spacing.lg,
    },
    statusCard: {
        padding: spacing.lg,
        marginBottom: spacing.lg,
        alignItems: 'center',
    },
    statusLabel: {
        fontSize: 14,
        color: colors.textSecondary,
        marginBottom: spacing.sm,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        padding: spacing.md,
        backgroundColor: `${colors.primary}20`,
        borderRadius: borderRadius.lg,
    },
    statusText: {
        fontSize: 20,
        fontWeight: '700',
        color: colors.primary,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.text,
        marginBottom: spacing.md,
    },
    locationCard: {
        padding: spacing.lg,
        marginBottom: spacing.lg,
    },
    locationHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: spacing.md,
    },
    locationInfo: {
        flex: 1,
    },
    locationName: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.text,
        marginBottom: spacing.xs,
    },
    locationAddress: {
        fontSize: 14,
        color: colors.textSecondary,
        lineHeight: 20,
    },
    locationActions: {
        flexDirection: 'row',
        gap: spacing.md,
    },
    locationButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.xs,
        padding: spacing.md,
        backgroundColor: `${colors.primary}20`,
        borderRadius: borderRadius.md,
    },
    locationButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.primary,
    },
    earningsCard: {
        padding: spacing.lg,
        marginBottom: spacing.lg,
        alignItems: 'center',
        backgroundColor: `${colors.success}15`,
    },
    earningsLabel: {
        fontSize: 14,
        color: colors.textSecondary,
        marginBottom: spacing.xs,
    },
    earningsValue: {
        fontSize: 36,
        fontWeight: '900',
        color: colors.success,
        marginBottom: spacing.xs,
    },
    earningsDistance: {
        fontSize: 14,
        color: colors.textSecondary,
    },
    otpCard: {
        padding: spacing.xl,
        marginBottom: spacing.lg,
    },
    otpTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: colors.text,
        marginBottom: spacing.xs,
        textAlign: 'center',
    },
    otpSubtitle: {
        fontSize: 14,
        color: colors.textSecondary,
        marginBottom: spacing.lg,
        textAlign: 'center',
    },
    otpInput: {
        backgroundColor: colors.glassLight,
        borderRadius: borderRadius.lg,
        padding: spacing.lg,
        fontSize: 32,
        fontWeight: '700',
        color: colors.text,
        textAlign: 'center',
        letterSpacing: 8,
        marginBottom: spacing.lg,
    },
    otpButtons: {
        flexDirection: 'row',
        gap: spacing.md,
    },
    button: {
        flex: 1,
        padding: spacing.lg,
        borderRadius: borderRadius.lg,
        alignItems: 'center',
    },
    buttonPrimary: {
        backgroundColor: colors.primary,
    },
    buttonSecondary: {
        backgroundColor: colors.glassLight,
        borderWidth: 1,
        borderColor: colors.glassBorder,
    },
    buttonText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#fff',
    },
    buttonTextSecondary: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.text,
    },
    nextActionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.md,
        padding: spacing.xl,
        backgroundColor: colors.primary,
        borderRadius: borderRadius.xl,
        marginBottom: spacing.xl,
    },
    nextActionText: {
        fontSize: 24,
        fontWeight: '900',
        color: '#fff',
        flex: 1,
        textAlign: 'center',
    },
});
