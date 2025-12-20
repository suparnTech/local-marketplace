// app/auth/login.tsx - Clean Dark Navy Login Screen
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { GradientButton } from '../../src/components/ui/GradientButton';
import { SafeView } from '../../src/components/ui/SafeView';
import { useAuth } from '../../src/contexts/AuthContext';
import { colors } from '../../src/theme/colors';
import { gradients } from '../../src/theme/gradients';
import { borderRadius, spacing } from '../../src/theme/spacing';

export default function LoginScreen() {
    const { login } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        setLoading(true);
        try {
            await login(email, password);
        } catch (error: any) {
            Alert.alert('Login Failed', error.message || 'Invalid credentials');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeView scroll gradient={gradients.background}>
            <View style={styles.container}>
                {/* Logo/Header */}
                <Animated.View
                    entering={FadeInDown.duration(600).springify()}
                    style={styles.header}
                >
                    <LinearGradient
                        colors={gradients.primary}
                        style={styles.logoGradient}
                    >
                        <Ionicons name="storefront" size={40} color={colors.text} />
                    </LinearGradient>
                    <Text style={styles.title}>Welcome Back</Text>
                    <Text style={styles.subtitle}>Sign in to continue</Text>
                </Animated.View>

                {/* Login Form - Clean, no nested cards */}
                <Animated.View
                    entering={FadeInUp.duration(600).delay(200).springify()}
                    style={styles.formContainer}
                >
                    {/* Email Input */}
                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Email</Text>
                        <View style={styles.inputWrapper}>
                            <Ionicons name="mail-outline" size={20} color={colors.primary} />
                            <TextInput
                                style={styles.input}
                                placeholder="Enter your email"
                                placeholderTextColor={colors.textMuted}
                                value={email}
                                onChangeText={setEmail}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                autoComplete="email"
                            />
                        </View>
                    </View>

                    {/* Password Input */}
                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Password</Text>
                        <View style={styles.inputWrapper}>
                            <Ionicons name="lock-closed-outline" size={20} color={colors.primary} />
                            <TextInput
                                style={styles.input}
                                placeholder="Enter your password"
                                placeholderTextColor={colors.textMuted}
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry={!showPassword}
                                autoCapitalize="none"
                                autoComplete="password"
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

                    {/* Forgot Password */}
                    <TouchableOpacity style={styles.forgotPassword}>
                        <Text style={styles.forgotText}>Forgot Password?</Text>
                    </TouchableOpacity>

                    {/* Login Button */}
                    <GradientButton
                        title="Sign In"
                        onPress={handleLogin}
                        loading={loading}
                        style={styles.loginButton}
                    />

                    {/* Sign Up Link */}
                    <View style={styles.signupContainer}>
                        <Text style={styles.signupText}>Don't have an account? </Text>
                        <TouchableOpacity onPress={() => router.push('/auth/register')}>
                            <Text style={styles.signupLink}>Sign Up</Text>
                        </TouchableOpacity>
                    </View>
                </Animated.View>
            </View>
        </SafeView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: spacing.xl,
        justifyContent: 'center',
    },
    header: {
        alignItems: 'center',
        marginBottom: spacing.xxxl,
    },
    logoGradient: {
        width: 80,
        height: 80,
        borderRadius: borderRadius.xl,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.lg,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: colors.text,
        marginBottom: spacing.xs,
    },
    subtitle: {
        fontSize: 16,
        color: colors.textMuted,
    },
    formContainer: {
        gap: spacing.lg,
    },
    inputContainer: {
        gap: spacing.sm,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.text,
        marginLeft: spacing.xs,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: borderRadius.md,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        paddingHorizontal: spacing.md,
        gap: spacing.sm,
    },
    input: {
        flex: 1,
        color: colors.text,
        fontSize: 16,
        paddingVertical: spacing.md,
    },
    forgotPassword: {
        alignSelf: 'flex-end',
    },
    forgotText: {
        color: colors.primary,
        fontSize: 14,
        fontWeight: '600',
    },
    loginButton: {
        marginTop: spacing.sm,
    },
    signupContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    signupText: {
        color: colors.textMuted,
        fontSize: 14,
    },
    signupLink: {
        color: colors.primary,
        fontSize: 14,
        fontWeight: '600',
    },
});
