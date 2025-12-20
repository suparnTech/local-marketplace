// app/address-form.tsx - Add/Edit Address Form
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Alert,
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
import { useDispatch } from 'react-redux';
import { GlassCard } from '../src/components/ui/GlassCard';
import { SafeView } from '../src/components/ui/SafeView';
import { api } from '../src/lib/api';
import { colors } from '../src/theme/colors';
import { gradients } from '../src/theme/gradients';
import { borderRadius, spacing } from '../src/theme/spacing';

export default function AddressFormScreen() {
    const { id } = useLocalSearchParams();
    const isEdit = !!id;
    const dispatch = useDispatch();

    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        address_line1: '',
        address_line2: '',
        city: '',
        state: '',
        pincode: '',
        is_default: false,
    });
    const [loading, setLoading] = useState(false);
    const [fetchingAddress, setFetchingAddress] = useState(false);

    useEffect(() => {
        if (isEdit) {
            fetchAddress();
        }
    }, [id]);

    const fetchAddress = async () => {
        try {
            setFetchingAddress(true);
            const response = await api.get('/api/addresses');
            const address = response.data.find((addr: any) => addr.id === id);
            if (address) {
                setFormData({
                    name: address.name,
                    phone: address.phone,
                    address_line1: address.address_line1,
                    address_line2: address.address_line2 || '',
                    city: address.city,
                    state: address.state,
                    pincode: address.pincode,
                    is_default: address.is_default,
                });
            }
        } catch (error) {
            console.error('Failed to fetch address:', error);
        } finally {
            setFetchingAddress(false);
        }
    };

    const handleSubmit = async () => {
        // Validation
        if (!formData.name.trim()) {
            Alert.alert('Error', 'Please enter name');
            return;
        }
        if (!formData.phone.trim() || formData.phone.length < 10) {
            Alert.alert('Error', 'Please enter valid phone number');
            return;
        }
        if (!formData.address_line1.trim()) {
            Alert.alert('Error', 'Please enter address');
            return;
        }
        if (!formData.city.trim()) {
            Alert.alert('Error', 'Please enter city');
            return;
        }
        if (!formData.state.trim()) {
            Alert.alert('Error', 'Please enter state');
            return;
        }
        if (!formData.pincode.trim() || formData.pincode.length !== 6) {
            Alert.alert('Error', 'Please enter valid 6-digit pincode');
            return;
        }

        try {
            setLoading(true);
            if (isEdit) {
                await api.put(`/api/addresses/${id}`, formData);
                Alert.alert('Success', 'Address updated successfully');
            } else {
                await api.post('/api/addresses', formData);
                Alert.alert('Success', 'Address added successfully');
            }
            router.back();
        } catch (error) {
            console.error('Failed to save address:', error);
            Alert.alert('Error', 'Failed to save address. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeView gradient={gradients.background}>
            <KeyboardAvoidingView
                style={styles.container}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()}>
                        <Ionicons name="arrow-back" size={24} color={colors.text} />
                    </TouchableOpacity>
                    <Text style={styles.title}>{isEdit ? 'Edit Address' : 'Add New Address'}</Text>
                    <View style={{ width: 24 }} />
                </View>

                <ScrollView
                    style={styles.content}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.scrollContent}
                >
                    <Animated.View entering={FadeInDown.delay(100).springify()}>
                        <GlassCard style={styles.formCard}>
                            {/* Name */}
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Full Name *</Text>
                                <TextInput
                                    style={styles.input}
                                    value={formData.name}
                                    onChangeText={(text) => setFormData({ ...formData, name: text })}
                                    placeholder="Enter your name"
                                    placeholderTextColor={colors.textMuted}
                                />
                            </View>

                            {/* Phone */}
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Phone Number *</Text>
                                <TextInput
                                    style={styles.input}
                                    value={formData.phone}
                                    onChangeText={(text) => setFormData({ ...formData, phone: text })}
                                    placeholder="10-digit mobile number"
                                    placeholderTextColor={colors.textMuted}
                                    keyboardType="phone-pad"
                                    maxLength={10}
                                />
                            </View>

                            {/* Address Line 1 */}
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Address Line 1 *</Text>
                                <TextInput
                                    style={[styles.input, styles.textArea]}
                                    value={formData.address_line1}
                                    onChangeText={(text) => setFormData({ ...formData, address_line1: text })}
                                    placeholder="House No., Building Name"
                                    placeholderTextColor={colors.textMuted}
                                    multiline
                                    numberOfLines={2}
                                />
                            </View>

                            {/* Address Line 2 */}
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Address Line 2</Text>
                                <TextInput
                                    style={[styles.input, styles.textArea]}
                                    value={formData.address_line2}
                                    onChangeText={(text) => setFormData({ ...formData, address_line2: text })}
                                    placeholder="Road Name, Area, Colony (Optional)"
                                    placeholderTextColor={colors.textMuted}
                                    multiline
                                    numberOfLines={2}
                                />
                            </View>

                            {/* City & State */}
                            <View style={styles.row}>
                                <View style={[styles.inputGroup, styles.halfWidth]}>
                                    <Text style={styles.label}>City *</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={formData.city}
                                        onChangeText={(text) => setFormData({ ...formData, city: text })}
                                        placeholder="City"
                                        placeholderTextColor={colors.textMuted}
                                    />
                                </View>

                                <View style={[styles.inputGroup, styles.halfWidth]}>
                                    <Text style={styles.label}>State *</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={formData.state}
                                        onChangeText={(text) => setFormData({ ...formData, state: text })}
                                        placeholder="State"
                                        placeholderTextColor={colors.textMuted}
                                    />
                                </View>
                            </View>

                            {/* Pincode */}
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Pincode *</Text>
                                <TextInput
                                    style={styles.input}
                                    value={formData.pincode}
                                    onChangeText={(text) => setFormData({ ...formData, pincode: text })}
                                    placeholder="6-digit pincode"
                                    placeholderTextColor={colors.textMuted}
                                    keyboardType="number-pad"
                                    maxLength={6}
                                />
                            </View>

                            {/* Set as Default */}
                            <TouchableOpacity
                                style={styles.checkboxRow}
                                onPress={() => setFormData({ ...formData, is_default: !formData.is_default })}
                            >
                                <View style={[styles.checkbox, formData.is_default && styles.checkboxChecked]}>
                                    {formData.is_default && (
                                        <Ionicons name="checkmark" size={16} color={colors.text} />
                                    )}
                                </View>
                                <Text style={styles.checkboxLabel}>Set as default address</Text>
                            </TouchableOpacity>
                        </GlassCard>
                    </Animated.View>

                    <View style={{ height: 120 }} />
                </ScrollView>

                {/* Save Button */}
                <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.footer}>
                    <TouchableOpacity
                        style={styles.saveButton}
                        onPress={handleSubmit}
                        disabled={loading}
                    >
                        <LinearGradient colors={gradients.primary as any} style={styles.saveButtonGradient}>
                            <Text style={styles.saveButtonText}>
                                {loading ? 'Saving...' : isEdit ? 'Update Address' : 'Save Address'}
                            </Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </Animated.View>
            </KeyboardAvoidingView>
        </SafeView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: spacing.lg,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: colors.text,
    },
    content: {
        flex: 1,
    },
    scrollContent: {
        padding: spacing.lg,
        paddingTop: 0,
    },
    formCard: {
        padding: spacing.lg,
    },
    inputGroup: {
        marginBottom: spacing.md,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.text,
        marginBottom: spacing.xs,
    },
    input: {
        backgroundColor: colors.surface,
        borderRadius: borderRadius.md,
        padding: spacing.md,
        fontSize: 16,
        color: colors.text,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    textArea: {
        minHeight: 60,
        textAlignVertical: 'top',
    },
    row: {
        flexDirection: 'row',
        gap: spacing.md,
    },
    halfWidth: {
        flex: 1,
    },
    checkboxRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: spacing.sm,
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: colors.textMuted,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.sm,
    },
    checkboxChecked: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    checkboxLabel: {
        fontSize: 14,
        color: colors.text,
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: spacing.lg,
    },
    saveButton: {
        borderRadius: borderRadius.lg,
        overflow: 'hidden',
    },
    saveButtonGradient: {
        paddingVertical: spacing.md,
        alignItems: 'center',
    },
    saveButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: colors.text,
    },
});
