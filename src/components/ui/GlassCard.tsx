// src/components/ui/GlassCard.tsx - Simplified Glass Card
import { BlurView } from 'expo-blur';
import React, { ReactNode } from 'react';
import { StyleProp, StyleSheet, ViewStyle } from 'react-native';
import { borderRadius } from '../../theme/spacing';

interface GlassCardProps {
    children: ReactNode;
    style?: StyleProp<ViewStyle>;
    intensity?: number;
}

export const GlassCard: React.FC<GlassCardProps> = ({
    children,
    style,
    intensity = 15
}) => {
    return (
        <BlurView
            intensity={intensity}
            style={[styles.container, style]}
            tint="dark"
        >
            {children}
        </BlurView>
    );
};

const styles = StyleSheet.create({
    container: {
        borderRadius: borderRadius.lg,
        overflow: 'hidden',
        backgroundColor: 'rgba(255, 255, 255, 0.03)', // Very subtle
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)',
        padding: 16,
    },
});
