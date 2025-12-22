// app/addresses.tsx - Address List Screen
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useDispatch } from 'react-redux';
import { GlassCard } from '../src/components/ui/GlassCard';
import { GlassHeader } from '../src/components/ui/GlassHeader';
import { SafeView } from '../src/components/ui/SafeView';
import { useAddresses } from '../src/hooks/useAddresses';
import { api } from '../src/lib/api';
import { removeAddress as removeAddressAction, selectAddress } from '../src/store/slices/addressSlice';
import { colors } from '../src/theme/colors';
import { gradients } from '../src/theme/gradients';
import { borderRadius, spacing } from '../src/theme/spacing';

export default function AddressesScreen() {
    const dispatch = useDispatch();
    const { data: addresses = [], isLoading: loading, refetch: fetchAddresses } = useAddresses();

    const handleDelete = (id: string) => {
        Alert.alert(
            'Delete Address',
            'Are you sure you want to delete this address?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await api.delete(`/api/addresses/${id}`);
                            // Optimization: We could invalidate the query instead of just manual Redux update
                            fetchAddresses();
                            dispatch(removeAddressAction(id));
                            Alert.alert('Success', 'Address deleted successfully');
                        } catch (error) {
                            Alert.alert('Error', 'Failed to delete address');
                        }
                    },
                },
            ]
        );
    };

    const handleSetDefault = async (id: string) => {
        try {
            await api.put(`/api/addresses/${id}/default`);
            fetchAddresses();
        } catch (error) {
            Alert.alert('Error', 'Failed to set default address');
        }
    };

    const handleSelectAddress = (address: any) => {
        dispatch(selectAddress(address));
        router.back();
    };

    const renderAddress = ({ item, index }: { item: any; index: number }) => (
        <Animated.View entering={FadeInDown.delay(index * 50).springify()}>
            <TouchableOpacity onPress={() => handleSelectAddress(item)}>
                <GlassCard style={styles.addressCard}>
                    {item.is_default && (
                        <View style={styles.defaultBadge}>
                            <Text style={styles.defaultText}>Default</Text>
                        </View>
                    )}

                    <Text style={styles.addressName}>{item.name}</Text>
                    <Text style={styles.addressText}>
                        {item.address_line1}
                        {item.address_line2 && `, ${item.address_line2}`}
                    </Text>
                    <Text style={styles.addressText}>
                        {item.city}, {item.state} - {item.pincode}
                    </Text>
                    <Text style={styles.addressPhone}>Phone: {item.phone}</Text>

                    <View style={styles.actions}>
                        {!item.is_default && (
                            <TouchableOpacity
                                style={styles.actionButton}
                                onPress={() => handleSetDefault(item.id)}
                            >
                                <Ionicons name="checkmark-circle-outline" size={18} color={colors.primary} />
                                <Text style={styles.actionText}>Set as Default</Text>
                            </TouchableOpacity>
                        )}
                        <TouchableOpacity
                            style={styles.actionButton}
                            onPress={() => router.push(`/address-form?id=${item.id}` as any)}
                        >
                            <Ionicons name="create-outline" size={18} color={colors.primary} />
                            <Text style={styles.actionText}>Edit</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.actionButton}
                            onPress={() => handleDelete(item.id)}
                        >
                            <Ionicons name="trash-outline" size={18} color={colors.error} />
                            <Text style={[styles.actionText, { color: colors.error }]}>Delete</Text>
                        </TouchableOpacity>
                    </View>
                </GlassCard>
            </TouchableOpacity>
        </Animated.View>
    );

    if (loading && addresses.length === 0) {
        return (
            <SafeView gradient={gradients.background as any}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            </SafeView>
        );
    }

    return (
        <SafeView gradient={gradients.background as any}>
            <View style={styles.container}>
                <GlassHeader
                    title="My Addresses"
                    subtitle="Manage your delivery locations"
                    showBackButton
                    rightElement={<Ionicons name="location" size={20} color={colors.primary} />}
                />

                <FlatList
                    data={addresses}
                    renderItem={renderAddress}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContent}
                    onRefresh={fetchAddresses}
                    refreshing={loading}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons name="location-outline" size={64} color={colors.textMuted} />
                            <Text style={styles.emptyText}>No addresses added yet</Text>
                        </View>
                    }
                />

                <Animated.View entering={FadeInDown.delay(300).springify()} style={styles.footer}>
                    <TouchableOpacity
                        style={styles.addButton}
                        onPress={() => router.push('/address-form')}
                    >
                        <LinearGradient
                            colors={gradients.primary as any}
                            style={styles.addButtonGradient}
                        >
                            <Ionicons name="add" size={24} color={colors.text} />
                            <Text style={styles.addButtonText}>Add New Address</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </Animated.View>
            </View>
        </SafeView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
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
    listContent: {
        padding: spacing.lg,
        paddingTop: 0,
        paddingBottom: 100,
    },
    addressCard: {
        marginBottom: spacing.md,
        position: 'relative',
    },
    defaultBadge: {
        position: 'absolute',
        top: spacing.md,
        right: spacing.md,
        backgroundColor: colors.primary,
        paddingHorizontal: spacing.sm,
        paddingVertical: 4,
        borderRadius: borderRadius.sm,
    },
    defaultText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: colors.text,
    },
    addressName: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.text,
        marginBottom: 4,
    },
    addressText: {
        fontSize: 14,
        color: colors.textMuted,
        marginBottom: 2,
    },
    addressPhone: {
        fontSize: 14,
        color: colors.textMuted,
        marginTop: 4,
        marginBottom: spacing.md,
    },
    actions: {
        flexDirection: 'row',
        gap: spacing.md,
        paddingTop: spacing.md,
        borderTopWidth: 1,
        borderTopColor: colors.surface,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    actionText: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.primary,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: spacing.xl * 2,
    },
    emptyText: {
        fontSize: 16,
        color: colors.textMuted,
        marginTop: spacing.md,
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: spacing.lg,
    },
    addButton: {
        borderRadius: borderRadius.lg,
        overflow: 'hidden',
    },
    addButtonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.sm,
        paddingVertical: spacing.md,
    },
    addButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: colors.text,
    },
});
