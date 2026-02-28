// Delivery Partner KYC Review Screen
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { GlassCard } from '../../../src/components/ui/GlassCard';
import { GlassHeader } from '../../../src/components/ui/GlassHeader';
import { ImmersiveBackground } from '../../../src/components/ui/ImmersiveBackground';
import { SafeView } from '../../../src/components/ui/SafeView';
import { api } from '../../../src/lib/api';
import { colors } from '../../../src/theme/colors';
import { gradients } from '../../../src/theme/gradients';

interface DeliveryPartner {
    id: string;
    full_name: string;
    email: string;
    phone: string;
    date_of_birth: string;
    address_line1: string;
    address_line2: string;
    city: string;
    state: string;
    pincode: string;
    aadhaar_number: string;
    aadhaar_front_url: string;
    aadhaar_back_url: string;
    driving_license_number: string;
    driving_license_url: string;
    pan_number: string;
    vehicle_type: string;
    vehicle_number: string;
    vehicle_rc_url: string;
    bank_account_number: string;
    ifsc_code: string;
    upi_id: string;
    verification_status: string;
}

export default function DeliveryPartnerReviewScreen() {
    const { partnerId } = useLocalSearchParams<{ partnerId: string }>();
    const [partner, setPartner] = useState<DeliveryPartner | null>(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        fetchPartnerDetails();
    }, [partnerId]);

    const fetchPartnerDetails = async () => {
        try {
            const response = await api.get(`/admin/delivery-partners/${partnerId}/kyc`);
            setPartner(response.data);
        } catch (error) {
            console.error('Fetch partner error:', error);
            Alert.alert('Error', 'Failed to load partner details');
        } finally {
            setLoading(false);
        }
    };

    const handleVerify = async (status: 'approved' | 'rejected') => {
        setActionLoading(true);
        try {
            await api.post(`/admin/delivery-partners/${partnerId}/verify`, {
                status,
                reason: status === 'rejected' ? 'Documents not valid' : null,
            });

            Alert.alert(
                status === 'approved' ? '✅ Approved!' : '❌ Rejected',
                `Delivery partner has been ${status}.`,
                [{ text: 'OK', onPress: () => router.back() }]
            );
        } catch (error) {
            console.error('Verify error:', error);
            Alert.alert('Error', 'Failed to update status');
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) {
        return (
            <SafeView gradient={gradients.background as any}>
                <ImmersiveBackground />
                <GlassHeader title="Review KYC" showBackButton />
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text style={styles.loadingText}>Loading details...</Text>
                </View>
            </SafeView>
        );
    }

    if (!partner) {
        return (
            <SafeView gradient={gradients.background as any}>
                <ImmersiveBackground />
                <GlassHeader title="Review KYC" showBackButton />
                <View style={styles.loadingContainer}>
                    <Ionicons name="alert-circle" size={64} color={colors.error} />
                    <Text style={styles.loadingText}>Partner not found</Text>
                </View>
            </SafeView>
        );
    }

    return (
        <SafeView gradient={gradients.background as any}>
            <ImmersiveBackground />
            <GlassHeader title="Review KYC" showBackButton />

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                {/* Personal Info */}
                <GlassCard style={styles.card}>
                    <View style={styles.sectionHeader}>
                        <Ionicons name="person" size={24} color={colors.primary} />
                        <Text style={styles.sectionTitle}>Personal Information</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>Name</Text>
                        <Text style={styles.value}>{partner.full_name}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>Email</Text>
                        <Text style={styles.value}>{partner.email}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>Phone</Text>
                        <Text style={styles.value}>{partner.phone}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>DOB</Text>
                        <Text style={styles.value}>{partner.date_of_birth}</Text>
                    </View>
                </GlassCard>

                {/* Address */}
                <GlassCard style={styles.card}>
                    <View style={styles.sectionHeader}>
                        <Ionicons name="location" size={24} color={colors.warning} />
                        <Text style={styles.sectionTitle}>Address</Text>
                    </View>
                    <Text style={styles.addressText}>
                        {partner.address_line1}
                        {partner.address_line2 ? `, ${partner.address_line2}` : ''}
                        {'\n'}{partner.city}, {partner.state} - {partner.pincode}
                    </Text>
                </GlassCard>

                {/* KYC Documents */}
                <GlassCard style={styles.card}>
                    <View style={styles.sectionHeader}>
                        <Ionicons name="document-text" size={24} color={colors.info} />
                        <Text style={styles.sectionTitle}>KYC Documents</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>Aadhaar Number</Text>
                        <Text style={styles.value}>{partner.aadhaar_number}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>DL Number</Text>
                        <Text style={styles.value}>{partner.driving_license_number}</Text>
                    </View>
                    {partner.pan_number && (
                        <View style={styles.row}>
                            <Text style={styles.label}>PAN Number</Text>
                            <Text style={styles.value}>{partner.pan_number}</Text>
                        </View>
                    )}
                </GlassCard>

                {/* Documents Preview */}
                <GlassCard style={styles.card}>
                    <View style={styles.sectionHeader}>
                        <Ionicons name="images" size={24} color="#e879f9" />
                        <Text style={styles.sectionTitle}>Document Photos</Text>
                    </View>

                    {partner.aadhaar_front_url && (
                        <View style={styles.docSection}>
                            <Text style={styles.docLabel}>Aadhaar Front</Text>
                            <Image source={{ uri: partner.aadhaar_front_url }} style={styles.docImage} resizeMode="cover" />
                        </View>
                    )}

                    {partner.aadhaar_back_url && (
                        <View style={styles.docSection}>
                            <Text style={styles.docLabel}>Aadhaar Back</Text>
                            <Image source={{ uri: partner.aadhaar_back_url }} style={styles.docImage} resizeMode="cover" />
                        </View>
                    )}

                    {partner.driving_license_url && (
                        <View style={styles.docSection}>
                            <Text style={styles.docLabel}>Driving License</Text>
                            <Image source={{ uri: partner.driving_license_url }} style={styles.docImage} resizeMode="cover" />
                        </View>
                    )}

                    {partner.vehicle_rc_url && (
                        <View style={styles.docSection}>
                            <Text style={styles.docLabel}>Vehicle RC</Text>
                            <Image source={{ uri: partner.vehicle_rc_url }} style={styles.docImage} resizeMode="cover" />
                        </View>
                    )}
                </GlassCard>

                {/* Vehicle & Bank */}
                <GlassCard style={styles.card}>
                    <View style={styles.sectionHeader}>
                        <Ionicons name="bicycle" size={24} color="#22d3ee" />
                        <Text style={styles.sectionTitle}>Vehicle & Bank</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>Vehicle Type</Text>
                        <Text style={styles.value}>{partner.vehicle_type}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>Vehicle Number</Text>
                        <Text style={styles.value}>{partner.vehicle_number}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>Bank Account</Text>
                        <Text style={styles.value}>{partner.bank_account_number}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>IFSC</Text>
                        <Text style={styles.value}>{partner.ifsc_code}</Text>
                    </View>
                    {partner.upi_id && (
                        <View style={styles.row}>
                            <Text style={styles.label}>UPI ID</Text>
                            <Text style={styles.value}>{partner.upi_id}</Text>
                        </View>
                    )}
                </GlassCard>

                {/* Action Buttons */}
                <View style={styles.actions}>
                    <TouchableOpacity
                        style={[styles.actionButton, styles.rejectButton]}
                        onPress={() => handleVerify('rejected')}
                        disabled={actionLoading}
                    >
                        <Ionicons name="close-circle" size={24} color="#fff" />
                        <Text style={styles.actionButtonText}>Reject</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.actionButton, styles.approveButton]}
                        onPress={() => handleVerify('approved')}
                        disabled={actionLoading}
                    >
                        {actionLoading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <>
                                <Ionicons name="checkmark-circle" size={24} color="#fff" />
                                <Text style={styles.actionButtonText}>Approve</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeView>
    );
}

const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
    },
    loadingText: {
        fontSize: 16,
        color: colors.textMuted,
    },
    content: {
        padding: 20,
        paddingBottom: 100,
    },
    card: {
        padding: 20,
        marginBottom: 16,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 16,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.text,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
    },
    label: {
        fontSize: 14,
        color: colors.textMuted,
    },
    value: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.text,
    },
    addressText: {
        fontSize: 14,
        color: colors.text,
        lineHeight: 22,
    },
    docSection: {
        marginTop: 12,
    },
    docLabel: {
        fontSize: 14,
        color: colors.textMuted,
        marginBottom: 8,
    },
    docImage: {
        width: '100%',
        height: 200,
        borderRadius: 12,
        backgroundColor: colors.glassLight,
    },
    actions: {
        flexDirection: 'row',
        gap: 16,
        marginTop: 8,
    },
    actionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 16,
        borderRadius: 12,
    },
    rejectButton: {
        backgroundColor: colors.error,
    },
    approveButton: {
        backgroundColor: colors.success,
    },
    actionButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#fff',
    },
});
