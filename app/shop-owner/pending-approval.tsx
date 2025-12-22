// app/shop-owner/pending-approval.tsx
// Pending KYC Approval Screen

import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import Animated, {
    FadeIn,
    FadeInDown,
    FadeInUp,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withSequence,
    withTiming,
} from 'react-native-reanimated';
import { GlassCard } from '../../src/components/ui/GlassCard';
import { GlassHeader } from '../../src/components/ui/GlassHeader';
import { ImmersiveBackground } from '../../src/components/ui/ImmersiveBackground';
import { SafeView } from '../../src/components/ui/SafeView';
import { api } from '../../src/lib/api';
import { colors } from '../../src/theme/colors';
import { gradients } from '../../src/theme/gradients';

type VerificationStatus = 'pending' | 'submitted' | 'approved' | 'rejected';

export default function PendingApprovalScreen() {
    const router = useRouter();
    const [status, setStatus] = useState<VerificationStatus>('pending');
    const [refreshing, setRefreshing] = useState(false);
    const [rejectionReason, setRejectionReason] = useState('');

    // Pulsing animation for pending icon
    const scale = useSharedValue(1);

    useEffect(() => {
        if (status === 'pending') {
            scale.value = withRepeat(
                withSequence(
                    withTiming(1.1, { duration: 1000 }),
                    withTiming(1, { duration: 1000 })
                ),
                -1,
                true
            );
        }
    }, [status]);

    const pulseStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));



    const checkStatus = async () => {
        setRefreshing(true);

        try {
            const response = await api.get('/api/shop-owner/kyc/status');
            setStatus(response.data.verificationStatus);
            if (response.data.verificationStatus === 'rejected') {
                setRejectionReason(response.data.rejectionReason || 'Documents not clear');
            }
            setRefreshing(false);
        } catch (error) {
            console.error('Check status error:', error);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        checkStatus();
    }, []);

    useEffect(() => {
        if (status === 'approved') {
            // Redirect to dashboard after approval
            setTimeout(() => {
                router.replace('/shop-owner/(tabs)');
            }, 2000);
        }
    }, [status]);

    const handleLogout = async () => {
        try {
            await SecureStore.deleteItemAsync('auth_token');
            await SecureStore.deleteItemAsync('auth_user');
            router.replace('/auth/role-selection');
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    const renderPendingView = () => (
        <>
            <Animated.View
                entering={FadeInDown.delay(100).springify()}
                style={styles.header}
            >
                <Animated.View style={[styles.iconContainer, pulseStyle]}>
                    <LinearGradient
                        colors={['rgba(251, 191, 36, 0.3)', 'rgba(251, 191, 36, 0.1)']}
                        style={styles.iconGradient}
                    >
                        <Ionicons name="time-outline" size={60} color="#fbbf24" />
                    </LinearGradient>
                </Animated.View>
                <Text style={styles.title}>Verification in Progress</Text>
                <Text style={styles.subtitle}>
                    Your KYC documents are being reviewed by our team
                </Text>
            </Animated.View>

            <Animated.View entering={FadeInUp.delay(200).springify()}>
                <GlassCard style={styles.card}>
                    <View style={styles.timelineContainer}>
                        <View style={styles.timelineItem}>
                            <View style={[styles.timelineDot, styles.timelineDotComplete]}>
                                <Ionicons name="checkmark" size={16} color="#fff" />
                            </View>
                            <View style={styles.timelineContent}>
                                <Text style={styles.timelineTitle}>Documents Submitted</Text>
                                <Text style={styles.timelineTime}>Completed</Text>
                            </View>
                        </View>

                        <View style={styles.timelineLine} />

                        <View style={styles.timelineItem}>
                            <View style={[styles.timelineDot, styles.timelineDotActive]}>
                                <ActivityIndicator size="small" color="#fff" />
                            </View>
                            <View style={styles.timelineContent}>
                                <Text style={styles.timelineTitle}>Under Review</Text>
                                <Text style={styles.timelineTime}>In Progress</Text>
                            </View>
                        </View>

                        <View style={styles.timelineLine} />

                        <View style={styles.timelineItem}>
                            <View style={styles.timelineDot} />
                            <View style={styles.timelineContent}>
                                <Text style={[styles.timelineTitle, styles.timelineTitleInactive]}>
                                    Verification Complete
                                </Text>
                                <Text style={styles.timelineTime}>Pending</Text>
                            </View>
                        </View>
                    </View>

                    <View style={styles.estimateCard}>
                        <Ionicons name="calendar-outline" size={20} color={colors.primary} />
                        <Text style={styles.estimateText}>
                            Estimated time: <Text style={styles.estimateBold}>24-48 hours</Text>
                        </Text>
                    </View>
                </GlassCard>
            </Animated.View>

            <Animated.View entering={FadeInUp.delay(400).springify()} style={styles.actionsContainer}>
                <TouchableOpacity
                    style={styles.refreshButton}
                    onPress={checkStatus}
                    activeOpacity={0.8}
                >
                    <Ionicons name="refresh" size={20} color={colors.primary} />
                    <Text style={styles.refreshText}>Check Status</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.supportButton} activeOpacity={0.8}>
                    <Ionicons name="chatbubble-outline" size={20} color={colors.textMuted} />
                    <Text style={styles.supportText}>Contact Support</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.logoutButton}
                    onPress={handleLogout}
                    activeOpacity={0.8}
                >
                    <Ionicons name="log-out-outline" size={20} color={colors.error} />
                    <Text style={styles.logoutText}>Log Out</Text>
                </TouchableOpacity>
            </Animated.View>
        </>
    );

    const renderApprovedView = () => (
        <>
            <Animated.View
                entering={FadeIn.duration(600)}
                style={styles.header}
            >
                <View style={styles.iconContainer}>
                    <LinearGradient
                        colors={['rgba(16, 185, 129, 0.3)', 'rgba(16, 185, 129, 0.1)']}
                        style={styles.iconGradient}
                    >
                        <Ionicons name="checkmark-circle" size={60} color={colors.primary} />
                    </LinearGradient>
                </View>
                <Text style={styles.title}>Verification Approved! 🎉</Text>
                <Text style={styles.subtitle}>
                    Your shop is now verified. Redirecting to dashboard...
                </Text>
            </Animated.View>
        </>
    );

    const renderRejectedView = () => (
        <>
            <Animated.View
                entering={FadeInDown.delay(100).springify()}
                style={styles.header}
            >
                <View style={styles.iconContainer}>
                    <LinearGradient
                        colors={['rgba(239, 68, 68, 0.3)', 'rgba(239, 68, 68, 0.1)']}
                        style={styles.iconGradient}
                    >
                        <Ionicons name="close-circle" size={60} color={colors.error} />
                    </LinearGradient>
                </View>
                <Text style={styles.title}>Verification Rejected</Text>
                <Text style={styles.subtitle}>
                    Unfortunately, your KYC documents couldn't be verified
                </Text>
            </Animated.View>

            <Animated.View entering={FadeInUp.delay(200).springify()}>
                <GlassCard style={styles.card}>
                    <View style={styles.rejectionCard}>
                        <Text style={styles.rejectionTitle}>Reason for Rejection:</Text>
                        <Text style={styles.rejectionReason}>
                            {rejectionReason || 'Invalid or unclear documents. Please re-upload clear images.'}
                        </Text>
                    </View>

                    <TouchableOpacity
                        style={styles.reuploadButton}
                        onPress={() => router.push('/shop-owner/kyc-upload')}
                        activeOpacity={0.8}
                    >
                        <Ionicons name="cloud-upload-outline" size={20} color="#fff" />
                        <Text style={styles.reuploadText}>Re-upload Documents</Text>
                    </TouchableOpacity>
                </GlassCard>
            </Animated.View>
        </>
    );

    return (
        <SafeView gradient={gradients.background as any}>
            <ImmersiveBackground />
            <GlassHeader title="KYC Status" showBackButton={false} />

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={checkStatus}
                        tintColor={colors.primary}
                    />
                }
            >
                {(status === 'pending' || status === 'submitted') && renderPendingView()}
                {status === 'approved' && renderApprovedView()}
                {status === 'rejected' && renderRejectedView()}
            </ScrollView>
        </SafeView>
    );
}

const styles = StyleSheet.create({
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 40,
    },
    header: {
        alignItems: 'center',
        marginBottom: 32,
        marginTop: 40,
    },
    iconContainer: {
        marginBottom: 24,
    },
    iconGradient: {
        width: 120,
        height: 120,
        borderRadius: 60,
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        fontSize: 28,
        fontWeight: '700',
        color: colors.text,
        marginBottom: 8,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 15,
        color: colors.textMuted,
        textAlign: 'center',
        lineHeight: 22,
        paddingHorizontal: 20,
    },
    card: {
        padding: 24,
    },
    timelineContainer: {
        marginBottom: 24,
    },
    timelineItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    timelineDot: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    timelineDotComplete: {
        backgroundColor: colors.primary,
    },
    timelineDotActive: {
        backgroundColor: '#fbbf24',
    },
    timelineContent: {
        flex: 1,
        paddingTop: 4,
    },
    timelineTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.text,
        marginBottom: 4,
    },
    timelineTitleInactive: {
        color: colors.textMuted,
    },
    timelineTime: {
        fontSize: 13,
        color: colors.textMuted,
    },
    timelineLine: {
        width: 2,
        height: 32,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        marginLeft: 15,
        marginVertical: 4,
    },
    estimateCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        borderRadius: 12,
        padding: 16,
        gap: 12,
        borderWidth: 1,
        borderColor: 'rgba(16, 185, 129, 0.2)',
    },
    estimateText: {
        flex: 1,
        fontSize: 14,
        color: colors.textMuted,
    },
    estimateBold: {
        fontWeight: '600',
        color: colors.text,
    },
    actionsContainer: {
        gap: 12,
        marginTop: 24,
    },
    refreshButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(16, 185, 129, 0.15)',
        borderRadius: 12,
        paddingVertical: 16,
        gap: 8,
        borderWidth: 1,
        borderColor: 'rgba(16, 185, 129, 0.3)',
    },
    refreshText: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.primary,
    },
    supportButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 12,
        paddingVertical: 16,
        gap: 8,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    supportText: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.textMuted,
    },
    rejectionCard: {
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderRadius: 12,
        padding: 16,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.2)',
    },
    rejectionTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.text,
        marginBottom: 8,
    },
    rejectionReason: {
        fontSize: 14,
        color: colors.textMuted,
        lineHeight: 20,
    },
    reuploadButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.primary,
        borderRadius: 12,
        paddingVertical: 16,
        gap: 8,
    },
    reuploadText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderRadius: 12,
        paddingVertical: 16,
        gap: 8,
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.2)',
    },
    logoutText: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.error,
    },
});
