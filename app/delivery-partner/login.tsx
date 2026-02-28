// Delivery Partner Login Screen - Email + Password
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { GlassCard } from '../../src/components/ui/GlassCard';
import { GlassHeader } from '../../src/components/ui/GlassHeader';
import { ImmersiveBackground } from '../../src/components/ui/ImmersiveBackground';
import { SafeView } from '../../src/components/ui/SafeView';
import { api } from '../../src/lib/api';
import { colors } from '../../src/theme/colors';
import { gradients } from '../../src/theme/gradients';
import { borderRadius, spacing } from '../../src/theme/spacing';

export default function DeliveryPartnerLogin() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('Missing Fields', 'Please enter email and password');
            return;
        }

        setLoading(true);
        try {
            const response = await api.post('/api/delivery-partner/login', {
                email,
                password,
            });

            const { token, user, verification_status } = response.data;

            // Save auth data
            await AsyncStorage.setItem('token', token);
            await AsyncStorage.setItem('user', JSON.stringify(user));

            // Route based on verification status
            if (verification_status === 'pending') {
                router.replace('/delivery-partner/pending-verification');
            } else if (verification_status === 'approved') {
                router.replace('/delivery-partner/(tabs)');
            } else {
                Alert.alert('Account Rejected', 'Your application was rejected. Please contact support.');
            }
        } catch (error: any) {
            Alert.alert('Login Failed', error.response?.data?.error || 'Invalid email or password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeView gradient={gradients.backgroundDark as any}>
            <ImmersiveBackground />
            <GlassHeader title="Delivery Partner Login" />

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={styles.container}
            >
                <ScrollView
                    contentContainerStyle={styles.content}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    <GlassCard style={styles.card}>
                        {/* Icon */}
                        <View style={styles.iconContainer}>
                            <View style={styles.iconCircle}>
                                <Ionicons name="bicycle" size={48} color={colors.primary} />
                            </View>
                        </View>

                        <Text style={styles.title}>Welcome Back!</Text>
                        <Text style={styles.subtitle}>
                            Login to start accepting deliveries
                        </Text>

                        {/* Email Input */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Email</Text>
                            <TextInput
                                style={styles.input}
                                value={email}
                                onChangeText={setEmail}
                                placeholder="your@email.com"
                                placeholderTextColor={colors.textMuted}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                autoComplete="email"
                            />
                        </View>

                        {/* Password Input */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Password</Text>
                            <TextInput
                                style={styles.input}
                                value={password}
                                onChangeText={setPassword}
                                placeholder="Enter password"
                                placeholderTextColor={colors.textMuted}
                                secureTextEntry
                            />
                        </View>

                        {/* Login Button */}
                        <TouchableOpacity
                            style={styles.button}
                            onPress={handleLogin}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.buttonText}>Login</Text>
                            )}
                        </TouchableOpacity>

                        {/* Register Link */}
                        <View style={styles.footer}>
                            <Text style={styles.footerText}>Don't have an account? </Text>
                            <TouchableOpacity onPress={() => router.push('/delivery-partner/register')}>
                                <Text style={styles.footerLink}>Register Now</Text>
                            </TouchableOpacity>
                        </View>
                    </GlassCard>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        padding: spacing.lg,
        paddingBottom: 100,
    },
    card: {
        padding: spacing.xl,
    },
    iconContainer: {
        alignItems: 'center',
        marginBottom: spacing.xl,
    },
    iconCircle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: `${colors.primary}20`,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: `${colors.primary}40`,
    },
    title: {
        fontSize: 28,
        fontWeight: '700',
        color: colors.text,
        textAlign: 'center',
        marginBottom: spacing.sm,
    },
    subtitle: {
        fontSize: 16,
        color: colors.textMuted,
        textAlign: 'center',
        marginBottom: spacing.xl,
    },
    inputGroup: {
        marginBottom: spacing.lg,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.text,
        marginBottom: spacing.sm,
    },
    input: {
        backgroundColor: colors.glassLight,
        borderRadius: borderRadius.lg,
        padding: spacing.lg,
        fontSize: 18,
        color: colors.text,
        borderWidth: 1,
        borderColor: colors.glassBorder,
    },
    button: {
        backgroundColor: colors.primary,
        borderRadius: borderRadius.lg,
        padding: spacing.lg,
        alignItems: 'center',
        marginTop: spacing.md,
    },
    buttonText: {
        fontSize: 18,
        fontWeight: '700',
        color: '#fff',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: spacing.xl,
    },
    footerText: {
        fontSize: 14,
        color: colors.textMuted,
    },
    footerLink: {
        fontSize: 14,
        color: colors.primary,
        fontWeight: '600',
    },
});
