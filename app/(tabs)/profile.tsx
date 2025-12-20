// app/(tabs)/profile.tsx - Profile Screen
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React from 'react';
import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp, ZoomIn } from 'react-native-reanimated';
import { GlassCard } from '../../src/components/ui/GlassCard';
import { GlassHeader } from '../../src/components/ui/GlassHeader';
import { ImmersiveBackground } from '../../src/components/ui/ImmersiveBackground';
import { KineticCard } from '../../src/components/ui/KineticCard';
import { SafeView } from '../../src/components/ui/SafeView';
import { useAuth } from '../../src/contexts/AuthContext';
import { colors } from '../../src/theme/colors';
import { gradients } from '../../src/theme/gradients';
import { spacing } from '../../src/theme/spacing';

const { width } = Dimensions.get('window');

export default function ProfileScreen() {
    const { user, logout } = useAuth();

    const handleLogout = () => {
        logout();
        router.replace('/auth/login');
    };

    return (
        <SafeView scroll>
            <ImmersiveBackground />
            <View style={styles.container}>
                <GlassHeader
                    title="Profile"
                    subtitle="Manage your credentials"
                    rightElement={<Ionicons name="settings-outline" size={20} color={colors.primary} />}
                />

                {/* Profile Card */}
                <Animated.View entering={FadeInDown.delay(100).springify()}>
                    <KineticCard cardWidth={width - spacing.lg * 2} style={styles.profileKinetic}>
                        <GlassCard style={styles.profileCard} intensity={25}>
                            <View style={styles.avatarPortal}>
                                <LinearGradient
                                    colors={gradients.primary}
                                    style={styles.avatarGlow}
                                />
                                <View style={styles.avatarContainer}>
                                    <Text style={styles.avatarText}>
                                        {user?.name?.charAt(0).toUpperCase() || 'U'}
                                    </Text>
                                </View>
                                <Animated.View
                                    entering={ZoomIn.delay(300).springify()}
                                    style={styles.editBadge}
                                >
                                    <Ionicons name="camera" size={12} color="#fff" />
                                </Animated.View>
                            </View>

                            <View style={styles.userInfo}>
                                <Text style={styles.name}>{user?.name || 'User'}</Text>
                                <Text style={styles.email}>{user?.email}</Text>
                                <View style={styles.roleBadge}>
                                    <LinearGradient
                                        colors={[colors.primary + '30', 'transparent'] as const}
                                        style={StyleSheet.absoluteFill}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 1 }}
                                    />
                                    <Text style={styles.roleText}>{user?.role || 'CUSTOMER'}</Text>
                                </View>
                            </View>
                        </GlassCard>
                    </KineticCard>
                </Animated.View>

                {/* Account Sections */}
                <Animated.View entering={FadeInUp.delay(200).springify()} style={styles.sectionsContainer}>
                    <AccountSection title="Account" icon="person-circle">
                        <MenuItem
                            icon="person-outline"
                            title="Edit Profile"
                            subtitle="Update your info"
                            onPress={() => { }}
                        />
                        <MenuItem
                            icon="location-outline"
                            title="Addresses"
                            subtitle="Manage delivery spots"
                            onPress={() => { }}
                        />
                        <MenuItem
                            icon="card-outline"
                            title="Payment Methods"
                            subtitle="Linked cards & UPI"
                            onPress={() => { }}
                        />
                    </AccountSection>

                    <AccountSection title="Preferences" icon="options">
                        <MenuItem
                            icon="notifications-outline"
                            title="Notifications"
                            subtitle="Alerts & Message settings"
                            onPress={() => { }}
                        />
                        <MenuItem
                            icon="language-outline"
                            title="Language"
                            subtitle="English"
                            onPress={() => { }}
                        />
                    </AccountSection>

                    <AccountSection title="Support" icon="help-buoy">
                        <MenuItem
                            icon="help-circle-outline"
                            title="Help Center"
                            onPress={() => { }}
                        />
                        <MenuItem
                            icon="information-circle-outline"
                            title="About"
                            subtitle="Version 1.2.0-platinum"
                            onPress={() => { }}
                        />
                    </AccountSection>
                </Animated.View>

                {/* Logout Button */}
                <Animated.View entering={FadeInUp.delay(500).springify()}>
                    <TouchableOpacity onPress={handleLogout} style={styles.logoutContainer}>
                        <GlassCard style={styles.logoutCard} intensity={15}>
                            <View style={styles.logoutIconGlow}>
                                <Ionicons name="log-out-outline" size={20} color={colors.error} />
                            </View>
                            <Text style={styles.logoutText}>Sign Out Securely</Text>
                        </GlassCard>
                    </TouchableOpacity>
                </Animated.View>

                <View style={styles.bottomSpacer} />
            </View>
        </SafeView>
    );
}

const AccountSection = ({ title, icon, children }: { title: string; icon: any; children: React.ReactNode }) => (
    <View style={styles.section}>
        <View style={styles.sectionHeader}>
            <Ionicons name={icon} size={16} color={colors.primary} />
            <Text style={styles.sectionTitle}>{title}</Text>
        </View>
        <GlassCard style={styles.menuCard} intensity={15}>
            {children}
        </GlassCard>
    </View>
);

interface MenuItemProps {
    icon: keyof typeof Ionicons.glyphMap;
    title: string;
    subtitle?: string;
    onPress: () => void;
}

const MenuItem: React.FC<MenuItemProps> = ({ icon, title, subtitle, onPress }) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
        <View style={styles.menuLeft}>
            <View style={styles.iconGlow}>
                <Ionicons name={icon} size={20} color={colors.primary} />
            </View>
            <View>
                <Text style={styles.menuTitle}>{title}</Text>
                {subtitle && <Text style={styles.menuSubtitle}>{subtitle}</Text>}
            </View>
        </View>
        <View style={styles.chevronPortal}>
            <Ionicons name="chevron-forward" size={16} color={colors.primary} />
        </View>
    </TouchableOpacity>
);

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    profileKinetic: {
        marginBottom: spacing.xl,
    },
    profileCard: {
        alignItems: 'center',
        paddingVertical: spacing.xl,
    },
    avatarPortal: {
        position: 'relative',
        marginBottom: spacing.md,
    },
    avatarGlow: {
        position: 'absolute',
        top: -10,
        left: -10,
        right: -10,
        bottom: -10,
        borderRadius: 50,
        opacity: 0.2,
    },
    avatarContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: colors.surface,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: colors.primary + '40',
        elevation: 10,
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 15,
    },
    avatarText: {
        fontSize: 42,
        fontWeight: '900',
        color: colors.primary,
    },
    editBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: colors.primary,
        width: 30,
        height: 30,
        borderRadius: 15,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 3,
        borderColor: colors.background,
    },
    userInfo: {
        alignItems: 'center',
    },
    name: {
        fontSize: 26,
        fontWeight: '800',
        color: colors.text,
        marginBottom: 4,
    },
    email: {
        fontSize: 14,
        color: colors.textMuted,
        marginBottom: spacing.md,
    },
    roleBadge: {
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: colors.primary + '40',
        overflow: 'hidden',
    },
    roleText: {
        fontSize: 11,
        fontWeight: '900',
        color: colors.primary,
        letterSpacing: 1,
    },
    sectionsContainer: {
        gap: spacing.lg,
    },
    section: {
        gap: spacing.sm,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginLeft: 4,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: colors.textMuted,
        textTransform: 'uppercase',
        letterSpacing: 1.5,
    },
    menuCard: {
        padding: 0,
        borderRadius: 24,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.03)',
    },
    menuLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
    },
    iconGlow: {
        width: 42,
        height: 42,
        borderRadius: 14,
        backgroundColor: colors.primary + '10',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: colors.primary + '20',
    },
    menuTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.text,
    },
    menuSubtitle: {
        fontSize: 12,
        color: colors.textMuted,
        marginTop: 2,
    },
    chevronPortal: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: colors.primary + '10',
        alignItems: 'center',
        justifyContent: 'center',
    },
    logoutContainer: {
        marginTop: spacing.xl,
    },
    logoutCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.md,
        paddingVertical: spacing.md,
        borderRadius: 24,
    },
    logoutIconGlow: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: colors.error + '15',
        alignItems: 'center',
        justifyContent: 'center',
    },
    logoutText: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.error,
    },
    bottomSpacer: {
        height: 120,
    },
});
