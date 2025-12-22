// app/shop-owner/products/add.tsx
import { router } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { GlassCard } from '../../../src/components/ui/GlassCard';
import { GlassHeader } from '../../../src/components/ui/GlassHeader';
import { SafeView } from '../../../src/components/ui/SafeView';
import { api } from '../../../src/lib/api';
import { colors } from '../../../src/theme/colors';
import { gradients } from '../../../src/theme/gradients';
import { borderRadius, spacing } from '../../../src/theme/spacing';

const UNITS = ['kg', 'gram', 'liter', 'ml', 'piece', 'packet', 'box', 'dozen'];

export default function AddProduct() {
    const [loading, setLoading] = useState(false);

    // Form State
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [shopPrice, setShopPrice] = useState('');
    const [mrp, setMrp] = useState('');
    const [stock, setStock] = useState('');
    const [unit, setUnit] = useState('piece');

    // Commission Preview
    const commissionRate = parseFloat(shopPrice || '0') <= 500 ? 0.05 : 0.02;
    const estimatedCustomerPrice = parseFloat(shopPrice || '0') * (1 + commissionRate);

    const handleSubmit = async () => {
        if (!name || !shopPrice || !stock) {
            Alert.alert('Missing Fields', 'Please fill in Name, Price, and Stock.');
            return;
        }

        setLoading(true);
        try {
            await api.post('/api/shop-owner/products', {
                name,
                description,
                shopPrice: parseFloat(shopPrice),
                mrp: mrp ? parseFloat(mrp) : null,
                stock: parseInt(stock),
                unit,
                categoryId: null, // Optional for now
            });

            Alert.alert('Success', 'Product added successfully!', [
                { text: 'OK', onPress: () => router.back() }
            ]);
        } catch (error: any) {
            console.error('Add product error:', error);
            Alert.alert('Error', error.response?.data?.error || 'Failed to add product');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeView gradient={gradients.backgroundDark as any}>
            <GlassHeader title="Add New Product" />

            <ScrollView contentContainerStyle={styles.content}>
                <Animated.View entering={FadeInDown.delay(100).springify()}>

                    {/* Basic Info */}
                    <Text style={styles.sectionTitle}>Basic Details</Text>
                    <GlassCard style={styles.card}>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Product Name *</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="e.g. Tata Salt 1kg"
                                placeholderTextColor={colors.textMuted}
                                value={name}
                                onChangeText={setName}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Description</Text>
                            <TextInput
                                style={[styles.input, styles.textArea]}
                                placeholder="Describe the product..."
                                placeholderTextColor={colors.textMuted}
                                value={description}
                                onChangeText={setDescription}
                                multiline
                            />
                        </View>
                    </GlassCard>

                    {/* Pricing */}
                    <Text style={styles.sectionTitle}>Pricing & Commission</Text>
                    <GlassCard style={styles.card}>
                        <View style={styles.row}>
                            <View style={[styles.inputGroup, { flex: 1 }]}>
                                <Text style={styles.label}>Your Price (₹) *</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="0.00"
                                    placeholderTextColor={colors.textMuted}
                                    value={shopPrice}
                                    onChangeText={setShopPrice}
                                    keyboardType="numeric"
                                />
                            </View>

                            <View style={[styles.inputGroup, { flex: 1 }]}>
                                <Text style={styles.label}>MRP (Optional)</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="0.00"
                                    placeholderTextColor={colors.textMuted}
                                    value={mrp}
                                    onChangeText={setMrp}
                                    keyboardType="numeric"
                                />
                            </View>
                        </View>

                        {/* Commission Preview */}
                        <View style={styles.previewContainer}>
                            <View style={styles.previewRow}>
                                <Text style={styles.previewLabel}>Platform Commission ({commissionRate * 100}%):</Text>
                                <Text style={styles.previewValue}>+ ₹{(parseFloat(shopPrice || '0') * commissionRate).toFixed(2)}</Text>
                            </View>
                            <View style={[styles.previewRow, styles.totalRow]}>
                                <Text style={styles.totalLabel}>Customer Pays:</Text>
                                <Text style={styles.totalValue}>₹{estimatedCustomerPrice.toFixed(2)}</Text>
                            </View>
                        </View>
                    </GlassCard>

                    {/* Inventory */}
                    <Text style={styles.sectionTitle}>Inventory</Text>
                    <GlassCard style={styles.card}>
                        <View style={styles.row}>
                            <View style={[styles.inputGroup, { flex: 1 }]}>
                                <Text style={styles.label}>Stock Quantity *</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="0"
                                    placeholderTextColor={colors.textMuted}
                                    value={stock}
                                    onChangeText={setStock}
                                    keyboardType="numeric"
                                />
                            </View>

                            <View style={[styles.inputGroup, { flex: 1 }]}>
                                <Text style={styles.label}>Unit *</Text>
                                <View style={styles.unitSelector}>
                                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                        {UNITS.map((u) => (
                                            <TouchableOpacity
                                                key={u}
                                                style={[styles.unitChip, unit === u && styles.unitChipActive]}
                                                onPress={() => setUnit(u)}
                                            >
                                                <Text style={[styles.unitText, unit === u && styles.unitTextActive]}>{u}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </ScrollView>
                                </View>
                            </View>
                        </View>
                    </GlassCard>

                    {/* Submit Button */}
                    <TouchableOpacity
                        style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                        onPress={handleSubmit}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#FFF" />
                        ) : (
                            <Text style={styles.submitText}>Add Product</Text>
                        )}
                    </TouchableOpacity>

                </Animated.View>
            </ScrollView>
        </SafeView>
    );
}

const styles = StyleSheet.create({
    content: {
        padding: spacing.md,
        paddingBottom: spacing.xxl,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: colors.textMuted,
        marginTop: spacing.md,
        marginBottom: spacing.sm,
        marginLeft: spacing.xs,
    },
    card: {
        padding: spacing.md,
        borderRadius: borderRadius.lg,
    },
    inputGroup: {
        marginBottom: spacing.md,
        gap: spacing.xs,
    },
    row: {
        flexDirection: 'row',
        gap: spacing.md,
    },
    label: {
        fontSize: 14,
        color: colors.textMuted,
        fontWeight: '500',
    },
    input: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: borderRadius.md,
        padding: spacing.sm,
        color: colors.text,
        fontSize: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    textArea: {
        height: 100,
        textAlignVertical: 'top',
    },
    previewContainer: {
        marginTop: spacing.xs,
        padding: spacing.sm,
        backgroundColor: 'rgba(0,0,0,0.2)',
        borderRadius: borderRadius.md,
    },
    previewRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    previewLabel: {
        color: colors.textMuted,
        fontSize: 12,
    },
    previewValue: {
        color: colors.text,
        fontSize: 12,
    },
    totalRow: {
        marginTop: 4,
        paddingTop: 4,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.1)',
    },
    totalLabel: {
        color: colors.text,
        fontWeight: 'bold',
    },
    totalValue: {
        color: colors.primary,
        fontWeight: 'bold',
        fontSize: 16,
    },
    unitSelector: {
        height: 50,
        justifyContent: 'center',
    },
    unitChip: {
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
        borderRadius: borderRadius.full,
        backgroundColor: 'rgba(255,255,255,0.05)',
        marginRight: spacing.sm,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    unitChipActive: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    unitText: {
        color: colors.textMuted,
        fontSize: 12,
    },
    unitTextActive: {
        color: '#FFF',
        fontWeight: 'bold',
    },
    submitButton: {
        backgroundColor: colors.primary,
        padding: spacing.lg,
        borderRadius: borderRadius.lg,
        alignItems: 'center',
        marginTop: spacing.xl,
    },
    submitButtonDisabled: {
        opacity: 0.7,
    },
    submitText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
