// src/components/ui/GlassHeader.tsx - Standardized Premium Header
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { router } from 'expo-router';
import React, { ReactNode } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';

interface GlassHeaderProps {
    title: string;
    subtitle?: string;
    showBackButton?: boolean;
    onBackPress?: () => void;
    rightElement?: ReactNode;
    leftElement?: ReactNode;
    style?: ViewStyle | any;
    intensity?: number;
}

export const GlassHeader: React.FC<GlassHeaderProps> = ({
    title,
    subtitle,
    showBackButton = false,
    onBackPress,
    rightElement,
    leftElement,
    style,
}) => {
    return (
        <BlurView intensity={30} tint="dark" style={[styles.header, style]}>
            <View style={styles.leftContainer}>
                {showBackButton ? (
                    <TouchableOpacity
                        onPress={onBackPress || (() => router.back())}
                        style={styles.backButton}
                    >
                        <Ionicons name="chevron-back" size={24} color={colors.text} />
                    </TouchableOpacity>
                ) : leftElement}
            </View>

            <View style={styles.titleContainer}>
                <Text style={styles.title} numberOfLines={1}>{title}</Text>
                {subtitle && <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text>}
            </View>

            <View style={styles.rightContainer}>
                {rightElement || <View style={{ width: 40 }} />}
            </View>
        </BlurView>
    );
};

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)',
        minHeight: 64,
    },
    leftContainer: {
        minWidth: 44,
        alignItems: 'flex-start',
        justifyContent: 'center',
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.05)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    titleContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: spacing.sm,
    },
    title: {
        fontSize: 18,
        fontWeight: '800',
        color: colors.text,
        letterSpacing: 0.5,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 11,
        color: colors.textMuted,
        fontWeight: '500',
        textAlign: 'center',
        marginTop: 2,
    },
    rightContainer: {
        minWidth: 44,
        alignItems: 'flex-end',
        justifyContent: 'center',
    },
});
