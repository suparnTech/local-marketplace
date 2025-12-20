// app/select-town.tsx - Town Selection Screen (Simplified without GPS)
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useDispatch, useSelector } from 'react-redux';
import { GlassCard } from '../src/components/ui/GlassCard';
import { SafeView } from '../src/components/ui/SafeView';
import { api } from '../src/lib/api';
import { setSelectedTown } from '../src/store/slices/locationSlice';
import { colors } from '../src/theme/colors';
import { gradients } from '../src/theme/gradients';
import { borderRadius, spacing } from '../src/theme/spacing';

interface Town {
    id: string;
    name: string;
    state: string;
    district?: string;
    pincode?: string;
}

export default function SelectTownScreen() {
    const dispatch = useDispatch();
    const { recentTowns } = useSelector((state: any) => state.location);

    const [search, setSearch] = useState('');
    const [towns, setTowns] = useState<Town[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchTowns();
    }, [search]);

    const fetchTowns = async () => {
        try {
            setLoading(true);
            const response = await api.get('/api/towns', {
                params: { search: search || undefined },
            });
            setTowns(response.data);
        } catch (error) {
            console.error('Failed to fetch towns:', error);
        } finally {
            setLoading(false);
        }
    };

    const selectTown = (town: Town) => {
        dispatch(setSelectedTown(town));
        router.replace('/(tabs)');
    };

    const renderTownItem = ({ item, index }: { item: Town; index: number }) => (
        <Animated.View entering={FadeInDown.delay(index * 100).springify()}>
            <TouchableOpacity onPress={() => selectTown(item)}>
                <GlassCard style={styles.townCard}>
                    <View style={styles.townInfo}>
                        <Ionicons name="location" size={24} color={colors.primary} />
                        <View style={styles.townText}>
                            <Text style={styles.townName}>{item.name}</Text>
                            <Text style={styles.townDetails}>
                                {item.district}, {item.state}
                            </Text>
                        </View>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
                </GlassCard>
            </TouchableOpacity>
        </Animated.View>
    );

    return (
        <SafeView gradient={gradients.background}>
            <View style={styles.container}>
                {/* Header */}
                <Animated.View entering={FadeInDown.duration(600).springify()} style={styles.header}>
                    <LinearGradient colors={gradients.primary as any} style={styles.iconGradient}>
                        <Ionicons name="location" size={32} color={colors.text} />
                    </LinearGradient>
                    <Text style={styles.title}>Select Your Town</Text>
                    <Text style={styles.subtitle}>Choose your location to see nearby shops</Text>
                </Animated.View>

                {/* Search Bar */}
                <Animated.View entering={FadeInDown.delay(200).springify()}>
                    <GlassCard style={styles.searchCard}>
                        <Ionicons name="search" size={20} color={colors.textMuted} />
                        <TextInput
                            placeholder="Search for your town..."
                            placeholderTextColor={colors.textMuted}
                            style={styles.searchInput}
                            value={search}
                            onChangeText={setSearch}
                        />
                        {search.length > 0 && (
                            <TouchableOpacity onPress={() => setSearch('')}>
                                <Ionicons name="close-circle" size={20} color={colors.textMuted} />
                            </TouchableOpacity>
                        )}
                    </GlassCard>
                </Animated.View>

                {/* Recent Towns */}
                {recentTowns.length > 0 && !search && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Recent</Text>
                        <FlatList
                            data={recentTowns}
                            renderItem={renderTownItem}
                            keyExtractor={(item) => item.id}
                            scrollEnabled={false}
                        />
                    </View>
                )}

                {/* All Towns */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>
                        {search ? 'Search Results' : 'All Towns'}
                    </Text>
                    {loading ? (
                        <View style={styles.loading}>
                            <ActivityIndicator color={colors.primary} />
                        </View>
                    ) : (
                        <FlatList
                            data={towns}
                            renderItem={renderTownItem}
                            keyExtractor={(item) => item.id}
                            showsVerticalScrollIndicator={false}
                        />
                    )}
                </View>
            </View>
        </SafeView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: spacing.lg,
    },
    header: {
        alignItems: 'center',
        marginBottom: spacing.xl,
    },
    iconGradient: {
        width: 80,
        height: 80,
        borderRadius: borderRadius.xl,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.md,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: colors.text,
        marginBottom: spacing.xs,
    },
    subtitle: {
        fontSize: 14,
        color: colors.textMuted,
        textAlign: 'center',
    },
    searchCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        marginBottom: spacing.lg,
    },
    searchInput: {
        flex: 1,
        color: colors.text,
        fontSize: 16,
        paddingVertical: spacing.xs,
    },
    section: {
        marginBottom: spacing.lg,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.text,
        marginBottom: spacing.md,
    },
    townCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: spacing.sm,
    },
    townInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        flex: 1,
    },
    townText: {
        flex: 1,
    },
    townName: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.text,
        marginBottom: 2,
    },
    townDetails: {
        fontSize: 12,
        color: colors.textMuted,
    },
    loading: {
        padding: spacing.xl,
        alignItems: 'center',
    },
});
