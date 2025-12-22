// app/shop-owner/kyc-upload.tsx
// Premium KYC Document Upload Screen

import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    Alert,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { GlassCard } from '../../src/components/ui/GlassCard';
import { GlassHeader } from '../../src/components/ui/GlassHeader';
import { ImmersiveBackground } from '../../src/components/ui/ImmersiveBackground';
import { SafeView } from '../../src/components/ui/SafeView';
import { api } from '../../src/lib/api';
import { colors } from '../../src/theme/colors';
import { gradients } from '../../src/theme/gradients';

interface DocumentUpload {
    uri: string | null;
    name: string;
    type: string;
}

interface KYCData {
    gstNumber: string;
    gstDocument: DocumentUpload;
    panNumber: string;
    panDocument: DocumentUpload;
    aadhaarNumber: string;
    aadhaarDocument: DocumentUpload;
    shopLicense: DocumentUpload;
    accountNumber: string;
    ifscCode: string;
    cancelledCheque: DocumentUpload;
    shopPhotos: DocumentUpload[];
}

export default function KYCUploadScreen() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [kycData, setKycData] = useState<KYCData>({
        gstNumber: '',
        gstDocument: { uri: null, name: '', type: '' },
        panNumber: '',
        panDocument: { uri: null, name: '', type: '' },
        aadhaarNumber: '',
        aadhaarDocument: { uri: null, name: '', type: '' },
        shopLicense: { uri: null, name: '', type: '' },
        accountNumber: '',
        ifscCode: '',
        cancelledCheque: { uri: null, name: '', type: '' },
        shopPhotos: [],
    });

    const pickImage = async (field: keyof KYCData) => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission needed', 'Please grant camera roll permissions');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            quality: 0.8,
        });

        if (!result.canceled && result.assets[0]) {
            const asset = result.assets[0];
            if (field === 'shopPhotos') {
                setKycData(prev => ({
                    ...prev,
                    shopPhotos: [...prev.shopPhotos, { uri: asset.uri, name: 'shop_photo', type: 'image' }],
                }));
            } else {
                setKycData(prev => ({
                    ...prev,
                    [field]: { uri: asset.uri, name: field, type: 'image' },
                }));
            }
        }
    };

    const handleSubmit = async () => {
        // Validation
        if (!kycData.gstNumber || !kycData.gstDocument.uri) {
            Alert.alert('Error', 'Please upload GST certificate');
            return;
        }
        if (!kycData.panNumber || !kycData.panDocument.uri) {
            Alert.alert('Error', 'Please upload PAN card');
            return;
        }
        if (!kycData.aadhaarNumber || !kycData.aadhaarDocument.uri) {
            Alert.alert('Error', 'Please upload Aadhaar card');
            return;
        }
        if (!kycData.accountNumber || !kycData.ifscCode || !kycData.cancelledCheque.uri) {
            Alert.alert('Error', 'Please provide complete bank details');
            return;
        }

        setLoading(true);

        try {
            const uploadDocument = async (type: string, number: string, document: DocumentUpload) => {
                if (!document.uri) return;

                const formData = new FormData();
                formData.append('document', {
                    uri: document.uri,
                    name: document.name || `${type}.jpg`,
                    type: document.type || 'image/jpeg',
                } as any);
                formData.append('documentType', type);
                formData.append('documentNumber', number);

                await api.post('/api/shop-owner/kyc/upload', formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                });
            };

            // 1. Upload Documents sequentially
            await uploadDocument('gst', kycData.gstNumber, kycData.gstDocument);
            await uploadDocument('pan', kycData.panNumber, kycData.panDocument);
            await uploadDocument('aadhaar', kycData.aadhaarNumber, kycData.aadhaarDocument);
            await uploadDocument('shop_license', '', kycData.shopLicense);
            await uploadDocument('cancelled_cheque', '', kycData.cancelledCheque);

            // 2. Upload Bank Details
            await api.post('/api/shop-owner/kyc/bank-details', {
                accountNumber: kycData.accountNumber,
                ifscCode: kycData.ifscCode,
                accountHolderName: 'On File',
            });

            // 3. Submit Final Application
            await api.post('/api/shop-owner/kyc/submit', {});

            setLoading(false);
            Alert.alert(
                'Success!',
                'KYC documents submitted successfully. Your application is under review.',
                [
                    {
                        text: 'OK',
                        onPress: () => router.replace('/shop-owner/pending-approval'),
                    },
                ]
            );
        } catch (error: any) {
            console.error('KYC Submit Error:', error);
            setLoading(false);
            const message = error.response?.data?.error || 'Failed to submit KYC documents';
            Alert.alert('Error', message);
        }
    };

    const renderDocumentUpload = (
        title: string,
        field: keyof KYCData,
        required: boolean = true
    ) => {
        const doc = kycData[field] as DocumentUpload;
        return (
            <View style={styles.documentSection}>
                <Text style={styles.documentTitle}>
                    {title} {required && <Text style={styles.required}>*</Text>}
                </Text>
                <TouchableOpacity
                    style={styles.uploadButton}
                    onPress={() => pickImage(field)}
                    activeOpacity={0.8}
                >
                    {doc.uri ? (
                        <View style={styles.uploadedContainer}>
                            <Image source={{ uri: doc.uri }} style={styles.uploadedImage} />
                            <View style={styles.uploadedOverlay}>
                                <Ionicons name="checkmark-circle" size={32} color={colors.primary} />
                                <Text style={styles.uploadedText}>Uploaded</Text>
                            </View>
                        </View>
                    ) : (
                        <View style={styles.uploadPlaceholder}>
                            <Ionicons name="cloud-upload-outline" size={40} color={colors.textMuted} />
                            <Text style={styles.uploadText}>Tap to upload</Text>
                            <Text style={styles.uploadHint}>JPG, PNG (Max 5MB)</Text>
                        </View>
                    )}
                </TouchableOpacity>
            </View>
        );
    };

    return (
        <SafeView gradient={gradients.background as any}>
            <ImmersiveBackground />
            <GlassHeader title="KYC Verification" showBackButton />

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                <Animated.View
                    entering={FadeInDown.delay(100).springify()}
                    style={styles.header}
                >
                    <View style={styles.iconContainer}>
                        <Ionicons name="shield-checkmark" size={40} color="#fbbf24" />
                    </View>
                    <Text style={styles.title}>Complete KYC Verification</Text>
                    <Text style={styles.subtitle}>
                        Upload your documents to verify your shop and start selling
                    </Text>
                </Animated.View>

                <Animated.View entering={FadeInUp.delay(200).springify()}>
                    <GlassCard style={styles.card}>
                        {/* GST Section */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>GST Details</Text>
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>
                                    GST Number <Text style={styles.required}>*</Text>
                                </Text>
                                <View style={styles.inputContainer}>
                                    <Ionicons name="document-text-outline" size={20} color={colors.textMuted} />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="22AAAAA0000A1Z5"
                                        placeholderTextColor={colors.textMuted}
                                        value={kycData.gstNumber}
                                        onChangeText={(val) => setKycData(prev => ({ ...prev, gstNumber: val }))}
                                        autoCapitalize="characters"
                                        maxLength={15}
                                    />
                                </View>
                            </View>
                            {renderDocumentUpload('GST Certificate', 'gstDocument')}
                        </View>

                        {/* PAN Section */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>PAN Details</Text>
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>
                                    PAN Number <Text style={styles.required}>*</Text>
                                </Text>
                                <View style={styles.inputContainer}>
                                    <Ionicons name="card-outline" size={20} color={colors.textMuted} />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="ABCDE1234F"
                                        placeholderTextColor={colors.textMuted}
                                        value={kycData.panNumber}
                                        onChangeText={(val) => setKycData(prev => ({ ...prev, panNumber: val }))}
                                        autoCapitalize="characters"
                                        maxLength={10}
                                    />
                                </View>
                            </View>
                            {renderDocumentUpload('PAN Card', 'panDocument')}
                        </View>

                        {/* Aadhaar Section */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Aadhaar Details</Text>
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>
                                    Aadhaar Number <Text style={styles.required}>*</Text>
                                </Text>
                                <View style={styles.inputContainer}>
                                    <Ionicons name="finger-print-outline" size={20} color={colors.textMuted} />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="1234 5678 9012"
                                        placeholderTextColor={colors.textMuted}
                                        value={kycData.aadhaarNumber}
                                        onChangeText={(val) => setKycData(prev => ({ ...prev, aadhaarNumber: val }))}
                                        keyboardType="number-pad"
                                        maxLength={12}
                                    />
                                </View>
                            </View>
                            {renderDocumentUpload('Aadhaar Card', 'aadhaarDocument')}
                        </View>

                        {/* Shop License */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Shop License</Text>
                            {renderDocumentUpload('Shop License / Trade License', 'shopLicense')}
                        </View>

                        {/* Bank Details */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Bank Details</Text>
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>
                                    Account Number <Text style={styles.required}>*</Text>
                                </Text>
                                <View style={styles.inputContainer}>
                                    <Ionicons name="wallet-outline" size={20} color={colors.textMuted} />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Enter account number"
                                        placeholderTextColor={colors.textMuted}
                                        value={kycData.accountNumber}
                                        onChangeText={(val) => setKycData(prev => ({ ...prev, accountNumber: val }))}
                                        keyboardType="number-pad"
                                    />
                                </View>
                            </View>
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>
                                    IFSC Code <Text style={styles.required}>*</Text>
                                </Text>
                                <View style={styles.inputContainer}>
                                    <Ionicons name="business-outline" size={20} color={colors.textMuted} />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="SBIN0001234"
                                        placeholderTextColor={colors.textMuted}
                                        value={kycData.ifscCode}
                                        onChangeText={(val) => setKycData(prev => ({ ...prev, ifscCode: val }))}
                                        autoCapitalize="characters"
                                        maxLength={11}
                                    />
                                </View>
                            </View>
                            {renderDocumentUpload('Cancelled Cheque / Bank Statement', 'cancelledCheque')}
                        </View>

                        {/* Shop Photos */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Shop Photos (Optional)</Text>
                            <Text style={styles.sectionHint}>Upload 3-5 photos of your shop</Text>
                            <TouchableOpacity
                                style={styles.addPhotoButton}
                                onPress={() => pickImage('shopPhotos')}
                                activeOpacity={0.8}
                            >
                                <Ionicons name="camera-outline" size={24} color={colors.primary} />
                                <Text style={styles.addPhotoText}>Add Photo</Text>
                            </TouchableOpacity>
                            {kycData.shopPhotos.length > 0 && (
                                <View style={styles.photosGrid}>
                                    {kycData.shopPhotos.map((photo, index) => (
                                        <Image
                                            key={index}
                                            source={{ uri: photo.uri! }}
                                            style={styles.shopPhoto}
                                        />
                                    ))}
                                </View>
                            )}
                        </View>

                        {/* Submit Button */}
                        <TouchableOpacity
                            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                            onPress={handleSubmit}
                            disabled={loading}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.submitText}>
                                {loading ? 'Submitting...' : 'Submit for Verification'}
                            </Text>
                            <Ionicons name="arrow-forward" size={20} color="#fff" />
                        </TouchableOpacity>
                    </GlassCard>
                </Animated.View>

                {/* Info Card */}
                <Animated.View entering={FadeInUp.delay(400).springify()} style={styles.infoContainer}>
                    <View style={styles.infoCard}>
                        <Ionicons name="information-circle" size={20} color="#fbbf24" />
                        <Text style={styles.infoText}>
                            Your documents will be verified within 24-48 hours. You'll be notified once approved.
                        </Text>
                    </View>
                </Animated.View>
            </ScrollView>
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
    header: {
        alignItems: 'center',
        marginBottom: 24,
        marginTop: 20,
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: 20,
        backgroundColor: 'rgba(251, 191, 36, 0.2)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    title: {
        fontSize: 24,
        fontWeight: '700',
        color: colors.text,
        marginBottom: 8,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 14,
        color: colors.textMuted,
        textAlign: 'center',
        lineHeight: 20,
    },
    card: {
        padding: 24,
    },
    section: {
        marginBottom: 32,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: colors.text,
        marginBottom: 4,
    },
    sectionHint: {
        fontSize: 13,
        color: colors.textMuted,
        marginBottom: 12,
    },
    inputGroup: {
        marginBottom: 16,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.text,
        marginBottom: 8,
    },
    required: {
        color: colors.error,
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
    documentSection: {
        marginTop: 16,
    },
    documentTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.text,
        marginBottom: 12,
    },
    uploadButton: {
        borderRadius: 12,
        overflow: 'hidden',
        borderWidth: 2,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderStyle: 'dashed',
    },
    uploadPlaceholder: {
        height: 150,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
    },
    uploadText: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.text,
        marginTop: 8,
    },
    uploadHint: {
        fontSize: 12,
        color: colors.textMuted,
        marginTop: 4,
    },
    uploadedContainer: {
        height: 150,
        position: 'relative',
    },
    uploadedImage: {
        width: '100%',
        height: '100%',
    },
    uploadedOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    uploadedText: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.text,
        marginTop: 8,
    },
    addPhotoButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        borderRadius: 12,
        paddingVertical: 16,
        gap: 8,
        borderWidth: 1,
        borderColor: 'rgba(16, 185, 129, 0.2)',
    },
    addPhotoText: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.primary,
    },
    photosGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginTop: 16,
    },
    shopPhoto: {
        width: 100,
        height: 100,
        borderRadius: 12,
    },
    submitButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fbbf24',
        borderRadius: 12,
        paddingVertical: 18,
        gap: 8,
        marginTop: 8,
    },
    submitButtonDisabled: {
        opacity: 0.6,
    },
    submitText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
    },
    infoContainer: {
        marginTop: 24,
    },
    infoCard: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: 'rgba(251, 191, 36, 0.1)',
        borderRadius: 12,
        padding: 16,
        gap: 12,
        borderWidth: 1,
        borderColor: 'rgba(251, 191, 36, 0.2)',
    },
    infoText: {
        flex: 1,
        fontSize: 13,
        color: colors.textMuted,
        lineHeight: 18,
    },
});
