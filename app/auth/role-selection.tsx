// app/auth/role-selection.tsx
// Premium Role Selection Screen

import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { GlassCard } from '../../src/components/ui/GlassCard';
import { GlassHeader } from '../../src/components/ui/GlassHeader';
import { ImmersiveBackground } from '../../src/components/ui/ImmersiveBackground';
import { SafeView } from '../../src/components/ui/SafeView';
import { colors } from '../../src/theme/colors';
import { gradients } from '../../src/theme/gradients';

export default function RoleSelectionScreen() {
    const router = useRouter();

    const handleRoleSelect = (role: 'customer' | 'shop_owner' | 'delivery_partner') => {
        if (role === 'customer') {
            router.push('/auth/login');
        } else if (role === 'shop_owner') {
            router.push('/shop-owner/login');
        } else {
            router.push('/delivery-partner/register');
        }
    };

    return (
        <SafeView gradient={gradients.background as any}>
            <ImmersiveBackground />
            <GlassHeader title="Choose Your Role" showBackButton />

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.container}>
                    <Animated.View
                        entering={FadeInDown.delay(100).springify()}
                        style={styles.header}
                    >
                        <View style={styles.iconContainer}>
                            <LinearGradient
                                colors={['#10b981', '#059669']}
                                style={styles.iconGradient}
                            >
                                <Ionicons name="people" size={40} color={colors.text} />
                            </LinearGradient>
                        </View>
                        <Text style={styles.title}>How would you like to continue?</Text>
                        <Text style={styles.subtitle}>
                            Select your role to get started with Local Market
                        </Text>
                    </Animated.View>

                    <View style={styles.cardsContainer}>
                        {/* Customer Card */}
                        <Animated.View
                            entering={FadeInUp.delay(200).springify()}
                            style={styles.cardWrapper}
                        >
                            <TouchableOpacity
                                activeOpacity={0.8}
                                onPress={() => handleRoleSelect('customer')}
                            >
                                <GlassCard style={styles.roleCard}>
                                    <LinearGradient
                                        colors={['rgba(16, 185, 129, 0.3)', 'rgba(16, 185, 129, 0.1)']}
                                        style={styles.roleIconContainer}
                                    >
                                        <Ionicons name="cart" size={40} color={colors.primary} />
                                    </LinearGradient>

                                    <Text style={styles.roleTitle}>I'm a Customer</Text>
                                    <Text style={styles.roleDescription}>
                                        Browse local shops, order products, and get them delivered to your doorstep
                                    </Text>

                                    <View style={styles.features}>
                                        <View style={styles.feature}>
                                            <Ionicons name="checkmark-circle" size={18} color={colors.primary} />
                                            <Text style={styles.featureText}>Browse 100+ local shops</Text>
                                        </View>
                                        <View style={styles.feature}>
                                            <Ionicons name="checkmark-circle" size={18} color={colors.primary} />
                                            <Text style={styles.featureText}>Fast delivery to your area</Text>
                                        </View>
                                        <View style={styles.feature}>
                                            <Ionicons name="checkmark-circle" size={18} color={colors.primary} />
                                            <Text style={styles.featureText}>Track orders in real-time</Text>
                                        </View>
                                    </View>

                                    <View style={styles.continueButton}>
                                        <Text style={styles.continueText}>Continue as Customer</Text>
                                        <Ionicons name="arrow-forward" size={20} color={colors.primary} />
                                    </View>
                                </GlassCard>
                            </TouchableOpacity>
                        </Animated.View>

                        {/* Shop Owner Card */}
                        <Animated.View
                            entering={FadeInUp.delay(300).springify()}
                            style={styles.cardWrapper}
                        >
                            <TouchableOpacity
                                activeOpacity={0.8}
                                onPress={() => handleRoleSelect('shop_owner')}
                            >
                                <GlassCard style={styles.roleCard}>
                                    <LinearGradient
                                        colors={['rgba(251, 191, 36, 0.3)', 'rgba(251, 191, 36, 0.1)']}
                                        style={styles.roleIconContainer}
                                    >
                                        <Ionicons name="storefront" size={40} color="#fbbf24" />
                                    </LinearGradient>

                                    <Text style={styles.roleTitle}>I'm a Shop Owner</Text>
                                    <Text style={styles.roleDescription}>
                                        List your products, manage orders, and grow your business online
                                    </Text>

                                    <View style={styles.features}>
                                        <View style={styles.feature}>
                                            <Ionicons name="checkmark-circle" size={18} color="#fbbf24" />
                                            <Text style={styles.featureText}>Manage products easily</Text>
                                        </View>
                                        <View style={styles.feature}>
                                            <Ionicons name="checkmark-circle" size={18} color="#fbbf24" />
                                            <Text style={styles.featureText}>Track sales & analytics</Text>
                                        </View>
                                        <View style={styles.feature}>
                                            <Ionicons name="checkmark-circle" size={18} color="#fbbf24" />
                                            <Text style={styles.featureText}>Grow your business</Text>
                                        </View>
                                    </View>

                                    <View style={[styles.continueButton, styles.continueButtonAlt]}>
                                        <Text style={[styles.continueText, styles.continueTextAlt]}>
                                            Continue as Shop Owner
                                        </Text>
                                        <Ionicons name="arrow-forward" size={20} color="#fbbf24" />
                                    </View>
                                </GlassCard>
                            </TouchableOpacity>
                        </Animated.View>

                        {/* Delivery Partner Card */}
                        <Animated.View
                            entering={FadeInUp.delay(400).springify()}
                            style={styles.cardWrapper}
                        >
                            <TouchableOpacity
                                style={styles.roleCard}
                                onPress={() => router.push('/delivery-partner/login')}
                                activeOpacity={0.9}
                            >
                                <GlassCard style={styles.roleCard}>
                                    <LinearGradient
                                        colors={['rgba(59, 130, 246, 0.3)', 'rgba(59, 130, 246, 0.1)']}
                                        style={styles.roleIconContainer}
                                    >
                                        <Ionicons name="bicycle" size={40} color="#3b82f6" />
                                    </LinearGradient>

                                    <Text style={styles.roleTitle}>I'm a Delivery Partner</Text>
                                    <Text style={styles.roleDescription}>
                                        Earn money by delivering orders to customers in your area
                                    </Text>

                                    <View style={styles.features}>
                                        <View style={styles.feature}>
                                            <Ionicons name="checkmark-circle" size={18} color="#3b82f6" />
                                            <Text style={styles.featureText}>Flexible working hours</Text>
                                        </View>
                                        <View style={styles.feature}>
                                            <Ionicons name="checkmark-circle" size={18} color="#3b82f6" />
                                            <Text style={styles.featureText}>Daily earnings payout</Text>
                                        </View>
                                        <View style={styles.feature}>
                                            <Ionicons name="checkmark-circle" size={18} color="#3b82f6" />
                                            <Text style={styles.featureText}>Bonus incentives</Text>
                                        </View>
                                    </View>

                                    <View style={[styles.continueButton, styles.continueButtonDelivery]}>
                                        <Text style={[styles.continueText, styles.continueTextDelivery]}>
                                            Continue as Delivery Partner
                                        </Text>
                                        <Ionicons name="arrow-forward" size={20} color="#3b82f6" />
                                    </View>
                                </GlassCard>
                            </TouchableOpacity>
                        </Animated.View>
                    </View>

                    {/* Info Footer */}
                    <Animated.View
                        entering={FadeInUp.delay(400).springify()}
                        style={styles.footer}
                    >
                        <View style={styles.infoCard}>
                            <Ionicons name="information-circle" size={20} color={colors.primary} />
                            <Text style={styles.infoText}>
                                You can always switch between roles later in your account settings
                            </Text>
                        </View>
                    </Animated.View>
                </View>
            </ScrollView>
        </SafeView>
    );
}

const styles = StyleSheet.create({
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        paddingBottom: 40,
    },
    container: {
        flex: 1,
        padding: 20,
    },
    header: {
        alignItems: 'center',
        marginBottom: 32,
        marginTop: 20,
    },
    iconContainer: {
        marginBottom: 20,
    },
    iconGradient: {
        width: 80,
        height: 80,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#10b981',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 8,
    },
    title: {
        fontSize: 28,
        fontWeight: '700',
        color: colors.text,
        textAlign: 'center',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 15,
        color: colors.textMuted,
        textAlign: 'center',
        lineHeight: 22,
    },
    cardsContainer: {
        gap: 20,
    },
    cardWrapper: {
        width: '100%',
    },
    roleCard: {
        padding: 24,
        gap: 16,
    },
    roleIconContainer: {
        width: 80,
        height: 80,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        alignSelf: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    roleTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: colors.text,
        textAlign: 'center',
    },
    roleDescription: {
        fontSize: 14,
        color: colors.textMuted,
        textAlign: 'center',
        lineHeight: 20,
    },
    features: {
        gap: 12,
        marginTop: 8,
    },
    feature: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    featureText: {
        fontSize: 14,
        color: colors.text,
        flex: 1,
    },
    continueButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(16, 185, 129, 0.15)',
        borderRadius: 12,
        paddingVertical: 16,
        marginTop: 8,
        gap: 8,
        borderWidth: 1,
        borderColor: 'rgba(16, 185, 129, 0.3)',
    },
    continueButtonAlt: {
        backgroundColor: 'rgba(251, 191, 36, 0.15)',
        borderColor: 'rgba(251, 191, 36, 0.3)',
    },
    continueText: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.primary,
    },
    continueTextAlt: {
        color: '#fbbf24',
    },
    continueButtonDelivery: {
        backgroundColor: 'rgba(59, 130, 246, 0.15)',
        borderColor: 'rgba(59, 130, 246, 0.3)',
    },
    continueTextDelivery: {
        color: '#3b82f6',
    },
    footer: {
        marginTop: 32,
    },
    infoCard: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        borderRadius: 12,
        padding: 16,
        gap: 12,
        borderWidth: 1,
        borderColor: 'rgba(16, 185, 129, 0.2)',
    },
    infoText: {
        flex: 1,
        fontSize: 13,
        color: colors.textMuted,
        lineHeight: 18,
    },
});
