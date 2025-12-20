// src/components/ui/GradientButton.tsx - Animated Gradient Button
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { colors } from '../../theme/colors';
import { gradients } from '../../theme/gradients';
import { borderRadius, spacing } from '../../theme/spacing';

interface GradientButtonProps {
    title: string;
    onPress: () => void;
    loading?: boolean;
    disabled?: boolean;
    variant?: 'primary' | 'secondary' | 'accent';
    style?: ViewStyle;
}

export const GradientButton: React.FC<GradientButtonProps> = ({
    title,
    onPress,
    loading = false,
    disabled = false,
    variant = 'primary',
    style,
}) => {
    const scale = useSharedValue(1);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    const handlePressIn = () => {
        scale.value = withSpring(0.95);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    };

    const handlePressOut = () => {
        scale.value = withSpring(1);
    };

    const getGradient = () => {
        switch (variant) {
            case 'secondary':
                return gradients.success;
            case 'accent':
                return gradients.accent;
            default:
                return gradients.button;
        }
    };

    return (
        <Animated.View style={[animatedStyle, style]}>
            <TouchableOpacity
                onPress={onPress}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                disabled={disabled || loading}
                activeOpacity={0.9}
            >
                <LinearGradient
                    colors={getGradient()}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[
                        styles.button,
                        (disabled || loading) && styles.disabled,
                    ]}
                >
                    {loading ? (
                        <ActivityIndicator color={colors.text} />
                    ) : (
                        <Text style={styles.text}>{title}</Text>
                    )}
                </LinearGradient>
            </TouchableOpacity>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    button: {
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.xl,
        borderRadius: borderRadius.lg,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 56,
    },
    disabled: {
        opacity: 0.5,
    },
    text: {
        color: colors.text,
        fontSize: 16,
        fontWeight: '600',
        letterSpacing: 0.5,
    },
});
