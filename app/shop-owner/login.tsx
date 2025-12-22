// app/shop-owner/login.tsx
// Premium Shop Owner Login Screen

import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import React, { useState } from 'react';
import {
    Alert,
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
} from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { GlassCard } from '../../src/components/ui/GlassCard';
import { GlassHeader } from '../../src/components/ui/GlassHeader';
import { ImmersiveBackground } from '../../src/components/ui/ImmersiveBackground';
import { SafeView } from '../../src/components/ui/SafeView';
import { api } from '../../src/lib/api';
import { colors } from '../../src/theme/colors';
import { gradients } from '../../src/theme/gradients';

// Force Bundle Reload

export default function ShopOwnerLoginScreen() {
    const router = useRouter();
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        if (!phone || phone.length < 10) {
            Alert.alert('Error', 'Please enter a valid phone number');
            return;
        }
        if (!password) {
            Alert.alert('Error', 'Please enter your password');
            return;
        }

        setLoading(true);

        try {
            const response = await api.post('/auth/login', {
                phone,
                password
            });

            const { token, user } = response.data;

            await SecureStore.setItemAsync('auth_token', token);
            await SecureStore.setItemAsync('auth_user', JSON.stringify(user));
            api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

            // Check shop status to determine where to redirect
            try {
                const shopStatus = await api.get('/api/shop-owner/kyc/status');
                const status = shopStatus.data.verificationStatus;

                if (status === 'approved') {
                    router.replace('/shop-owner/(tabs)');
                } else {
                    router.replace('/shop-owner/pending-approval');
                }
            } catch (error) {
                // If 404, it means shop is not registered, but we are logging in as existing user
                // Could act as registration/onboarding flow if needed, but for now assume flow is correct
                router.replace('/shop-owner/(tabs)');
            }

        } catch (error: any) {
            console.error('Login Error:', error);
            Alert.alert('Error', error.response?.data?.error || 'Invalid credentials');
        } finally {
            setLoading(false);
        }
    };

    const handleRegister = () => {
        router.push('/shop-owner/register');
    };

    return (
        <SafeView gradient={gradients.background as any}>
            <ImmersiveBackground />
            <GlassHeader title="Shop Owner Login" showBackButton />

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.container}
            >
                <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                    <ScrollView
                        style={styles.scrollView}
                        contentContainerStyle={styles.scrollContent}
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                    >
                        {/* Header */}
                        <Animated.View
                            entering={FadeInDown.delay(100).springify()}
                            style={styles.header}
                        >
                            <LinearGradient
                                colors={['rgba(251, 191, 36, 0.3)', 'rgba(251, 191, 36, 0.1)']}
                                style={styles.iconContainer}
                            >
                                <Ionicons name="storefront" size={48} color="#fbbf24" />
                            </LinearGradient>
                            <Text style={styles.title}>Welcome Back, Shop Owner!</Text>
                            <Text style={styles.subtitle}>
                                Login to manage your shop and products
                            </Text>
                        </Animated.View>

                        {/* Login Form */}
                        <Animated.View
                            entering={FadeInUp.delay(200).springify()}
                            style={styles.formContainer}
                        >
                            <GlassCard style={styles.card}>
                                <Text style={styles.cardTitle}>Login to Continue</Text>

                                {/* Phone Input */}
                                <View style={styles.inputGroup}>
                                    <Text style={styles.label}>Phone Number</Text>
                                    <View style={styles.inputContainer}>
                                        <Ionicons
                                            name="call-outline"
                                            size={20}
                                            color={colors.textMuted}
                                        />
                                        <TextInput
                                            style={styles.input}
                                            placeholder="Enter your phone number"
                                            placeholderTextColor={colors.textMuted}
                                            value={phone}
                                            onChangeText={setPhone}
                                            keyboardType="phone-pad"
                                            maxLength={10}
                                            autoFocus
                                        />
                                    </View>
                                </View>
                                <View style={styles.inputGroup}>
                                    <Text style={styles.label}>Password</Text>
                                    <View style={styles.inputContainer}>
                                        <Ionicons
                                            name="lock-closed-outline"
                                            size={20}
                                            color={colors.textMuted}
                                        />
                                        <TextInput
                                            style={styles.input}
                                            placeholder="Enter your password"
                                            placeholderTextColor={colors.textMuted}
                                            value={password}
                                            onChangeText={setPassword}
                                            secureTextEntry
                                        />
                                    </View>
                                </View>

                                {/* Login Button */}
                                <TouchableOpacity
                                    style={[styles.button, loading && styles.buttonDisabled]}
                                    onPress={handleLogin}
                                    disabled={loading}
                                    activeOpacity={0.8}
                                >
                                    <LinearGradient
                                        colors={['#fbbf24', '#f59e0b']}
                                        style={styles.buttonGradient}
                                    >
                                        <Text style={styles.buttonText}>
                                            {loading ? 'Logging in...' : 'Login'}
                                        </Text>
                                        <Ionicons name="arrow-forward" size={20} color="#fff" />
                                    </LinearGradient>
                                </TouchableOpacity>

                                {/* Divider */}
                                <View style={styles.divider}>
                                    <View style={styles.dividerLine} />
                                    <Text style={styles.dividerText}>OR</Text>
                                    <View style={styles.dividerLine} />
                                </View>

                                {/* Register Link */}
                                <TouchableOpacity
                                    style={styles.registerButton}
                                    onPress={handleRegister}
                                    activeOpacity={0.8}
                                >
                                    <Text style={styles.registerText}>
                                        New shop owner?{' '}
                                        <Text style={styles.registerLink}>Register Now</Text>
                                    </Text>
                                </TouchableOpacity>
                            </GlassCard>
                        </Animated.View>

                        {/* Info Card */}
                        <Animated.View
                            entering={FadeInUp.delay(400).springify()}
                            style={styles.infoContainer}
                        >
                            <View style={styles.infoCard}>
                                <Ionicons name="information-circle" size={20} color="#fbbf24" />
                                <Text style={styles.infoText}>
                                    You'll need to complete KYC verification after registration to start selling
                                </Text>
                            </View>
                        </Animated.View>

                        {/* Footer */}
                        <Animated.View
                            entering={FadeInUp.delay(500).springify()}
                            style={styles.footer}
                        >
                            <Text style={styles.footerText}>
                                By continuing, you agree to our{'\n'}
                                <Text style={styles.footerLink}>Terms & Conditions</Text> and{' '}
                                <Text style={styles.footerLink}>Privacy Policy</Text>
                            </Text>
                        </Animated.View>
                    </ScrollView>
                </TouchableWithoutFeedback>
            </KeyboardAvoidingView>
        </SafeView >
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        padding: 20,
        paddingBottom: 40,
    },
    header: {
        alignItems: 'center',
        marginBottom: 32,
        marginTop: 20,
    },
    iconContainer: {
        width: 100,
        height: 100,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
        shadowColor: '#fbbf24',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 8,
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
    },
    formContainer: {
        marginBottom: 24,
    },
    card: {
        padding: 24,
    },
    cardTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: colors.text,
        marginBottom: 24,
        textAlign: 'center',
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.text,
        marginBottom: 8,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 12,
        paddingHorizontal: 16,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        gap: 12,
    },
    input: {
        flex: 1,
        height: 56,
        fontSize: 16,
        color: colors.text,
    },
    button: {
        borderRadius: 12,
        overflow: 'hidden',
        marginBottom: 16,
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    buttonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: 56,
        gap: 8,
    },
    buttonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
    },
    divider: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 24,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
    dividerText: {
        marginHorizontal: 16,
        fontSize: 14,
        color: colors.textMuted,
    },
    registerButton: {
        alignItems: 'center',
    },
    registerText: {
        fontSize: 14,
        color: colors.textMuted,
    },
    registerLink: {
        color: '#fbbf24',
        fontWeight: '600',
    },
    infoContainer: {
        marginBottom: 24,
    },
    infoCard: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: 'rgba(251, 191, 36, 0.1)',
        borderRadius: 12,
        padding: 16,
        gap: 12,
        borderWidth: 1,
        borderColor: 'rgba(251, 191, 36, 0.2)',
    },
    infoText: {
        flex: 1,
        fontSize: 13,
        color: colors.textMuted,
        lineHeight: 18,
    },
    footer: {
        marginTop: 8,
    },
    footerText: {
        fontSize: 12,
        color: colors.textMuted,
        textAlign: 'center',
        lineHeight: 18,
    },
    footerLink: {
        color: '#fbbf24',
        fontWeight: '500',
    },
});
