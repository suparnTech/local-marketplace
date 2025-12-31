// Delivery Partner Login Screen
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
    const [phone, setPhone] = useState('');
    const [otp, setOtp] = useState('');
    const [otpSent, setOtpSent] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSendOTP = async () => {
        if (phone.length !== 10) {
            Alert.alert('Invalid Phone', 'Please enter a valid 10-digit phone number');
            return;
        }

        setLoading(true);
        try {
            await api.post('/api/auth/send-otp', { phone });
            setOtpSent(true);
            Alert.alert('OTP Sent', 'Please check your phone for the OTP');
        } catch (error: any) {
            Alert.alert('Error', error.response?.data?.error || 'Failed to send OTP');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOTP = async () => {
        if (otp.length !== 6) {
            Alert.alert('Invalid OTP', 'Please enter the 6-digit OTP');
            return;
        }

        setLoading(true);
        try {
            const response = await api.post('/api/auth/verify-otp', { phone, otp });
            const { token, user } = response.data;

            // Check if user is delivery partner
            if (user.role !== 'delivery_partner') {
                Alert.alert('Access Denied', 'This phone number is not registered as a delivery partner');
                return;
            }

            // Save auth data
            await AsyncStorage.setItem('token', token);
            await AsyncStorage.setItem('user', JSON.stringify(user));

            // Check verification status
            const profileResponse = await api.get('/api/delivery-partner/profile', {
                headers: { Authorization: `Bearer ${token}` }
            });
            const partner = profileResponse.data;

            if (partner.verification_status === 'pending') {
                router.replace('/delivery-partner/pending-verification');
            } else if (partner.verification_status === 'approved') {
                router.replace('/delivery-partner/(tabs)');
            } else {
                Alert.alert('Account Rejected', 'Your delivery partner application was rejected. Please contact support.');
            }
        } catch (error: any) {
            Alert.alert('Error', error.response?.data?.error || 'Login failed');
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

                        {/* Phone Input */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Phone Number</Text>
                            <TextInput
                                style={styles.input}
                                value={phone}
                                onChangeText={setPhone}
                                placeholder="10-digit mobile number"
                                placeholderTextColor={colors.textMuted}
                                keyboardType="phone-pad"
                                maxLength={10}
                                editable={!otpSent}
                            />
                        </View>

                        {/* OTP Input */}
                        {otpSent && (
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Enter OTP</Text>
                                <TextInput
                                    style={styles.input}
                                    value={otp}
                                    onChangeText={setOtp}
                                    placeholder="6-digit OTP"
                                    placeholderTextColor={colors.textMuted}
                                    keyboardType="number-pad"
                                    maxLength={6}
                                    autoFocus
                                />
                            </View>
                        )}

                        {/* Action Button */}
                        <TouchableOpacity
                            style={styles.button}
                            onPress={otpSent ? handleVerifyOTP : handleSendOTP}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.buttonText}>
                                    {otpSent ? 'Verify OTP & Login' : 'Send OTP'}
                                </Text>
                            )}
                        </TouchableOpacity>

                        {/* Resend OTP */}
                        {otpSent && (
                            <TouchableOpacity
                                style={styles.resendButton}
                                onPress={() => {
                                    setOtpSent(false);
                                    setOtp('');
                                }}
                            >
                                <Text style={styles.resendText}>Change Phone Number</Text>
                            </TouchableOpacity>
                        )}

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
    resendButton: {
        padding: spacing.md,
        alignItems: 'center',
        marginTop: spacing.sm,
    },
    resendText: {
        fontSize: 14,
        color: colors.primary,
        fontWeight: '600',
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
