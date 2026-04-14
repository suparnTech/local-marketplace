// src/components/ui/KineticCard.tsx
import { LinearGradient } from 'expo-linear-gradient';
import React, { ReactNode, useEffect } from 'react';
import { StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import Animated, {
    Easing,
    Extrapolate,
    interpolate,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withSpring,
    withTiming
} from 'react-native-reanimated';

interface KineticCardProps {
    children: ReactNode;
    onPress?: () => void;
    onLongPress?: () => void;
    style?: ViewStyle;
    cardWidth: number;
    tiltAngle?: number;
    shimmer?: boolean;
    borderRadius?: number;
}

export const KineticCard = ({
    children,
    onPress,
    onLongPress,
    style,
    cardWidth,
    tiltAngle = 8,
    shimmer = true,
    borderRadius = 28,
}: KineticCardProps) => {
    const x = useSharedValue(0);
    const y = useSharedValue(0);
    const active = useSharedValue(false);
    const shimmerX = useSharedValue(-cardWidth);

    useEffect(() => {
        if (shimmer) {
            shimmerX.value = withRepeat(
                withTiming(cardWidth, { duration: 2500, easing: Easing.linear }),
                -1,
                false
            );
        }
    }, [shimmer, cardWidth]);

    const animatedStyle = useAnimatedStyle(() => {
        const rotateX = interpolate(y.value, [-100, 100], [tiltAngle, -tiltAngle], Extrapolate.CLAMP);
        const rotateY = interpolate(x.value, [-cardWidth / 2, cardWidth / 2], [-tiltAngle, tiltAngle], Extrapolate.CLAMP);

        return {
            transform: [
                { perspective: 1000 },
                { rotateX: (withSpring(active.value ? rotateX : 0, { damping: 12, stiffness: 100 }) as any) + 'deg' },
                { rotateY: (withSpring(active.value ? rotateY : 0, { damping: 12, stiffness: 100 }) as any) + 'deg' },
                { scale: withSpring(active.value ? 1.015 : 1) }
            ],
            shadowOpacity: withSpring(active.value ? 0.35 : 0.2),
            shadowRadius: withSpring(active.value ? 15 : 8),
        };
    });

    const shimmerStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: shimmerX.value }],
    }));

    const onTouch = (e: any) => {
        'worklet';
        x.value = e.nativeEvent.locationX - cardWidth / 2;
        y.value = e.nativeEvent.locationY - 100; // Offset for typical card height
        active.value = true;
    };

    const onRelease = () => {
        'worklet';
        x.value = 0;
        y.value = 0;
        active.value = false;
    };

    return (
        <Animated.View
            style={[animatedStyle, styles.kineticWrapper, style, { borderRadius }]}
            onTouchStart={onTouch}
            onTouchMove={onTouch}
            onTouchEnd={onRelease}
            onTouchCancel={onRelease}
        >
            <TouchableOpacity
                activeOpacity={1}
                onPress={onPress}
                onLongPress={onLongPress}
                delayLongPress={500}
                style={{ borderRadius, overflow: 'hidden' }}
            >
                {children}
                {shimmer && (
                    <Animated.View 
                        style={[styles.shimmerContainer, shimmerStyle, { borderRadius }]}
                        pointerEvents="none"
                    >
                        <LinearGradient
                            colors={['transparent', 'rgba(255,255,255,0.08)', 'transparent']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={StyleSheet.absoluteFill}
                        />
                    </Animated.View>
                )}
            </TouchableOpacity>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    kineticWrapper: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        elevation: 10,
    },
    shimmerContainer: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 1,
        overflow: 'hidden',
    },
});
