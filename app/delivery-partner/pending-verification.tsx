// Pending Verification Screen for Delivery Partners
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { GlassCard } from '../../src/components/ui/GlassCard';
import { GlassHeader } from '../../src/components/ui/GlassHeader';
import { ImmersiveBackground } from '../../src/components/ui/ImmersiveBackground';
import { SafeView } from '../../src/components/ui/SafeView';
import { colors } from '../../src/theme/colors';
import { gradients } from '../../src/theme/gradients';
import { borderRadius, spacing } from '../../src/theme/spacing';

export default function PendingVerification() {
    return (
        <SafeView gradient={gradients.backgroundDark as any}>
            <ImmersiveBackground />
            <GlassHeader title="Verification Pending" />

            <ScrollView
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
            >
                <GlassCard style={styles.card}>
                    {/* Icon */}
                    <View style={styles.iconContainer}>
                        <View style={styles.iconCircle}>
                            <Ionicons name="hourglass-outline" size={64} color={colors.warning} />
                        </View>
                    </View>

                    {/* Title */}
                    <Text style={styles.title}>Application Under Review</Text>
                    <Text style={styles.subtitle}>
                        Your delivery partner application is being reviewed by our team
                    </Text>

                    {/* Status Steps */}
                    <View style={styles.statusContainer}>
                        <View style={styles.statusItem}>
                            <View style={[styles.statusDot, styles.statusDotComplete]}>
                                <Ionicons name="checkmark" size={16} color="#fff" />
                            </View>
                            <View style={styles.statusContent}>
                                <Text style={styles.statusTitle}>Application Submitted</Text>
                                <Text style={styles.statusText}>Your documents have been received</Text>
                            </View>
                        </View>

                        <View style={styles.statusLine} />

                        <View style={styles.statusItem}>
                            <View style={[styles.statusDot, styles.statusDotActive]}>
                                <Ionicons name="document-text" size={16} color={colors.warning} />
                            </View>
                            <View style={styles.statusContent}>
                                <Text style={styles.statusTitle}>Document Verification</Text>
                                <Text style={styles.statusText}>Admin is reviewing your KYC documents</Text>
                            </View>
                        </View>

                        <View style={styles.statusLine} />

                        <View style={styles.statusItem}>
                            <View style={styles.statusDot}>
                                <Ionicons name="shield-checkmark" size={16} color="#666" />
                            </View>
                            <View style={styles.statusContent}>
                                <Text style={[styles.statusTitle, styles.statusTitleInactive]}>
                                    Approval
                                </Text>
                                <Text style={styles.statusText}>You'll be notified once approved</Text>
                            </View>
                        </View>
                    </View>

                    {/* Info Box */}
                    <View style={styles.infoBox}>
                        <Ionicons name="information-circle" size={24} color={colors.info} />
                        <View style={styles.infoContent}>
                            <Text style={styles.infoTitle}>What happens next?</Text>
                            <Text style={styles.infoText}>
                                • Our team will verify your documents{'\n'}
                                • This usually takes 24-48 hours{'\n'}
                                • You'll receive a notification once approved{'\n'}
                                • After approval, you can start accepting deliveries
                            </Text>
                        </View>
                    </View>

                    {/* Contact Support */}
                    <TouchableOpacity style={styles.supportButton}>
                        <Ionicons name="help-circle-outline" size={20} color={colors.primary} />
                        <Text style={styles.supportText}>Need Help? Contact Support</Text>
                    </TouchableOpacity>

                    {/* Logout Button */}
                    <TouchableOpacity
                        style={styles.logoutButton}
                        onPress={() => {
                            // Clear auth and go back to role selection
                            router.replace('/auth/role-selection');
                        }}
                    >
                        <Text style={styles.logoutText}>Logout</Text>
                    </TouchableOpacity>
                </GlassCard>
            </ScrollView>
        </SafeView>
    );
}

const styles = StyleSheet.create({
    content: {
        padding: spacing.lg,
        paddingBottom: 100,
    },
    card: {
        padding: spacing.xl,
    },
    iconContainer: {
        alignItems: 'center',
        marginBottom: spacing.xl,
    },
    iconCircle: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: `${colors.warning}20`,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: `${colors.warning}40`,
    },
    title: {
        fontSize: 28,
        fontWeight: '700',
        color: colors.text,
        textAlign: 'center',
        marginBottom: spacing.sm,
    },
    subtitle: {
        fontSize: 16,
        color: colors.textMuted,
        textAlign: 'center',
        marginBottom: spacing.xl,
    },
    statusContainer: {
        marginVertical: spacing.xl,
    },
    statusItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    statusDot: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.glassLight,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.md,
    },
    statusDotComplete: {
        backgroundColor: colors.success,
    },
    statusDotActive: {
        backgroundColor: `${colors.warning}30`,
        borderWidth: 2,
        borderColor: colors.warning,
    },
    statusContent: {
        flex: 1,
        paddingTop: spacing.xs,
    },
    statusTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.text,
        marginBottom: spacing.xs,
    },
    statusTitleInactive: {
        color: colors.textMuted,
    },
    statusText: {
        fontSize: 14,
        color: colors.textMuted,
    },
    statusLine: {
        width: 2,
        height: 30,
        backgroundColor: colors.glassBorder,
        marginLeft: 19,
        marginVertical: spacing.xs,
    },
    infoBox: {
        flexDirection: 'row',
        padding: spacing.lg,
        backgroundColor: `${colors.info}15`,
        borderRadius: borderRadius.lg,
        borderWidth: 1,
        borderColor: `${colors.info}30`,
        marginTop: spacing.lg,
    },
    infoContent: {
        flex: 1,
        marginLeft: spacing.md,
    },
    infoTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.text,
        marginBottom: spacing.sm,
    },
    infoText: {
        fontSize: 14,
        color: colors.textMuted,
        lineHeight: 20,
    },
    supportButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: spacing.lg,
        backgroundColor: `${colors.primary}15`,
        borderRadius: borderRadius.lg,
        borderWidth: 1,
        borderColor: `${colors.primary}30`,
        marginTop: spacing.xl,
    },
    supportText: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.primary,
        marginLeft: spacing.sm,
    },
    logoutButton: {
        padding: spacing.lg,
        alignItems: 'center',
        marginTop: spacing.md,
    },
    logoutText: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.textMuted,
    },
});
