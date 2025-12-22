// app/admin/kyc-review/[shopId].tsx
// Admin KYC Review Screen

import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { GlassCard } from '../../../src/components/ui/GlassCard';
import { GlassHeader } from '../../../src/components/ui/GlassHeader';
import { ImmersiveBackground } from '../../../src/components/ui/ImmersiveBackground';
import { SafeView } from '../../../src/components/ui/SafeView';
import { api } from '../../../src/lib/api';
import { colors } from '../../../src/theme/colors';
import { gradients } from '../../../src/theme/gradients';

interface ShopDocument {
    gst: string | null;
    pan: string | null;
    aadhaar: string | null;
    shopLicense: string | null;
    cancelledCheque: string | null;
    shopPhotos: string[];
}

interface ShopData {
    businessName: string;
    ownerName: string;
    phone: string;
    email: string;
    address: string;
    gstNumber: string;
    panNumber: string;
    aadhaarNumber: string;
    accountNumber: string;
    ifscCode: string;
    documents: ShopDocument;
}

export default function KYCReviewScreen() {
    const { shopId } = useLocalSearchParams();
    const router = useRouter();
    const [shopData, setShopData] = useState<ShopData | null>(null);
    const [loading, setLoading] = useState(true);
    const [verifying, setVerifying] = useState(false);
    const [verified, setVerified] = useState(false);
    const [rejectionModalVisible, setRejectionModalVisible] = useState(false);
    const [rejectionReason, setRejectionReason] = useState('');
    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    React.useEffect(() => {
        const fetchShopDetails = async () => {
            try {
                const response = await api.get(`/admin/shops/${shopId}/kyc`);
                setShopData(response.data);
                setLoading(false);
            } catch (error) {
                console.error('Fetch shop details error:', error);
                Alert.alert('Error', 'Failed to fetch shop details');
                setLoading(false);
            }
        };

        if (shopId) {
            fetchShopDetails();
        }
    }, [shopId]);

    const handleRunVerification = () => {
        setVerifying(true);
        setTimeout(() => {
            setVerifying(false);
            setVerified(true);
            Alert.alert(
                'Verification Complete',
                'Pre-checks passed. Please manually review the documents before approving.'
            );
        }, 1500);
    };

    const handleApprove = () => {
        Alert.alert(
            'Approve KYC?',
            'Are you sure you want to approve this shop owner?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Approve',
                    style: 'default',
                    onPress: async () => {
                        try {
                            await api.post(`/admin/shops/${shopId}/verify`, { status: 'approved' });
                            Alert.alert('Success', 'Shop owner approved successfully!', [
                                { text: 'OK', onPress: () => router.back() },
                            ]);
                        } catch (error) {
                            Alert.alert('Error', 'Failed to approve shop');
                        }
                    },
                },
            ]
        );
    };

    const handleReject = () => {
        if (!rejectionReason.trim()) {
            Alert.alert('Error', 'Please provide a reason for rejection');
            return;
        }

        setRejectionModalVisible(false);

        Alert.alert(
            'Reject KYC?',
            'Are you sure you want to reject this application?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Reject',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await api.post(`/admin/shops/${shopId}/verify`, {
                                status: 'rejected',
                                reason: rejectionReason,
                            });
                            Alert.alert('Rejected', 'Shop owner has been notified.', [
                                { text: 'OK', onPress: () => router.back() },
                            ]);
                        } catch (error) {
                            Alert.alert('Error', 'Failed to reject shop');
                        }
                    },
                },
            ]
        );
    };

    const renderDocument = (title: string, imageUrl: string | null) => {
        if (!imageUrl) return null;
        return (
            <View style={styles.documentSection}>
                <Text style={styles.documentTitle}>{title}</Text>
                <TouchableOpacity
                    onPress={() => setSelectedImage(imageUrl)}
                    activeOpacity={0.9}
                >
                    <Image source={{ uri: imageUrl }} style={styles.documentImage} />
                    <View style={styles.viewOverlay}>
                        <Ionicons name="expand-outline" size={24} color="#fff" />
                        <Text style={styles.viewText}>Tap to enlarge</Text>
                    </View>
                </TouchableOpacity>
            </View>
        );
    };

    if (loading || !shopData) {
        return (
            <SafeView gradient={gradients.background as any}>
                <ImmersiveBackground />
                <GlassHeader title="KYC Review" showBackButton />
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            </SafeView>
        );
    }

    return (
        <SafeView gradient={gradients.background as any}>
            <ImmersiveBackground />
            <GlassHeader title="KYC Review" showBackButton />

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Shop Info */}
                <Animated.View entering={FadeInDown.delay(100).springify()}>
                    <GlassCard style={styles.card}>
                        <View style={styles.shopHeader}>
                            <View style={styles.shopIcon}>
                                <Ionicons name="storefront" size={32} color="#fbbf24" />
                            </View>
                            <View style={styles.shopInfo}>
                                <Text style={styles.businessName}>{shopData.businessName}</Text>
                                <Text style={styles.ownerName}>{shopData.ownerName}</Text>
                            </View>
                        </View>

                        <View style={styles.infoGrid}>
                            <View style={styles.infoItem}>
                                <Ionicons name="call-outline" size={16} color={colors.textMuted} />
                                <Text style={styles.infoText}>{shopData.phone}</Text>
                            </View>
                            <View style={styles.infoItem}>
                                <Ionicons name="mail-outline" size={16} color={colors.textMuted} />
                                <Text style={styles.infoText}>{shopData.email}</Text>
                            </View>
                            <View style={styles.infoItem}>
                                <Ionicons name="location-outline" size={16} color={colors.textMuted} />
                                <Text style={styles.infoText}>{shopData.address}</Text>
                            </View>
                        </View>
                    </GlassCard>
                </Animated.View>

                {/* Document Details */}
                <Animated.View entering={FadeInUp.delay(200).springify()}>
                    <GlassCard style={styles.card}>
                        <Text style={styles.sectionTitle}>Document Details</Text>

                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>GST Number:</Text>
                            <Text style={styles.detailValue}>{shopData.gstNumber}</Text>
                        </View>
                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>PAN Number:</Text>
                            <Text style={styles.detailValue}>{shopData.panNumber}</Text>
                        </View>
                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Aadhaar Number:</Text>
                            <Text style={styles.detailValue}>{shopData.aadhaarNumber}</Text>
                        </View>
                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Account Number:</Text>
                            <Text style={styles.detailValue}>{shopData.accountNumber}</Text>
                        </View>
                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>IFSC Code:</Text>
                            <Text style={styles.detailValue}>{shopData.ifscCode}</Text>
                        </View>
                    </GlassCard>
                </Animated.View>

                {/* Documents */}
                <Animated.View entering={FadeInUp.delay(300).springify()}>
                    <GlassCard style={styles.card}>
                        <Text style={styles.sectionTitle}>Uploaded Documents</Text>

                        {renderDocument('GST Certificate', shopData.documents.gst)}
                        {renderDocument('PAN Card', shopData.documents.pan)}
                        {renderDocument('Aadhaar Card', shopData.documents.aadhaar)}
                        {renderDocument('Shop License', shopData.documents.shopLicense)}
                        {renderDocument('Cancelled Cheque', shopData.documents.cancelledCheque)}

                        {shopData.documents.shopPhotos.length > 0 && (
                            <View style={styles.documentSection}>
                                <Text style={styles.documentTitle}>Shop Photos</Text>
                                <View style={styles.photosGrid}>
                                    {shopData.documents.shopPhotos.map((photo, index) => (
                                        <TouchableOpacity
                                            key={index}
                                            onPress={() => setSelectedImage(photo)}
                                            activeOpacity={0.9}
                                        >
                                            <Image source={{ uri: photo }} style={styles.shopPhoto} />
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>
                        )}
                    </GlassCard>
                </Animated.View>

                {/* Actions */}
                <Animated.View entering={FadeInUp.delay(400).springify()} style={styles.actionsContainer}>
                    {!verified && (
                        <TouchableOpacity
                            style={[styles.verifyButton, verifying && styles.buttonDisabled]}
                            onPress={handleRunVerification}
                            disabled={verifying}
                            activeOpacity={0.8}
                        >
                            <Ionicons
                                name={verifying ? 'sync-outline' : 'shield-checkmark-outline'}
                                size={20}
                                color="#fff"
                            />
                            <Text style={styles.buttonText}>
                                {verifying ? 'Verifying...' : 'Run Mock Verification'}
                            </Text>
                        </TouchableOpacity>
                    )}

                    {verified && (
                        <>
                            <TouchableOpacity
                                style={styles.approveButton}
                                onPress={handleApprove}
                                activeOpacity={0.8}
                            >
                                <Ionicons name="checkmark-circle" size={20} color="#fff" />
                                <Text style={styles.buttonText}>Approve KYC</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.rejectButton}
                                onPress={() => setRejectionModalVisible(true)}
                                activeOpacity={0.8}
                            >
                                <Ionicons name="close-circle" size={20} color="#fff" />
                                <Text style={styles.buttonText}>Reject KYC</Text>
                            </TouchableOpacity>
                        </>
                    )}
                </Animated.View>
            </ScrollView>

            {/* Image Viewer Modal */}
            <Modal
                visible={!!selectedImage}
                transparent
                animationType="fade"
                onRequestClose={() => setSelectedImage(null)}
            >
                <View style={styles.modalContainer}>
                    <TouchableOpacity
                        style={styles.modalClose}
                        onPress={() => setSelectedImage(null)}
                    >
                        <Ionicons name="close" size={32} color="#fff" />
                    </TouchableOpacity>
                    {selectedImage && (
                        <Image source={{ uri: selectedImage }} style={styles.modalImage} resizeMode="contain" />
                    )}
                </View>
            </Modal>

            {/* Rejection Modal */}
            <Modal
                visible={rejectionModalVisible}
                transparent
                animationType="slide"
                onRequestClose={() => setRejectionModalVisible(false)}
            >
                <View style={styles.rejectionModalContainer}>
                    <GlassCard style={styles.rejectionModal}>
                        <Text style={styles.rejectionTitle}>Reason for Rejection</Text>
                        <TextInput
                            style={styles.rejectionInput}
                            placeholder="Enter reason..."
                            placeholderTextColor={colors.textMuted}
                            value={rejectionReason}
                            onChangeText={setRejectionReason}
                            multiline
                            numberOfLines={4}
                            textAlignVertical="top"
                        />
                        <View style={styles.rejectionActions}>
                            <TouchableOpacity
                                style={styles.rejectionCancel}
                                onPress={() => setRejectionModalVisible(false)}
                            >
                                <Text style={styles.rejectionCancelText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.rejectionSubmit} onPress={handleReject}>
                                <Text style={styles.rejectionSubmitText}>Reject</Text>
                            </TouchableOpacity>
                        </View>
                    </GlassCard>
                </View>
            </Modal>
        </SafeView>
    );
}

const styles = StyleSheet.create({
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 40,
    },
    card: {
        padding: 20,
        marginBottom: 16,
    },
    shopHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    shopIcon: {
        width: 64,
        height: 64,
        borderRadius: 16,
        backgroundColor: 'rgba(251, 191, 36, 0.2)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    shopInfo: {
        flex: 1,
    },
    businessName: {
        fontSize: 22,
        fontWeight: '700',
        color: colors.text,
        marginBottom: 4,
    },
    ownerName: {
        fontSize: 16,
        color: colors.textMuted,
    },
    infoGrid: {
        gap: 12,
    },
    infoItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    infoText: {
        fontSize: 14,
        color: colors.textMuted,
        flex: 1,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.text,
        marginBottom: 16,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    },
    detailLabel: {
        fontSize: 14,
        color: colors.textMuted,
    },
    detailValue: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.text,
    },
    documentSection: {
        marginTop: 20,
    },
    documentTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.text,
        marginBottom: 12,
    },
    documentImage: {
        width: '100%',
        height: 200,
        borderRadius: 12,
    },
    viewOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    viewText: {
        fontSize: 12,
        color: '#fff',
        marginTop: 4,
    },
    photosGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    shopPhoto: {
        width: 100,
        height: 100,
        borderRadius: 12,
    },
    actionsContainer: {
        gap: 12,
        marginTop: 8,
    },
    verifyButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fbbf24',
        borderRadius: 12,
        paddingVertical: 18,
        gap: 8,
    },
    approveButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.primary,
        borderRadius: 12,
        paddingVertical: 18,
        gap: 8,
    },
    rejectButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.error,
        borderRadius: 12,
        paddingVertical: 18,
        gap: 8,
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    buttonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
    },
    modalContainer: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.95)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalClose: {
        position: 'absolute',
        top: 60,
        right: 20,
        zIndex: 10,
    },
    modalImage: {
        width: '100%',
        height: '100%',
    },
    rejectionModalContainer: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        justifyContent: 'center',
        padding: 20,
    },
    rejectionModal: {
        padding: 24,
    },
    rejectionTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: colors.text,
        marginBottom: 16,
    },
    rejectionInput: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        color: colors.text,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        marginBottom: 20,
        minHeight: 120,
    },
    rejectionActions: {
        flexDirection: 'row',
        gap: 12,
    },
    rejectionCancel: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 16,
        borderRadius: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    rejectionCancelText: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.textMuted,
    },
    rejectionSubmit: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 16,
        borderRadius: 12,
        backgroundColor: colors.error,
    },
    rejectionSubmitText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
    },
});
