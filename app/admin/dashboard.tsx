// app/admin/dashboard.tsx
import axios from "axios";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, RefreshControl, ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { Text } from "../../src/components/ui/Text";
import { useAuth } from "../../src/contexts/AuthContext";
import { colors } from "../../src/theme/colors";

const API_URL = "http://localhost:4000";

interface PendingVendor {
    id: string;
    name: string;
    email: string;
    phone: string;
    created_at: string;
}

export default function AdminDashboard() {
    const { user, logout, token } = useAuth();
    const [pendingVendors, setPendingVendors] = useState<PendingVendor[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        if (token) {
            loadPendingVendors();
        }
    }, [token]);

    const loadPendingVendors = async () => {
        try {
            const response = await axios.get(`${API_URL}/admin/pending-vendors`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setPendingVendors(response.data);
        } catch (error) {
            console.error("Load vendors error:", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleApprove = async (vendorId: string) => {
        try {
            await axios.post(`${API_URL}/admin/approve-vendor/${vendorId}`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            loadPendingVendors();
        } catch (error) {
            console.error("Approve error:", error);
        }
    };

    const handleReject = async (vendorId: string) => {
        try {
            await axios.post(`${API_URL}/admin/reject-vendor/${vendorId}`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            loadPendingVendors();
        } catch (error) {
            console.error("Reject error:", error);
        }
    };

    const renderVendorCard = ({ item }: { item: PendingVendor }) => (
        <View style={styles.vendorCard}>
            <View style={styles.vendorInfo}>
                <Text style={styles.vendorName}>{item.name}</Text>
                <Text style={styles.vendorEmail}>{item.email}</Text>
                {item.phone && <Text style={styles.vendorPhone}>{item.phone}</Text>}
                <Text style={styles.vendorDate}>
                    Applied: {new Date(item.created_at).toLocaleDateString()}
                </Text>
            </View>
            <View style={styles.actions}>
                <TouchableOpacity
                    style={[styles.actionButton, styles.approveButton]}
                    onPress={() => handleApprove(item.id)}
                >
                    <Text style={styles.actionButtonText}>✓ Approve</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.actionButton, styles.rejectButton]}
                    onPress={() => handleReject(item.id)}
                >
                    <Text style={styles.actionButtonText}>✗ Reject</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    if (loading) {
        return (
            <LinearGradient colors={["#0F172A", "#1E293B"]} style={styles.container}>
                <ActivityIndicator size="large" color={colors.primary} />
            </LinearGradient>
        );
    }

    return (
        <LinearGradient colors={["#0F172A", "#1E293B"]} style={styles.container}>
            <ScrollView
                style={styles.scrollView}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={() => {
                        setRefreshing(true);
                        loadPendingVendors();
                    }} />
                }
            >
                {/* Header */}
                <View style={styles.header}>
                    <View>
                        <Text style={styles.greeting}>Admin Dashboard</Text>
                        <Text style={styles.subGreeting}>Welcome, {user?.name}</Text>
                    </View>
                    <TouchableOpacity onPress={logout} style={styles.logoutButton}>
                        <Text style={styles.logoutText}>Logout</Text>
                    </TouchableOpacity>
                </View>

                {/* Stats */}
                <View style={styles.statsContainer}>
                    <View style={styles.statCard}>
                        <Text style={styles.statNumber}>{pendingVendors.length}</Text>
                        <Text style={styles.statLabel}>Pending Approvals</Text>
                    </View>
                </View>

                {/* Pending Vendors */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Pending Vendor Approvals</Text>
                    {pendingVendors.length === 0 ? (
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyIcon}>✓</Text>
                            <Text style={styles.emptyText}>No pending approvals</Text>
                        </View>
                    ) : (
                        <FlatList
                            data={pendingVendors}
                            renderItem={renderVendorCard}
                            keyExtractor={(item) => item.id}
                            scrollEnabled={false}
                        />
                    )}
                </View>

                {/* Quick Actions */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Quick Actions</Text>
                    <TouchableOpacity
                        style={styles.quickAction}
                        onPress={() => router.push("/admin/users" as any)}
                    >
                        <Text style={styles.quickActionIcon}>👥</Text>
                        <Text style={styles.quickActionText}>Manage Users</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.quickAction}
                        onPress={() => router.push("/admin/stores" as any)}
                    >
                        <Text style={styles.quickActionIcon}>🏪</Text>
                        <Text style={styles.quickActionText}>Manage Stores</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        padding: 24,
        paddingTop: 60,
    },
    greeting: {
        fontSize: 28,
        fontWeight: "bold",
        color: colors.text,
    },
    subGreeting: {
        fontSize: 16,
        color: colors.textMuted,
        marginTop: 4,
    },
    logoutButton: {
        backgroundColor: colors.surface,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
    },
    logoutText: {
        color: colors.error,
        fontWeight: "600",
    },
    statsContainer: {
        paddingHorizontal: 24,
        marginBottom: 24,
    },
    statCard: {
        backgroundColor: colors.surface,
        padding: 20,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: colors.border,
    },
    statNumber: {
        fontSize: 36,
        fontWeight: "bold",
        color: colors.primary,
    },
    statLabel: {
        fontSize: 14,
        color: colors.textMuted,
        marginTop: 4,
    },
    section: {
        paddingHorizontal: 24,
        marginBottom: 32,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: "bold",
        color: colors.text,
        marginBottom: 16,
    },
    vendorCard: {
        backgroundColor: colors.surface,
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: colors.border,
    },
    vendorInfo: {
        marginBottom: 12,
    },
    vendorName: {
        fontSize: 18,
        fontWeight: "bold",
        color: colors.text,
        marginBottom: 4,
    },
    vendorEmail: {
        fontSize: 14,
        color: colors.textMuted,
        marginBottom: 2,
    },
    vendorPhone: {
        fontSize: 14,
        color: colors.textMuted,
        marginBottom: 2,
    },
    vendorDate: {
        fontSize: 12,
        color: colors.textMuted,
        marginTop: 4,
    },
    actions: {
        flexDirection: "row",
        gap: 8,
    },
    actionButton: {
        flex: 1,
        padding: 12,
        borderRadius: 8,
        alignItems: "center",
    },
    approveButton: {
        backgroundColor: colors.success,
    },
    rejectButton: {
        backgroundColor: colors.error,
    },
    actionButtonText: {
        color: colors.text,
        fontWeight: "600",
        fontSize: 14,
    },
    emptyState: {
        alignItems: "center",
        padding: 40,
    },
    emptyIcon: {
        fontSize: 48,
        marginBottom: 16,
    },
    emptyText: {
        fontSize: 16,
        color: colors.textMuted,
    },
    quickAction: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: colors.surface,
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: colors.border,
    },
    quickActionIcon: {
        fontSize: 24,
        marginRight: 12,
    },
    quickActionText: {
        fontSize: 16,
        fontWeight: "600",
        color: colors.text,
    },
});
