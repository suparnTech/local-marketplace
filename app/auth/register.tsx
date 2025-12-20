// app/auth/register.tsx - Premium Register Screen
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { GlassCard } from '../../src/components/ui/GlassCard';
import { GradientButton } from '../../src/components/ui/GradientButton';
import { SafeView } from '../../src/components/ui/SafeView';
import { useAuth } from '../../src/contexts/AuthContext';
import { colors } from '../../src/theme/colors';
import { gradients } from '../../src/theme/gradients';
import { borderRadius, spacing } from '../../src/theme/spacing';

export default function RegisterScreen() {
    const { register } = useAuth();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        phone: '',
    });
    const [role, setRole] = useState<'CUSTOMER' | 'STORE_OWNER'>('CUSTOMER');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    // Mock data for role selection
    const roles = [
        { id: 'CUSTOMER', title: 'Customer', icon: 'person-outline', desc: 'I want to buy products' },
        { id: 'STORE_OWNER', title: 'Store Owner', icon: 'storefront-outline', desc: 'I want to sell products' },
    ];

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
            await register(email, password, name, role, phone);
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
        <SafeView gradient={gradients.backgroundTeal}>
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <View style={styles.container}>
                    {/* Header */}
                    <Animated.View
                        entering={FadeInDown.duration(600).springify()}
                        style={styles.header}
                    >
                        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                            <Ionicons name="arrow-back" size={24} color={colors.text} />
                        </TouchableOpacity>
                        <View>
                            <Text style={styles.title}>Create Account</Text>
                            <Text style={styles.subtitle}>Join our marketplace today</Text>
                        </View>
                    </Animated.View>

                    <Animated.View entering={FadeInUp.duration(600).delay(200).springify()}>

                        {/* Role Selection */}
                        <Text style={styles.sectionTitle}>I am a...</Text>
                        <View style={styles.roleContainer}>
                            {roles.map((item) => (
                                <TouchableOpacity
                                    key={item.id}
                                    style={styles.roleWrapper}
                                    onPress={() => setRole(item.id as any)}
                                >
                                    <GlassCard
                                        intensity={role === item.id ? 40 : 10}
                                        style={[
                                            styles.roleCard,
                                            role === item.id && styles.roleCardActive
                                        ]}
                                    >
                                        <LinearGradient
                                            colors={role === item.id ? gradients.primary : ['transparent', 'transparent']}
                                            style={styles.roleIcon}
                                        >
                                            <Ionicons
                                                name={item.icon as any}
                                                size={24}
                                                color={role === item.id ? colors.text : colors.primary}
                                            />
                                        </LinearGradient>
                                        <Text style={styles.roleTitle}>{item.title}</Text>
                                    </GlassCard>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* Form */}
                        <GlassCard style={styles.formCard}>
                            {/* Name */}
                            <View style={styles.inputContainer}>
                                <Ionicons name="person-outline" size={20} color={colors.textMuted} style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Full Name"
                                    placeholderTextColor={colors.textMuted}
                                    value={formData.name}
                                    onChangeText={(val) => updateFormData('name', val)}
                                />
                            </View>

                            {/* Email */}
                            <View style={styles.inputContainer}>
                                <Ionicons name="mail-outline" size={20} color={colors.textMuted} style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Email Address"
                                    placeholderTextColor={colors.textMuted}
                                    value={formData.email}
                                    onChangeText={(val) => updateFormData('email', val)}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                />
                            </View>

                            {/* Phone (Optional) */}
                            <View style={styles.inputContainer}>
                                <Ionicons name="call-outline" size={20} color={colors.textMuted} style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Phone (Optional)"
                                    placeholderTextColor={colors.textMuted}
                                    value={formData.phone}
                                    onChangeText={(val) => updateFormData('phone', val)}
                                    keyboardType="phone-pad"
                                />
                            </View>

                            {/* Password */}
                            <View style={styles.inputContainer}>
                                <Ionicons name="lock-closed-outline" size={20} color={colors.textMuted} style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Password"
                                    placeholderTextColor={colors.textMuted}
                                    value={formData.password}
                                    onChangeText={(val) => updateFormData('password', val)}
                                    secureTextEntry={!showPassword}
                                />
                                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                                    <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.textMuted} />
                                </TouchableOpacity>
                            </View>

                            {/* Confirm Password */}
                            <View style={styles.inputContainer}>
                                <Ionicons name="lock-closed-outline" size={20} color={colors.textMuted} style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Confirm Password"
                                    placeholderTextColor={colors.textMuted}
                                    value={formData.confirmPassword}
                                    onChangeText={(val) => updateFormData('confirmPassword', val)}
                                    secureTextEntry={!showPassword}
                                />
                            </View>

                            <GradientButton
                                title={role === 'STORE_OWNER' ? 'Apply as Vendor' : 'Create Account'}
                                onPress={handleRegister}
                                loading={loading}
                                style={styles.submitButton}
                            />
                        </GlassCard>

                        <View style={styles.footer}>
                            <Text style={styles.footerText}>Already have an account? </Text>
                            <TouchableOpacity onPress={() => router.push('/auth/login')}>
                                <Text style={styles.linkText}>Sign In</Text>
                            </TouchableOpacity>
                        </View>

                    </Animated.View>
                </View>
            </ScrollView>
        </SafeView>
    );
}

const styles = StyleSheet.create({
    scrollContent: {
        paddingBottom: spacing.xl,
    },
    container: {
        padding: spacing.lg,
    },
    header: {
        marginBottom: spacing.lg,
        alignItems: 'flex-start',
    },
    backButton: {
        marginBottom: spacing.md,
        padding: spacing.xs,
        marginLeft: -spacing.xs,
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
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.text,
        marginBottom: spacing.md,
        marginLeft: spacing.xs,
    },
    roleContainer: {
        flexDirection: 'row',
        gap: spacing.md,
        marginBottom: spacing.xl,
    },
    roleWrapper: {
        flex: 1,
    },
    roleCard: {
        padding: spacing.md,
        alignItems: 'center',
        justifyContent: 'center',
        height: 100,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    roleCardActive: {
        borderColor: colors.primary,
        borderWidth: 2,
    },
    roleIcon: {
        width: 40,
        height: 40,
        borderRadius: borderRadius.full,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.sm,
    },
    roleTitle: {
        color: colors.text,
        fontSize: 14,
        fontWeight: '600',
    },
    formCard: {
        gap: spacing.md,
        padding: spacing.lg,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.2)',
        borderRadius: borderRadius.md,
        borderWidth: 1,
        borderColor: colors.border,
        paddingHorizontal: spacing.md,
        height: 50,
    },
    inputIcon: {
        marginRight: spacing.sm,
    },
    input: {
        flex: 1,
        color: colors.text,
        fontSize: 16,
        height: '100%',
    },
    submitButton: {
        marginTop: spacing.sm,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: spacing.xl,
    },
    footerText: {
        color: colors.textMuted,
        fontSize: 14,
    },
    linkText: {
        color: colors.primary,
        fontWeight: 'bold',
        fontSize: 14,
    },
});
