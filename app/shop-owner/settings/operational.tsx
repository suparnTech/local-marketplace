// app/shop-owner/settings/operational.tsx - Premium Operational Settings
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { GlassCard } from '../../../src/components/ui/GlassCard';
import { GlassHeader } from '../../../src/components/ui/GlassHeader';
import { ImmersiveBackground } from '../../../src/components/ui/ImmersiveBackground';
import { SafeView } from '../../../src/components/ui/SafeView';
import { api } from '../../../src/lib/api';
import { colors } from '../../../src/theme/colors';
import { gradients } from '../../../src/theme/gradients';
import { spacing } from '../../../src/theme/spacing';

const { width } = Dimensions.get('window');

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function OperationalSettingsScreen() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [settings, setSettings] = useState({
        openingTime: '09:00',
        closingTime: '21:00',
        weeklyOff: [] as string[],
        deliveryRadius: 5,
        minimumOrderValue: 0,
        deliveryCharge: 0,
    });

    const fetchSettings = async () => {
        try {
            const response = await api.get('/api/shop-owner/profile');
            const shop = response.data;
            setSettings({
                openingTime: shop.operational.openingHours?.opening || '09:00',
                closingTime: shop.operational.openingHours?.closing || '21:00',
                weeklyOff: shop.operational.weeklyOff || [],
                deliveryRadius: parseFloat(shop.operational.deliveryRadius) || 5,
                minimumOrderValue: parseFloat(shop.operational.minimumOrderValue) || 0,
                deliveryCharge: parseFloat(shop.delivery_charge) || 0,
            });
        } catch (error) {
            console.error('Failed to fetch settings:', error);
            Alert.alert('Error', 'Failed to load settings');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSettings();
    }, []);

    const handleSave = async () => {
        setSaving(true);
        try {
            await api.put('/api/shop-owner/profile/operational', settings);
            Alert.alert('Success', 'Operational settings updated successfully');
            router.back();
        } catch (error) {
            console.error('Failed to save settings:', error);
            Alert.alert('Error', 'Failed to update settings');
        } finally {
            setSaving(false);
        }
    };

    const toggleDay = (day: string) => {
        setSettings(prev => ({
            ...prev,
            weeklyOff: prev.weeklyOff.includes(day)
                ? prev.weeklyOff.filter(d => d !== day)
                : [...prev.weeklyOff, day]
        }));
    };

    if (loading) {
        return (
            <SafeView>
                <ImmersiveBackground />
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            </SafeView>
        );
    }

    return (
        <SafeView scroll>
            <ImmersiveBackground />
            <View style={styles.container}>
                <GlassHeader
                    title="Operations"
                    subtitle="Timings & Delivery"
                    showBackButton
                    onBackPress={() => router.back()}
                />

                <View style={styles.content}>
                    {/* Store Timings Section */}
                    <Animated.View entering={FadeInDown.delay(100).springify()}>
                        <SectionTitle title="Store Timings" icon="time-outline" />
                        <GlassCard style={styles.card} intensity={20}>
                            <View style={styles.timeRow}>
                                <TimeInput
                                    label="Opens at"
                                    value={settings.openingTime}
                                    onChange={(v: string) => setSettings(s => ({ ...s, openingTime: v }))}
                                />
                                <View style={styles.timeDivider} />
                                <TimeInput
                                    label="Closes at"
                                    value={settings.closingTime}
                                    onChange={(v: string) => setSettings(s => ({ ...s, closingTime: v }))}
                                />
                            </View>
                        </GlassCard>
                    </Animated.View>

                    {/* Weekly Off Section */}
                    <Animated.View entering={FadeInDown.delay(200).springify()}>
                        <SectionTitle title="Weekly Off Days" icon="calendar-outline" />
                        <GlassCard style={styles.card} intensity={20}>
                            <View style={styles.daysGrid}>
                                {DAYS.map(day => (
                                    <TouchableOpacity
                                        key={day}
                                        onPress={() => toggleDay(day)}
                                        style={[
                                            styles.dayChip,
                                            settings.weeklyOff.includes(day) && styles.dayChipActive
                                        ]}
                                    >
                                        <Text style={[
                                            styles.dayText,
                                            settings.weeklyOff.includes(day) && styles.dayTextActive
                                        ]}>
                                            {day.slice(0, 3)}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </GlassCard>
                    </Animated.View>

                    {/* Delivery Configuration */}
                    <Animated.View entering={FadeInDown.delay(300).springify()}>
                        <SectionTitle title="Delivery Settings" icon="bicycle-outline" />
                        <GlassCard style={styles.card} intensity={20}>
                            <View style={styles.configItem}>
                                <View style={styles.configHeader}>
                                    <Text style={styles.configLabel}>Delivery Radius</Text>
                                    <Text style={styles.configValue}>{settings.deliveryRadius} km</Text>
                                </View>
                                <Slider
                                    style={styles.slider}
                                    minimumValue={1}
                                    maximumValue={20}
                                    step={1}
                                    value={settings.deliveryRadius}
                                    onValueChange={(v: number) => setSettings(s => ({ ...s, deliveryRadius: v }))}
                                    minimumTrackTintColor={colors.primary}
                                    maximumTrackTintColor="rgba(255,255,255,0.1)"
                                    thumbTintColor={colors.primary}
                                />
                            </View>

                            <View style={styles.separator} />

                            <View style={styles.configItem}>
                                <View style={styles.configHeader}>
                                    <Text style={styles.configLabel}>Minimum Order Value</Text>
                                    <Text style={styles.configValue}>₹{settings.minimumOrderValue}</Text>
                                </View>
                                <Slider
                                    style={styles.slider}
                                    minimumValue={0}
                                    maximumValue={2000}
                                    step={50}
                                    value={settings.minimumOrderValue}
                                    onValueChange={(v: number) => setSettings(s => ({ ...s, minimumOrderValue: v }))}
                                    minimumTrackTintColor={colors.primary}
                                    maximumTrackTintColor="rgba(255,255,255,0.1)"
                                    thumbTintColor={colors.primary}
                                />
                            </View>

                            <View style={styles.separator} />

                            <View style={styles.configItem}>
                                <View style={styles.configHeader}>
                                    <Text style={styles.configLabel}>Flat Delivery Charge</Text>
                                    <Text style={styles.configValue}>₹{settings.deliveryCharge}</Text>
                                </View>
                                <Slider
                                    style={styles.slider}
                                    minimumValue={0}
                                    maximumValue={100}
                                    step={5}
                                    value={settings.deliveryCharge}
                                    onValueChange={(v: number) => setSettings(s => ({ ...s, deliveryCharge: v }))}
                                    minimumTrackTintColor={colors.primary}
                                    maximumTrackTintColor="rgba(255,255,255,0.1)"
                                    thumbTintColor={colors.primary}
                                />
                            </View>
                        </GlassCard>
                    </Animated.View>

                    {/* Save Button */}
                    <Animated.View entering={FadeInUp.delay(500).springify()} style={styles.saveContainer}>
                        <TouchableOpacity
                            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
                            onPress={handleSave}
                            disabled={saving}
                        >
                            <LinearGradient
                                colors={gradients.primary}
                                style={styles.saveGradient}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                            >
                                {saving ? (
                                    <ActivityIndicator size="small" color="#fff" />
                                ) : (
                                    <>
                                        <Ionicons name="cloud-upload-outline" size={20} color="#fff" />
                                        <Text style={styles.saveText}>Save Operational Settings</Text>
                                    </>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>
                    </Animated.View>

                    <View style={styles.bottomSpacer} />
                </View>
            </View>
        </SafeView>
    );
}

const SectionTitle = ({ title, icon }: { title: string; icon: any }) => (
    <View style={styles.sectionHeader}>
        <View style={styles.iconBox}>
            <Ionicons name={icon} size={16} color={colors.primary} />
        </View>
        <Text style={styles.sectionText}>{title}</Text>
    </View>
);

const TimeInput = ({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) => {
    return (
        <View style={styles.timeInputBox}>
            <Text style={styles.timeLabel}>{label}</Text>
            <TouchableOpacity
                style={styles.timeDisplay}
                onPress={() => {
                    // Simple logic to cycle hours for demo/MVP
                    const [h, m] = value.split(':');
                    const nextH = (parseInt(h) + 1) % 24;
                    onChange(`${nextH.toString().padStart(2, '0')}:${m}`);
                }}
            >
                <Text style={styles.timeValue}>{value}</Text>
                <Ionicons name="time-outline" size={12} color={colors.primary} />
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    center: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    content: {
        padding: spacing.lg,
        gap: spacing.xl,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: spacing.md,
        marginLeft: 4,
    },
    iconBox: {
        width: 32,
        height: 32,
        borderRadius: 10,
        backgroundColor: colors.primary + '15',
        alignItems: 'center',
        justifyContent: 'center',
    },
    sectionText: {
        fontSize: 14,
        fontWeight: '800',
        color: colors.textMuted,
        textTransform: 'uppercase',
        letterSpacing: 1.5,
    },
    card: {
        borderRadius: 24,
        padding: spacing.lg,
    },
    timeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    timeInputBox: {
        flex: 1,
        gap: 8,
    },
    timeLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: colors.textMuted,
        textAlign: 'center',
    },
    timeDisplay: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: 'rgba(255,255,255,0.05)',
        paddingVertical: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.03)',
    },
    timeValue: {
        fontSize: 18,
        fontWeight: '800',
        color: colors.text,
    },
    timeDivider: {
        width: 1,
        height: 30,
        backgroundColor: 'rgba(255,255,255,0.1)',
        marginHorizontal: spacing.md,
        marginTop: 15,
    },
    daysGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        justifyContent: 'center',
    },
    dayChip: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 10,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.03)',
        minWidth: 50,
        alignItems: 'center',
    },
    dayChipActive: {
        backgroundColor: colors.error + '20',
        borderColor: colors.error + '40',
    },
    dayText: {
        fontSize: 12,
        fontWeight: '700',
        color: colors.textMuted,
    },
    dayTextActive: {
        color: colors.error,
    },
    configItem: {
        gap: 12,
    },
    configHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    configLabel: {
        fontSize: 15,
        fontWeight: '700',
        color: colors.text,
    },
    configValue: {
        fontSize: 16,
        fontWeight: '900',
        color: colors.primary,
    },
    slider: {
        width: '100%',
        height: 40,
    },
    separator: {
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.05)',
        marginVertical: spacing.lg,
    },
    saveContainer: {
        marginTop: spacing.md,
    },
    saveButton: {
        borderRadius: 20,
        overflow: 'hidden',
        elevation: 8,
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
    },
    saveButtonDisabled: {
        opacity: 0.7,
    },
    saveGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        paddingVertical: 18,
    },
    saveText: {
        fontSize: 16,
        fontWeight: '800',
        color: '#fff',
    },
    bottomSpacer: {
        height: 100,
    },
});
