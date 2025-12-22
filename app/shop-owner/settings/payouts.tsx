import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { GlassCard } from '../../../src/components/ui/GlassCard';
import { GlassHeader } from '../../../src/components/ui/GlassHeader';
import { ImmersiveBackground } from '../../../src/components/ui/ImmersiveBackground';
import { SafeView } from '../../../src/components/ui/SafeView';
import { api } from '../../../src/lib/api';
import { colors } from '../../../src/theme/colors';
import { spacing } from '../../../src/theme/spacing';

const { width } = Dimensions.get('window');

export default function PayoutSettingsScreen() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({
        accountHolderName: '',
        bankAccountNumber: '',
        ifscCode: '',
        upiId: '',
        payoutFrequency: 'weekly'
    });

    useEffect(() => {
        fetchPayoutSettings();
    }, []);

    const fetchPayoutSettings = async () => {
        try {
            const response = await api.get('/api/shop-owner/profile');
            const shop = response.data;
            setForm({
                accountHolderName: shop.account_holder_name || '',
                bankAccountNumber: shop.bank_account_number || '',
                ifscCode: shop.ifsc_code || '',
                upiId: shop.upi_id || '',
                payoutFrequency: shop.payout_frequency || 'weekly'
            });
        } catch (error) {
            console.error('Fetch payout error:', error);
            Alert.alert('Error', 'Failed to load payout settings');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!form.accountHolderName || !form.bankAccountNumber || !form.ifscCode) {
            Alert.alert('Missing Info', 'Please fill in at least the basic bank details.');
            return;
        }

        setSaving(true);
        try {
            await api.put('/api/shop-owner/profile/payouts', form);
            Alert.alert('Success', 'Payout settings updated successfully', [
                { text: 'OK', onPress: () => router.back() }
            ]);
        } catch (error) {
            console.error('Update payout error:', error);
            Alert.alert('Error', 'Failed to update settings');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <SafeView style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
            </SafeView>
        );
    }

    return (
        <SafeView>
            <ImmersiveBackground />
            <GlassHeader title="Payout Settings" showBackButton={true} onBackPress={() => router.back()} />

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    <Animated.View entering={FadeInDown.delay(100).duration(600)}>
                        <View style={styles.infoCard}>
                            <Ionicons name="information-circle-outline" size={24} color={colors.primary} />
                            <Text style={styles.infoText}>
                                Settlements are processed automatically based on your preferred frequency.
                                Ensure your bank details are accurate to avoid delays.
                            </Text>
                        </View>
                    </Animated.View>

                    <SectionTitle title="Bank Details" icon="log-in-outline" />

                    <GlassCard style={styles.formCard}>
                        <InputLabel label="Account Holder Name" icon="person-outline" />
                        <TextInput
                            style={styles.input}
                            value={form.accountHolderName}
                            onChangeText={(val) => setForm({ ...form, accountHolderName: val })}
                            placeholder="Full Name as per Bank"
                            placeholderTextColor={colors.textMuted}
                        />

                        <InputLabel label="Bank Account Number" icon="card-outline" />
                        <TextInput
                            style={styles.input}
                            value={form.bankAccountNumber}
                            onChangeText={(val) => setForm({ ...form, bankAccountNumber: val })}
                            placeholder="Enter Account Number"
                            placeholderTextColor={colors.textMuted}
                            keyboardType="numeric"
                        />

                        <InputLabel label="IFSC Code" icon="business-outline" />
                        <TextInput
                            style={styles.input}
                            value={form.ifscCode}
                            onChangeText={(val) => setForm({ ...form, ifscCode: val.toUpperCase() })}
                            placeholder="e.g. HDFC0001234"
                            placeholderTextColor={colors.textMuted}
                            autoCapitalize="characters"
                        />
                    </GlassCard>

                    <SectionTitle title="UPI & Payout" icon="flash-outline" />

                    <GlassCard style={styles.formCard}>
                        <InputLabel label="UPI ID (Optional)" icon="at-outline" />
                        <TextInput
                            style={styles.input}
                            value={form.upiId}
                            onChangeText={(val) => setForm({ ...form, upiId: val })}
                            placeholder="e.g. business@okaxis"
                            placeholderTextColor={colors.textMuted}
                        />

                        <InputLabel label="Payout Frequency" icon="time-outline" />
                        <View style={styles.frequencyContainer}>
                            {['daily', 'weekly'].map((freq) => (
                                <TouchableOpacity
                                    key={freq}
                                    style={[
                                        styles.freqButton,
                                        form.payoutFrequency === freq && styles.freqButtonActive
                                    ]}
                                    onPress={() => setForm({ ...form, payoutFrequency: freq })}
                                >
                                    <Text style={[
                                        styles.freqText,
                                        form.payoutFrequency === freq && styles.freqTextActive
                                    ]}>
                                        {freq.charAt(0).toUpperCase() + freq.slice(1)}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </GlassCard>

                    <TouchableOpacity
                        style={styles.saveButton}
                        onPress={handleSave}
                        disabled={saving}
                    >
                        <LinearGradient
                            colors={[colors.primary, colors.primaryDark]}
                            style={styles.saveGradient}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                        >
                            {saving ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <>
                                    <Text style={styles.saveText}>Save Payout Settings</Text>
                                    <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
                                </>
                            )}
                        </LinearGradient>
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeView>
    );
}

function SectionTitle({ title, icon }: { title: string; icon: any }) {
    return (
        <View style={styles.sectionHeader}>
            <Ionicons name={icon} size={20} color={colors.primary} />
            <Text style={styles.sectionTitle}>{title}</Text>
        </View>
    );
}

function InputLabel({ label, icon }: { label: string; icon: any }) {
    return (
        <View style={styles.labelContainer}>
            <Ionicons name={icon} size={14} color={colors.textMuted} />
            <Text style={styles.label}>{label}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.background,
    },
    scrollContent: {
        padding: spacing.xl,
        paddingBottom: spacing.xxl * 2,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: spacing.xl,
        marginBottom: spacing.md,
        gap: spacing.sm,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#fff',
        letterSpacing: 0.5,
    },
    formCard: {
        padding: spacing.lg,
        gap: spacing.md,
    },
    labelContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
        marginBottom: spacing.xs,
    },
    label: {
        fontSize: 13,
        color: colors.textMuted,
        fontWeight: '600',
        letterSpacing: 0.3,
    },
    input: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 12,
        padding: spacing.md,
        color: '#fff',
        fontSize: 15,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    infoCard: {
        flexDirection: 'row',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        padding: spacing.lg,
        borderRadius: 16,
        gap: spacing.md,
        borderWidth: 1,
        borderColor: 'rgba(16, 185, 129, 0.2)',
    },
    infoText: {
        flex: 1,
        fontSize: 13,
        color: colors.textMuted,
        lineHeight: 18,
    },
    frequencyContainer: {
        flexDirection: 'row',
        gap: spacing.md,
    },
    freqButton: {
        flex: 1,
        padding: spacing.md,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.05)',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    freqButtonActive: {
        backgroundColor: 'rgba(16, 185, 129, 0.2)',
        borderColor: colors.primary,
    },
    freqText: {
        color: colors.textMuted,
        fontWeight: '600',
    },
    freqTextActive: {
        color: colors.primary,
    },
    saveButton: {
        marginTop: spacing.xxl,
        borderRadius: 16,
        overflow: 'hidden',
    },
    saveGradient: {
        padding: spacing.lg,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: spacing.sm,
    },
    saveText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
});
