// app/auth/register.tsx - Premium Customer Register Screen
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
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
import { useAuth } from '../../src/contexts/AuthContext';
import { colors } from '../../src/theme/colors';
import { gradients } from '../../src/theme/gradients';

export default function RegisterScreen() {
    const { register } = useAuth();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        phone: '',
    });
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleRegister = async () => {
        const { name, email, password, confirmPassword, phone } = formData;

        if (!name || !email || !password || !confirmPassword) {
            Alert.alert('Error', 'Please fill in required fields');
            return;
        }

        if (password !== confirmPassword) {
            Alert.alert('Error', 'Passwords do not match');
            return;
        }

        setLoading(true);
        try {
            await register(email, password, name, 'CUSTOMER', phone);
            Alert.alert('Success', 'Account created! Verified automatically for demo.', [
                { text: 'Login Now', onPress: () => router.replace('/auth/login') }
            ]);
        } catch (error: any) {
            Alert.alert('Registration Failed', error.message || 'Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    const updateFormData = (key: string, value: string) => {
        setFormData(prev => ({ ...prev, [key]: value }));
    };

    return (
        <SafeView gradient={gradients.background as any}>
            <ImmersiveBackground />
            <GlassHeader title="Create Account" showBackButton />

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
                                colors={['rgba(16, 185, 129, 0.3)', 'rgba(16, 185, 129, 0.1)']}
                                style={styles.iconContainer}
                            >
                                <Ionicons name="person-add" size={48} color={colors.primary} />
                            </LinearGradient>
                            <Text style={styles.title}>Join Local Market</Text>
                            <Text style={styles.subtitle}>
                                Create your account to start shopping
                            </Text>
                        </Animated.View>

                        {/* Form */}
                        <Animated.View
                            entering={FadeInUp.delay(200).springify()}
                            style={styles.formContainer}
                        >
                            <GlassCard style={styles.card}>
                                {/* Name */}
                                <View style={styles.inputGroup}>
                                    <Text style={styles.label}>Full Name</Text>
                                    <View style={styles.inputContainer}>
                                        <Ionicons name="person-outline" size={20} color={colors.textMuted} />
                                        <TextInput
                                            style={styles.input}
                                            placeholder="Enter your full name"
                                            placeholderTextColor={colors.textMuted}
                                            value={formData.name}
                                            onChangeText={(val) => updateFormData('name', val)}
                                        />
                                    </View>
                                </View>

                                {/* Email */}
                                <View style={styles.inputGroup}>
                                    <Text style={styles.label}>Email Address</Text>
                                    <View style={styles.inputContainer}>
                                        <Ionicons name="mail-outline" size={20} color={colors.textMuted} />
                                        <TextInput
                                            style={styles.input}
                                            placeholder="Enter your email"
                                            placeholderTextColor={colors.textMuted}
                                            value={formData.email}
                                            onChangeText={(val) => updateFormData('email', val)}
                                            keyboardType="email-address"
                                            autoCapitalize="none"
                                        />
                                    </View>
                                </View>

                                {/* Phone (Optional) */}
                                <View style={styles.inputGroup}>
                                    <Text style={styles.label}>Phone Number (Optional)</Text>
                                    <View style={styles.inputContainer}>
                                        <Ionicons name="call-outline" size={20} color={colors.textMuted} />
                                        <TextInput
                                            style={styles.input}
                                            placeholder="Enter your phone number"
                                            placeholderTextColor={colors.textMuted}
                                            value={formData.phone}
                                            onChangeText={(val) => updateFormData('phone', val)}
                                            keyboardType="phone-pad"
                                        />
                                    </View>
                                </View>

                                {/* Password */}
                                <View style={styles.inputGroup}>
                                    <Text style={styles.label}>Password</Text>
                                    <View style={styles.inputContainer}>
                                        <Ionicons name="lock-closed-outline" size={20} color={colors.textMuted} />
                                        <TextInput
                                            style={styles.input}
                                            placeholder="Create a password"
                                            placeholderTextColor={colors.textMuted}
                                            value={formData.password}
                                            onChangeText={(val) => updateFormData('password', val)}
                                            secureTextEntry={!showPassword}
                                        />
                                        <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                                            <Ionicons
                                                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                                                size={20}
                                                color={colors.textMuted}
                                            />
                                        </TouchableOpacity>
                                    </View>
                                </View>

                                {/* Confirm Password */}
                                <View style={styles.inputGroup}>
                                    <Text style={styles.label}>Confirm Password</Text>
                                    <View style={styles.inputContainer}>
                                        <Ionicons name="lock-closed-outline" size={20} color={colors.textMuted} />
                                        <TextInput
                                            style={styles.input}
                                            placeholder="Confirm your password"
                                            placeholderTextColor={colors.textMuted}
                                            value={formData.confirmPassword}
                                            onChangeText={(val) => updateFormData('confirmPassword', val)}
                                            secureTextEntry={!showPassword}
                                        />
                                    </View>
                                </View>

                                {/* Register Button */}
                                <TouchableOpacity
                                    style={[styles.button, loading && styles.buttonDisabled]}
                                    onPress={handleRegister}
                                    disabled={loading}
                                    activeOpacity={0.8}
                                >
                                    <LinearGradient
                                        colors={['#10b981', '#059669']}
                                        style={styles.buttonGradient}
                                    >
                                        <Text style={styles.buttonText}>
                                            {loading ? 'Creating Account...' : 'Create Account'}
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

                                {/* Login Link */}
                                <TouchableOpacity
                                    style={styles.loginButton}
                                    onPress={() => router.push('/auth/login')}
                                    activeOpacity={0.8}
                                >
                                    <Text style={styles.loginText}>
                                        Already have an account?{' '}
                                        <Text style={styles.loginLink}>Sign In</Text>
                                    </Text>
                                </TouchableOpacity>
                            </GlassCard>
                        </Animated.View>

                        {/* Footer */}
                        <Animated.View
                            entering={FadeInUp.delay(400).springify()}
                            style={styles.footer}
                        >
                            <Text style={styles.footerText}>
                                By creating an account, you agree to our{'\n'}
                                <Text style={styles.footerLink}>Terms & Conditions</Text> and{' '}
                                <Text style={styles.footerLink}>Privacy Policy</Text>
                            </Text>
                        </Animated.View>
                    </ScrollView>
                </TouchableWithoutFeedback>
            </KeyboardAvoidingView>
        </SafeView>
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
        marginTop: 8,
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
    loginButton: {
        alignItems: 'center',
    },
    loginText: {
        fontSize: 14,
        color: colors.textMuted,
    },
    loginLink: {
        color: colors.primary,
        fontWeight: '600',
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
        color: colors.primary,
        fontWeight: '500',
    },
});
