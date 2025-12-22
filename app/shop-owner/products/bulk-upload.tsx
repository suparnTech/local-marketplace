// app/shop-owner/products/bulk-upload.tsx
import { Ionicons } from '@expo/vector-icons';
import { Buffer } from 'buffer';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { router } from 'expo-router';
import * as Sharing from 'expo-sharing';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { GlassCard } from '../../../src/components/ui/GlassCard';
import { GlassHeader } from '../../../src/components/ui/GlassHeader';
import { SafeView } from '../../../src/components/ui/SafeView';
import { api } from '../../../src/lib/api';
import { colors } from '../../../src/theme/colors';
import { gradients } from '../../../src/theme/gradients';
import { borderRadius, spacing } from '../../../src/theme/spacing';

export default function BulkUpload() {
    const [file, setFile] = useState<DocumentPicker.DocumentPickerResult | null>(null);
    const [uploading, setUploading] = useState(false);
    const [downloading, setDownloading] = useState(false);
    const [result, setResult] = useState<any>(null);

    const downloadTemplate = async () => {
        setDownloading(true);
        try {
            const filename = 'product_template.xlsx';
            // Use FileSystem.documentDirectory which is standard
            const fileUri = `${FileSystem.documentDirectory}${filename}`;

            const response = await api.get('/api/shop-owner/products/template', {
                responseType: 'arraybuffer'
            });

            // Convert arraybuffer to base64
            const base64 = Buffer.from(response.data, 'binary').toString('base64');

            // Use 'base64' string directly to avoid EncodingType enum issues in SDK 54
            await FileSystem.writeAsStringAsync(fileUri, base64, {
                encoding: 'base64',
            });

            if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(fileUri);
            } else {
                Alert.alert('Success', 'Template downloaded to: ' + fileUri);
            }
        } catch (error) {
            console.error('Template download error:', error);
            Alert.alert('Error', 'Failed to download template');
        } finally {
            setDownloading(false);
        }
    };

    const pickDocument = async () => {
        try {
            const res = await DocumentPicker.getDocumentAsync({
                type: ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel'],
            });

            if (!res.canceled) {
                setFile(res);
                setResult(null);
            }
        } catch (err) {
            console.error('Pick document error:', err);
        }
    };

    const handleUpload = async () => {
        if (!file || file.canceled) return;

        setUploading(true);
        const formData = new FormData();

        const fileToUpload = file.assets[0];

        // Construct file name for upload
        formData.append('file', {
            uri: fileToUpload.uri,
            name: fileToUpload.name,
            type: fileToUpload.mimeType || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        } as any);

        try {
            const response = await api.post('/api/shop-owner/products/upload-excel', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            setResult(response.data);
            Alert.alert('Upload Processed', `Successfully uploaded ${response.data.summary.successful} products.`);
        } catch (error: any) {
            console.error('Upload error:', error);
            Alert.alert('Error', error.response?.data?.error || 'Failed to upload file');
        } finally {
            setUploading(false);
        }
    };

    return (
        <SafeView gradient={gradients.backgroundDark as any}>
            <GlassHeader title="Bulk Upload" showBackButton />

            <ScrollView contentContainerStyle={styles.content}>
                <Animated.View entering={FadeInDown.delay(100).springify()}>

                    <Text style={styles.description}>
                        Upload an Excel file (.xlsx) to add multiple products at once. Make sure your file follows the required format.
                    </Text>

                    <TouchableOpacity
                        style={styles.templateButton}
                        onPress={downloadTemplate}
                        disabled={downloading}
                    >
                        <Ionicons name="download-outline" size={20} color={colors.primary} />
                        <Text style={styles.templateButtonText}>
                            {downloading ? 'Downloading...' : 'Download Sample Template'}
                        </Text>
                    </TouchableOpacity>

                    <GlassCard style={styles.card}>
                        <TouchableOpacity style={styles.uploadArea} onPress={pickDocument} disabled={uploading}>
                            <Ionicons name="cloud-upload-outline" size={48} color={colors.primary} />
                            <Text style={styles.uploadTitle}>
                                {file && !file.canceled ? file.assets[0].name : 'Select Excel File'}
                            </Text>
                            <Text style={styles.uploadSubtitle}>Tap to browse files</Text>
                        </TouchableOpacity>

                        {file && !file.canceled && (
                            <TouchableOpacity
                                style={[styles.submitButton, uploading && styles.submitButtonDisabled]}
                                onPress={handleUpload}
                                disabled={uploading}
                            >
                                {uploading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.submitText}>Start Upload</Text>}
                            </TouchableOpacity>
                        )}
                    </GlassCard>

                    {result && (
                        <Animated.View entering={FadeInUp.springify()} style={styles.resultContainer}>
                            <Text style={styles.sectionTitle}>Process Summary</Text>
                            <GlassCard style={styles.card}>
                                <View style={styles.summaryRow}>
                                    <View style={styles.summaryItem}>
                                        <Text style={styles.summaryValue}>{result.summary.total}</Text>
                                        <Text style={styles.summaryLabel}>Total Rows</Text>
                                    </View>
                                    <View style={styles.summaryItem}>
                                        <Text style={[styles.summaryValue, { color: colors.success }]}>{result.summary.successful}</Text>
                                        <Text style={styles.summaryLabel}>Successful</Text>
                                    </View>
                                    <View style={styles.summaryItem}>
                                        <Text style={[styles.summaryValue, { color: colors.error }]}>{result.summary.failed}</Text>
                                        <Text style={styles.summaryLabel}>Failed</Text>
                                    </View>
                                </View>

                                {result.failedProducts.length > 0 && (
                                    <View style={styles.errorLog}>
                                        <Text style={styles.errorLogTitle}>Errors:</Text>
                                        {result.failedProducts.map((err: any, idx: number) => (
                                            <Text key={idx} style={styles.errorText}>
                                                Row {err.row}: {err.error}
                                            </Text>
                                        ))}
                                    </View>
                                )}
                            </GlassCard>

                            <TouchableOpacity
                                style={styles.viewProductsButton}
                                onPress={() => router.replace('/shop-owner/(tabs)/products')}
                            >
                                <Text style={styles.viewProductsText}>View Products</Text>
                            </TouchableOpacity>
                        </Animated.View>
                    )}

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
    description: {
        fontSize: 14,
        color: colors.textMuted,
        marginBottom: spacing.md,
        paddingHorizontal: spacing.xs,
        lineHeight: 20,
    },
    templateButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: spacing.lg,
        paddingHorizontal: spacing.xs,
    },
    templateButtonText: {
        color: colors.primary,
        fontSize: 14,
        fontWeight: 'bold',
        textDecorationLine: 'underline',
    },
    card: {
        padding: spacing.lg,
        borderRadius: borderRadius.lg,
    },
    uploadArea: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: spacing.xl,
        borderWidth: 2,
        borderColor: colors.primary + '40',
        borderStyle: 'dashed',
        borderRadius: borderRadius.md,
        backgroundColor: colors.primary + '05',
    },
    uploadTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: colors.text,
        marginTop: spacing.md,
    },
    uploadSubtitle: {
        fontSize: 12,
        color: colors.textMuted,
        marginTop: 4,
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
    resultContainer: {
        marginTop: spacing.xl,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: colors.textMuted,
        marginBottom: spacing.sm,
        marginLeft: spacing.xs,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingVertical: spacing.md,
    },
    summaryItem: {
        alignItems: 'center',
    },
    summaryValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: colors.text,
    },
    summaryLabel: {
        fontSize: 12,
        color: colors.textMuted,
        marginTop: 4,
    },
    errorLog: {
        marginTop: spacing.md,
        paddingTop: spacing.md,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.1)',
    },
    errorLogTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: colors.error,
        marginBottom: 8,
    },
    errorText: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.6)',
        marginBottom: 4,
    },
    viewProductsButton: {
        marginTop: spacing.xl,
        padding: spacing.lg,
        borderRadius: borderRadius.lg,
        borderWidth: 1,
        borderColor: colors.primary,
        alignItems: 'center',
    },
    viewProductsText: {
        color: colors.primary,
        fontWeight: 'bold',
        fontSize: 16,
    },
});
