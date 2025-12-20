// app/onboarding/city.tsx
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useState } from "react";
import { FlatList, StyleSheet, TextInput, TouchableOpacity, View } from "react-native";
import { Button } from "../../src/components/ui/Button";
import { Text } from "../../src/components/ui/Text";
import { useAuth } from "../../src/contexts/AuthContext";
import { colors } from "../../src/theme/colors";

const POPULAR_CITIES = [
    "Mumbai", "Delhi", "Bangalore", "Hyderabad", "Chennai",
    "Kolkata", "Pune", "Ahmedabad", "Jaipur", "Lucknow",
    "Patna", "Araria", "Katihar", "Purnia", "Kishanganj"
];

export default function CitySelectionScreen() {
    const { updateProfile } = useAuth();
    const [search, setSearch] = useState("");
    const [selectedCity, setSelectedCity] = useState("");
    const [loading, setLoading] = useState(false);

    const filteredCities = POPULAR_CITIES.filter(city =>
        city.toLowerCase().includes(search.toLowerCase())
    );

    const handleContinue = async () => {
        if (!selectedCity) return;

        try {
            setLoading(true);
            await updateProfile({ city: selectedCity });
            router.replace("/(tabs)");
        } catch (error) {
            console.error("Update city error:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <LinearGradient
            colors={["#0F172A", "#1E293B"]}
            style={styles.container}
        >
            <View style={styles.content}>
                <View style={styles.header}>
                    <Text style={styles.icon}>📍</Text>
                    <Text variant="heading" style={styles.title}>
                        Select Your City
                    </Text>
                    <Text variant="body" style={styles.subtitle}>
                        We'll show you stores and products available in your area
                    </Text>
                </View>

                <TextInput
                    style={styles.searchInput}
                    placeholder="Search for your city..."
                    placeholderTextColor={colors.textMuted}
                    value={search}
                    onChangeText={setSearch}
                />

                <FlatList
                    data={filteredCities}
                    keyExtractor={(item) => item}
                    contentContainerStyle={styles.list}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            style={[
                                styles.cityCard,
                                selectedCity === item && styles.cityCardSelected
                            ]}
                            onPress={() => setSelectedCity(item)}
                        >
                            <Text style={[
                                styles.cityText,
                                selectedCity === item && styles.cityTextSelected
                            ]}>
                                {item}
                            </Text>
                            {selectedCity === item && (
                                <Text style={styles.checkmark}>✓</Text>
                            )}
                        </TouchableOpacity>
                    )}
                />

                <Button
                    title={loading ? "Saving..." : "Continue"}
                    onPress={handleContinue}
                    disabled={!selectedCity || loading}
                    style={styles.continueButton}
                />
            </View>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        flex: 1,
        padding: 24,
    },
    header: {
        alignItems: "center",
        marginTop: 40,
        marginBottom: 32,
    },
    icon: {
        fontSize: 64,
        marginBottom: 16,
    },
    title: {
        fontSize: 28,
        fontWeight: "bold",
        color: colors.text,
        marginBottom: 8,
        textAlign: "center",
    },
    subtitle: {
        fontSize: 14,
        color: colors.textMuted,
        textAlign: "center",
        paddingHorizontal: 20,
    },
    searchInput: {
        backgroundColor: colors.surface,
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        color: colors.text,
        borderWidth: 1,
        borderColor: colors.border,
        marginBottom: 16,
    },
    list: {
        paddingBottom: 100,
    },
    cityCard: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        backgroundColor: colors.surface,
        padding: 16,
        borderRadius: 12,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: colors.border,
    },
    cityCardSelected: {
        backgroundColor: colors.primary + "20",
        borderColor: colors.primary,
    },
    cityText: {
        fontSize: 16,
        color: colors.text,
    },
    cityTextSelected: {
        color: colors.primary,
        fontWeight: "600",
    },
    checkmark: {
        fontSize: 20,
        color: colors.primary,
    },
    continueButton: {
        position: "absolute",
        bottom: 24,
        left: 24,
        right: 24,
        backgroundColor: colors.primary,
    },
});
