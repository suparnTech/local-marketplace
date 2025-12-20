// src/components/ui/ImmersiveBackground.tsx
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withSequence,
    withTiming
} from 'react-native-reanimated';
import { colors } from '../../theme/colors';

const { width, height } = Dimensions.get('window');

export const ImmersiveBackground = () => {
    const blob1X = useSharedValue(0);
    const blob1Y = useSharedValue(0);
    const blob2X = useSharedValue(width);
    const blob2Y = useSharedValue(height);

    useEffect(() => {
        blob1X.value = withRepeat(
            withSequence(
                withTiming(width * 0.5, { duration: 10000 }),
                withTiming(0, { duration: 10000 })
            ),
            -1,
            true
        );
        blob1Y.value = withRepeat(
            withSequence(
                withTiming(height * 0.3, { duration: 8000 }),
                withTiming(0, { duration: 8000 })
            ),
            -1,
            true
        );
        blob2X.value = withRepeat(
            withSequence(
                withTiming(width * 0.2, { duration: 12000 }),
                withTiming(width, { duration: 12000 })
            ),
            -1,
            true
        );
        blob2Y.value = withRepeat(
            withSequence(
                withTiming(height * 0.7, { duration: 9000 }),
                withTiming(height, { duration: 9000 })
            ),
            -1,
            true
        );
    }, []);

    const animatedBlob1 = useAnimatedStyle(() => ({
        transform: [{ translateX: blob1X.value }, { translateY: blob1Y.value }],
    }));

    const animatedBlob2 = useAnimatedStyle(() => ({
        transform: [{ translateX: blob2X.value }, { translateY: blob2Y.value }],
    }));

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={[colors.background, colors.backgroundLight]}
                style={StyleSheet.absoluteFill}
            />

            <Animated.View style={[styles.blob, animatedBlob1]}>
                <LinearGradient
                    colors={['rgba(16, 185, 129, 0.15)', 'transparent']}
                    style={styles.blobInner}
                />
            </Animated.View>

            <Animated.View style={[styles.blob, animatedBlob2]}>
                <LinearGradient
                    colors={['rgba(52, 211, 153, 0.1)', 'transparent']}
                    style={styles.blobInner}
                />
            </Animated.View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: colors.background,
        overflow: 'hidden',
    },
    blob: {
        position: 'absolute',
        width: width * 1.2,
        height: width * 1.2,
        borderRadius: width * 0.6,
    },
    blobInner: {
        flex: 1,
        borderRadius: width * 0.6,
    },
});
