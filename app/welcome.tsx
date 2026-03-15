// app/welcome.tsx - Premium Welcome/Splash Screen with Auto-Location
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, {
    FadeIn,
    FadeInDown,
    FadeInUp,
    FadeOut,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withSequence,
    withTiming,
} from 'react-native-reanimated';
import { useDispatch } from 'react-redux';
import { GradientButton } from '../src/components/ui/GradientButton';
import { SafeView } from '../src/components/ui/SafeView';
import { useAuth } from '../src/contexts/AuthContext';
import { autoDetectTown } from '../src/services/locationService';
import { setSelectedTown } from '../src/store/slices/locationSlice';
import { colors } from '../src/theme/colors';
import { gradients } from '../src/theme/gradients';
import { borderRadius, spacing } from '../src/theme/spacing';

export default function WelcomeScreen() {
    const { user } = useAuth();
    const dispatch = useDispatch();
    const [loading, setLoading] = useState(!!user);
    const [locationDetected, setLocationDetected] = useState(false);

    // Pulsing animation for logo
    const scale = useSharedValue(1);
    const opacity = useSharedValue(1);

    useEffect(() => {
        // Animate logo
        scale.value = withRepeat(
            withSequence(
                withTiming(1.1, { duration: 1000 }),
                withTiming(1, { duration: 1000 })
            ),
            -1,
            true
        );

        opacity.value = withRepeat(
            withSequence(
                withTiming(0.7, { duration: 1500 }),
                withTiming(1, { duration: 1500 })
            ),
            -1,
            true
        );
    }, []);

    useEffect(() => {
        if (user) {
            // User is logged in - detect location and route
            detectLocationAndRoute();
        }
    }, [user]);

    const detectLocationAndRoute = async () => {
        try {
            setLoading(true);

            // Try to auto-detect location
            const town = await autoDetectTown();
            if (town) {
                dispatch(setSelectedTown(town));
                setLocationDetected(true);
            }

            // Wait minimum 2 seconds for splash effect
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Route based on role
            if (user?.role === 'ADMIN') {
                router.replace('/admin/(tabs)/pending');
            } else if (user?.role === 'STORE_OWNER') {
                // Check if KYC is approved
                if (!user.is_approved) {
                    router.replace('/shop-owner/pending-approval');
                } else {
                    router.replace('/shop-owner/(tabs)');
                }
            } else {
                // Customer — if no town detected, let them pick one first
                if (!town) {
                    router.replace('/select-town');
                } else {
                    router.replace('/(tabs)');
                }
            }
        } catch (error) {
            console.error('Location detection error:', error);
            // Still route to home even if location fails
            setTimeout(() => {
                router.replace('/(tabs)');
            }, 2000);
        } finally {
            setLoading(false);
        }
    };

    const logoAnimatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
        opacity: opacity.value,
    }));

    // Show premium splash for logged-in users
    if (user && loading) {
        return (
            <SafeView gradient={gradients.background}>
                {/* Animated background particles */}
                <View style={styles.particlesContainer}>
                    {[...Array(8)].map((_, i) => (
                        <Animated.View
                            key={i}
                            entering={FadeIn.delay(i * 150).duration(1200)}
                            style={[
                                styles.splashParticle,
                                {
                                    top: `${10 + Math.random() * 70}%`,
                                    left: `${5 + Math.random() * 85}%`,
                                    width: 60 + Math.random() * 100,
                                    height: 60 + Math.random() * 100,
                                    opacity: 0.03 + Math.random() * 0.05,
                                }
                            ]}
                        />
                    ))}
                </View>

                <Animated.View
                    entering={FadeIn.duration(600)}
                    style={styles.splashContainer}
                >
                    {/* Pulsing logo with glow effect */}
                    <View style={styles.logoContainer}>
                        <Animated.View style={[logoAnimatedStyle]}>
                            <LinearGradient
                                colors={['#10b981', '#059669', '#047857']}
                                style={styles.splashIcon}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                            >
                                <Ionicons name="cart" size={64} color={colors.text} />
                            </LinearGradient>
                        </Animated.View>

                        {/* Glow rings */}
                        <Animated.View
                            entering={FadeIn.delay(400).duration(1000)}
                            style={[styles.glowRing, styles.glowRing1]}
                        />
                        <Animated.View
                            entering={FadeIn.delay(600).duration(1000)}
                            style={[styles.glowRing, styles.glowRing2]}
                        />
                    </View>

                    {/* Animated title with gradient */}
                    <Animated.View entering={FadeInUp.delay(300).springify()}>
                        <Text style={styles.splashTitle}>
                            Local <Text style={styles.splashHighlight}>Market</Text>
                        </Text>
                    </Animated.View>

                    {/* Dynamic tagline */}
                    <Animated.Text
                        entering={FadeInUp.delay(500).springify()}
                        style={styles.splashTagline}
                    >
                        Your neighborhood, delivered
                    </Animated.Text>

                    {/* Animated dots */}
                    <Animated.View
                        entering={FadeIn.delay(700)}
                        style={styles.dotsContainer}
                    >
                        {[0, 1, 2].map((i) => (
                            <Animated.View
                                key={i}
                                entering={FadeIn.delay(700 + i * 150).duration(600)}
                                style={[
                                    styles.dot,
                                    {
                                        backgroundColor: '#10b981',
                                        opacity: 0.6 + (i * 0.2)
                                    }
                                ]}
                            />
                        ))}
                    </Animated.View>
                </Animated.View>
            </SafeView>
        );
    }

    // Show welcome screen for non-authenticated users
    return (
        <SafeView gradient={gradients.background}>
            <Animated.View
                entering={FadeIn.duration(800)}
                exiting={FadeOut.duration(400)}
                style={styles.container}
            >
                {/* Floating particles background effect */}
                <View style={styles.particlesContainer}>
                    {[...Array(6)].map((_, i) => (
                        <Animated.View
                            key={i}
                            entering={FadeIn.delay(i * 200).duration(1000)}
                            style={[
                                styles.particle,
                                {
                                    top: `${Math.random() * 80}%`,
                                    left: `${Math.random() * 80}%`,
                                    width: 40 + Math.random() * 60,
                                    height: 40 + Math.random() * 60,
                                }
                            ]}
                        />
                    ))}
                </View>

                {/* Hero Section */}
                <Animated.View
                    entering={FadeInDown.duration(1000).springify()}
                    style={styles.hero}
                >
                    <LinearGradient
                        colors={['#10b981', '#059669', '#047857']}
                        style={styles.iconGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    >
                        <Ionicons name="cart" size={56} color={colors.text} />
                    </LinearGradient>

                    <Text style={styles.heroTitle}>
                        Local <Text style={styles.highlight}>Market</Text>
                    </Text>
                    <Text style={styles.heroSubtitle}>
                        Your neighborhood, delivered.
                    </Text>
                </Animated.View>

                {/* Feature Pills */}
                <Animated.View
                    entering={FadeInUp.duration(1000).delay(300).springify()}
                    style={styles.features}
                >
                    <View style={styles.featureRow}>
                        <LinearGradient
                            colors={['rgba(251, 191, 36, 0.2)', 'rgba(251, 191, 36, 0.05)']}
                            style={styles.featurePill}
                        >
                            <Ionicons name="flash" size={18} color="#fbbf24" />
                            <Text style={styles.featureText}>Fast Delivery</Text>
                        </LinearGradient>
                        <LinearGradient
                            colors={['rgba(34, 197, 94, 0.2)', 'rgba(34, 197, 94, 0.05)']}
                            style={styles.featurePill}
                        >
                            <Ionicons name="shield-checkmark" size={18} color="#22c55e" />
                            <Text style={styles.featureText}>Secure</Text>
                        </LinearGradient>
                    </View>
                    <View style={styles.featureRow}>
                        <LinearGradient
                            colors={['rgba(239, 68, 68, 0.2)', 'rgba(239, 68, 68, 0.05)']}
                            style={styles.featurePill}
                        >
                            <Ionicons name="heart" size={18} color="#ef4444" />
                            <Text style={styles.featureText}>Support Local</Text>
                        </LinearGradient>
                    </View>
                </Animated.View>

                {/* Actions */}
                <Animated.View
                    entering={FadeInUp.duration(1000).delay(600).springify()}
                    style={styles.actions}
                >
                    <GradientButton
                        title="Get Started"
                        onPress={() => router.push('/auth/role-selection')}
                    />

                    <TouchableOpacity
                        style={styles.loginButton}
                        onPress={() => router.push('/auth/role-selection')}
                    >
                        <Text style={styles.loginText}>I already have an account</Text>
                    </TouchableOpacity>
                </Animated.View>
            </Animated.View>
        </SafeView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: spacing.xl,
        justifyContent: 'space-between',
    },
    splashContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    logoContainer: {
        position: 'relative',
        marginBottom: spacing.xxl,
    },
    splashIcon: {
        width: 140,
        height: 140,
        borderRadius: 36,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#10b981',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.5,
        shadowRadius: 24,
        elevation: 12,
    },
    glowRing: {
        position: 'absolute',
        borderRadius: 999,
        borderWidth: 2,
        borderColor: 'rgba(16, 185, 129, 0.3)',
    },
    glowRing1: {
        width: 170,
        height: 170,
        top: -15,
        left: -15,
    },
    glowRing2: {
        width: 200,
        height: 200,
        top: -30,
        left: -30,
        borderColor: 'rgba(16, 185, 129, 0.15)',
    },
    splashTitle: {
        fontSize: 56,
        fontWeight: 'bold',
        color: colors.text,
        textAlign: 'center',
        letterSpacing: -1,
    },
    splashHighlight: {
        color: '#10b981',
    },
    splashTagline: {
        fontSize: 18,
        color: colors.textMuted,
        textAlign: 'center',
        marginTop: spacing.md,
        fontWeight: '500',
    },
    dotsContainer: {
        flexDirection: 'row',
        gap: spacing.sm,
        marginTop: spacing.xl,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    particlesContainer: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 0,
    },
    particle: {
        position: 'absolute',
        borderRadius: 999,
        backgroundColor: 'rgba(16, 185, 129, 0.05)',
        borderWidth: 1,
        borderColor: 'rgba(16, 185, 129, 0.1)',
    },
    splashParticle: {
        position: 'absolute',
        borderRadius: 999,
        backgroundColor: 'rgba(16, 185, 129, 0.05)',
        borderWidth: 1,
        borderColor: 'rgba(16, 185, 129, 0.1)',
    },
    hero: {
        alignItems: 'center',
        marginTop: spacing.xxxl * 2,
        zIndex: 1,
    },
    iconGradient: {
        width: 120,
        height: 120,
        borderRadius: 32,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.xxl,
        shadowColor: '#10b981',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.4,
        shadowRadius: 20,
        elevation: 10,
    },
    heroTitle: {
        fontSize: 52,
        fontWeight: 'bold',
        color: colors.text,
        textAlign: 'center',
        marginBottom: spacing.md,
        letterSpacing: -1,
    },
    highlight: {
        color: '#10b981',
    },
    heroSubtitle: {
        fontSize: 20,
        color: colors.textMuted,
        textAlign: 'center',
        fontWeight: '500',
    },
    features: {
        gap: spacing.lg,
        alignItems: 'center',
        zIndex: 1,
    },
    featureRow: {
        flexDirection: 'row',
        gap: spacing.md,
    },
    featurePill: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        borderRadius: borderRadius.full,
        gap: spacing.sm,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    featureText: {
        color: colors.text,
        fontSize: 15,
        fontWeight: '600',
    },
    actions: {
        gap: spacing.md,
        marginBottom: spacing.xl,
        zIndex: 1,
    },
    loginButton: {
        alignItems: 'center',
        padding: spacing.md,
    },
    loginText: {
        color: '#10b981',
        fontSize: 17,
        fontWeight: '600',
    },
});
