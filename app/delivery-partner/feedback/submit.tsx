// Feedback Submission Screen
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { GlassCard } from '../../../src/components/ui/GlassCard';
import { GlassHeader } from '../../../src/components/ui/GlassHeader';
import { ImmersiveBackground } from '../../../src/components/ui/ImmersiveBackground';
import { SafeView } from '../../../src/components/ui/SafeView';
import { api } from '../../../src/lib/api';
import { colors } from '../../../src/theme/colors';
import { gradients } from '../../../src/theme/gradients';
import { borderRadius, spacing } from '../../../src/theme/spacing';

const FEEDBACK_TYPES = [
    { key: 'appreciation', label: '👍 Appreciation', icon: 'heart', color: colors.success },
    { key: 'feedback', label: '💬 Feedback', icon: 'chatbubble', color: colors.info },
    { key: 'complaint', label: '⚠️ Complaint', icon: 'warning', color: colors.error },
];

const CATEGORIES = [
    'Rude Behavior',
    'Late Delivery',
    'Damaged Goods',
    'Wrong Address',
    'Payment Issue',
    'Excellent Service',
    'Helpful',
    'Professional',
    'Other',
];

export default function SubmitFeedback() {
    const [loading, setLoading] = useState(false);
    const [type, setType] = useState('feedback');
    const [category, setCategory] = useState('');
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');

    const handleSubmit = async () => {
        if (!category || !description) {
            Alert.alert('Missing Information', 'Please select category and provide description');
            return;
        }

        setLoading(true);
        try {
            await api.post('/api/feedback/submit', {
                type,
                category,
                title,
                description,
                reporter_role: 'delivery_partner',
            });

            Alert.alert('Success', 'Feedback submitted successfully', [
                { text: 'OK', onPress: () => router.back() },
            ]);
        } catch (error) {
            console.error('Submit feedback error:', error);
            Alert.alert('Error', 'Failed to submit feedback');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeView gradient={gradients.backgroundDark as any}>
            <ImmersiveBackground />
            <GlassHeader title="Submit Feedback" showBackButton />

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.container}
            >
                <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                    {/* Feedback Type */}
                    <Animated.View entering={FadeInDown.delay(100).springify()}>
                        <Text style={styles.sectionTitle}>Type of Feedback</Text>
                        <View style={styles.typeContainer}>
                            {FEEDBACK_TYPES.map((item) => (
                                <TouchableOpacity
                                    key={item.key}
                                    style={[styles.typeButton, type === item.key && styles.typeButtonActive]}
                                    onPress={() => setType(item.key)}
                                >
                                    <Text style={styles.typeButtonText}>{item.label}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </Animated.View>

                    {/* Category */}
                    <Animated.View entering={FadeInDown.delay(200).springify()}>
                        <Text style={styles.sectionTitle}>Category</Text>
                        <GlassCard style={styles.card}>
                            <View style={styles.categoryGrid}>
                                {CATEGORIES.map((cat) => (
                                    <TouchableOpacity
                                        key={cat}
                                        style={[
                                            styles.categoryButton,
                                            category === cat && styles.categoryButtonActive,
                                        ]}
                                        onPress={() => setCategory(cat)}
                                    >
                                        <Text
                                            style={[
                                                styles.categoryButtonText,
                                                category === cat && styles.categoryButtonTextActive,
                                            ]}
                                        >
                                            {cat}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </GlassCard>
                    </Animated.View>

                    {/* Title */}
                    <Animated.View entering={FadeInDown.delay(300).springify()}>
                        <Text style={styles.sectionTitle}>Title (Optional)</Text>
                        <TextInput
                            style={styles.input}
                            value={title}
                            onChangeText={setTitle}
                            placeholder="Brief title"
                            placeholderTextColor={colors.textSecondary}
                        />
                    </Animated.View>

                    {/* Description */}
                    <Animated.View entering={FadeInDown.delay(400).springify()}>
                        <Text style={styles.sectionTitle}>Description *</Text>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            value={description}
                            onChangeText={setDescription}
                            placeholder="Describe your feedback in detail..."
                            placeholderTextColor={colors.textSecondary}
                            multiline
                            numberOfLines={6}
                            textAlignVertical="top"
                        />
                    </Animated.View>

                    {/* Submit Button */}
                    <Animated.View entering={FadeInDown.delay(500).springify()}>
                        <TouchableOpacity
                            style={styles.submitButton}
                            onPress={handleSubmit}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.submitButtonText}>Submit Feedback</Text>
                            )}
                        </TouchableOpacity>
                    </Animated.View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        padding: spacing.lg,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.text,
        marginBottom: spacing.md,
    },
    typeContainer: {
        gap: spacing.sm,
        marginBottom: spacing.lg,
    },
    typeButton: {
        padding: spacing.lg,
        backgroundColor: colors.glassLight,
        borderRadius: borderRadius.lg,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    typeButtonActive: {
        borderColor: colors.primary,
        backgroundColor: `${colors.primary}20`,
    },
    typeButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.text,
        textAlign: 'center',
    },
    card: {
        padding: spacing.lg,
        marginBottom: spacing.lg,
    },
    categoryGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.sm,
    },
    categoryButton: {
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        backgroundColor: colors.glassLight,
        borderRadius: borderRadius.md,
        borderWidth: 1,
        borderColor: colors.glassBorder,
    },
    categoryButtonActive: {
        backgroundColor: `${colors.primary}20`,
        borderColor: colors.primary,
    },
    categoryButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.textSecondary,
    },
    categoryButtonTextActive: {
        color: colors.primary,
    },
    input: {
        backgroundColor: colors.glassLight,
        borderRadius: borderRadius.lg,
        padding: spacing.lg,
        fontSize: 16,
        color: colors.text,
        borderWidth: 1,
        borderColor: colors.glassBorder,
        marginBottom: spacing.lg,
    },
    textArea: {
        minHeight: 150,
    },
    submitButton: {
        backgroundColor: colors.primary,
        padding: spacing.xl,
        borderRadius: borderRadius.xl,
        alignItems: 'center',
        marginTop: spacing.lg,
    },
    submitButtonText: {
        fontSize: 18,
        fontWeight: '700',
        color: '#fff',
    },
});
