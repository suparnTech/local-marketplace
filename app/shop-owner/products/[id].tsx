// app/shop-owner/products/[id].tsx
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { GlassCard } from '../../../src/components/ui/GlassCard';
import { GlassHeader } from '../../../src/components/ui/GlassHeader';
import { SafeView } from '../../../src/components/ui/SafeView';
import { useShopOwnerProductDetail } from '../../../src/hooks/useShopOwner';
import { api } from '../../../src/lib/api';
import { colors } from '../../../src/theme/colors';
import { gradients } from '../../../src/theme/gradients';
import { borderRadius, spacing } from '../../../src/theme/spacing';

const UNITS = ['kg', 'gram', 'liter', 'ml', 'piece', 'packet', 'box', 'dozen'];

export default function EditProduct() {
    const { id } = useLocalSearchParams();
    const productId = typeof id === 'string' ? id : undefined;

    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);

    // Form State
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [shopPrice, setShopPrice] = useState('');
    const [mrp, setMrp] = useState('');
    const [stock, setStock] = useState('');
    const [unit, setUnit] = useState('piece');
    const [isAvailable, setIsAvailable] = useState(true);

    // Use React Query hook
    const { data: product, isLoading: loading } = useShopOwnerProductDetail(productId);

    // Populate form when product loads
    useEffect(() => {
        if (product) {
            setName(product.name);
            setDescription(product.description || '');
            setShopPrice(product.pricing.shopPrice.toString());
            setMrp(product.pricing.mrp?.toString() || '');
            setStock(product.inventory.stock.toString());
            setUnit(product.inventory.unit);
            setIsAvailable(product.isAvailable);
        }
    }, [product]);

    // Commission Preview
    const commissionRate = parseFloat(shopPrice || '0') <= 500 ? 0.05 : 0.02;
    const estimatedCustomerPrice = parseFloat(shopPrice || '0') * (1 + commissionRate);

    const handleSubmit = async () => {
        if (!name || !shopPrice || !stock) {
            Alert.alert('Missing Fields', 'Please fill in Name, Price, and Stock.');
            return;
        }

        setSaving(true);
        try {
            await api.put(`/api/shop-owner/products/${productId}`, {
                name,
                description,
                pricing: {
                    shopPrice: parseFloat(shopPrice),
                    mrp: mrp ? parseFloat(mrp) : null,
                },
                inventory: {
                    stock: parseInt(stock),
                    unit,
                },
                isAvailable,
            });

            Alert.alert('Success', 'Product updated successfully!', [
                { text: 'OK', onPress: () => router.back() }
            ]);
        } catch (error: any) {
            console.error('Update product error:', error);
            Alert.alert('Error', error.response?.data?.error || 'Failed to update product');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = () => {
        Alert.alert(
            'Delete Product',
            'Are you sure you want to delete this product? This action cannot be undone.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        setDeleting(true);
                        try {
                            await api.delete(`/api/shop-owner/products/${productId}`);
                            router.replace('/shop-owner/(tabs)/products');
                        } catch (error: any) {
                            Alert.alert('Error', 'Failed to delete product');
                        } finally {
                            setDeleting(false);
                        }
                    }
                }
            ]
        );
    };

    if (loading) {
        return (
            <SafeView gradient={gradients.backgroundDark as any}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            </SafeView>
        );
    }

    return (
        <SafeView gradient={gradients.backgroundDark as any}>
            <GlassHeader title="Edit Product" showBackButton />

            <ScrollView contentContainerStyle={styles.content}>
                <Animated.View entering={FadeInDown.delay(100).springify()}>

                    {/* Basic Info */}
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Basic Details</Text>
                        <TouchableOpacity
                            style={[styles.statusToggle, isAvailable ? styles.statusActive : styles.statusInactive]}
                            onPress={() => setIsAvailable(!isAvailable)}
                        >
                            <Text style={styles.statusToggleText}>{isAvailable ? 'Visible' : 'Hidden'}</Text>
                        </TouchableOpacity>
                    </View>

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

                    {/* Actions */}
                    <View style={styles.actionContainer}>
                        <TouchableOpacity
                            style={[styles.submitButton, saving && styles.submitButtonDisabled]}
                            onPress={handleSubmit}
                            disabled={saving || deleting}
                        >
                            {saving ? <ActivityIndicator color="#FFF" /> : <Text style={styles.submitText}>Save Changes</Text>}
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.deleteButton}
                            onPress={handleDelete}
                            disabled={saving || deleting}
                        >
                            {deleting ? <ActivityIndicator color={colors.error} /> : (
                                <View style={styles.deleteRow}>
                                    <Ionicons name="trash-outline" size={20} color={colors.error} />
                                    <Text style={styles.deleteText}>Delete Product</Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    </View>

                </Animated.View>
            </ScrollView>
        </SafeView >
    );
}

const styles = StyleSheet.create({
    content: {
        padding: spacing.md,
        paddingBottom: spacing.xxl,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: spacing.md,
        marginBottom: spacing.sm,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: colors.textMuted,
        marginLeft: spacing.xs,
    },
    statusToggle: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
        borderWidth: 1,
    },
    statusActive: {
        backgroundColor: colors.success + '20',
        borderColor: colors.success,
    },
    statusInactive: {
        backgroundColor: colors.error + '20',
        borderColor: colors.error,
    },
    statusToggleText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: colors.text,
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
    actionContainer: {
        marginTop: spacing.xl,
        gap: spacing.md,
    },
    submitButton: {
        backgroundColor: colors.primary,
        padding: spacing.lg,
        borderRadius: borderRadius.lg,
        alignItems: 'center',
    },
    submitButtonDisabled: {
        opacity: 0.7,
    },
    submitText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
    deleteButton: {
        padding: spacing.lg,
        borderRadius: borderRadius.lg,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.error + '40',
        backgroundColor: colors.error + '10',
    },
    deleteRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    deleteText: {
        color: colors.error,
        fontWeight: 'bold',
        fontSize: 16,
    },
});
