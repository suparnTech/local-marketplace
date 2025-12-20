// src/components/ui/SafeView.tsx - Safe Area Wrapper
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { gradients } from '../../theme/gradients';

interface SafeViewProps {
    children: React.ReactNode;
    scroll?: boolean;
    style?: ViewStyle;
    gradient?: string[];
}

export const SafeView: React.FC<SafeViewProps> = ({
    children,
    scroll = false,
    style,
    gradient = gradients.background,
}) => {
    const content = (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.keyboard}
        >
            {scroll ? (
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    {children}
                </ScrollView>
            ) : (
                children
            )}
        </KeyboardAvoidingView>
    );

    return (
        <LinearGradient colors={gradient} style={styles.gradient}>
            <SafeAreaView style={[styles.container, style]} edges={['top', 'bottom']}>
                {content}
            </SafeAreaView>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    gradient: {
        flex: 1,
    },
    container: {
        flex: 1,
    },
    keyboard: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
    },
});
