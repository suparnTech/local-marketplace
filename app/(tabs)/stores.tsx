import React, { useEffect, useState } from "react";
import { View, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Screen } from "../../src/components/layout/Screen";
import { Text } from "../../src/components/ui/Text";
import { Card } from "../../src/components/ui/Card";
import { useTheme } from "../../src/theme/useTheme";
import { api } from "../../src/lib/api";
import { CartButton } from "../../src/components/ui/CartButton";


// const MOCK_STORES = [
//   {
//     id: "1",
//     name: "Mishra Kirana Store",
//     category: "grocery",
//     address: "Ward 5, Main Road",
//     tags: ["Fast delivery", "Low minimum"],
//   },
//   {
//     id: "2",
//     name: "City Care Pharmacy",
//     category: "pharmacy",
//     address: "Hospital Road",
//     tags: ["24x7", "Verified"],
//   },
//   {
//     id: "3",
//     name: "Trendy Wear Corner",
//     category: "clothing",
//     address: "Bus Stand Market",
//     tags: ["Budget fashion"],
//   },
// ];

const CATEGORY_LABELS: Record<string, string> = {
  grocery: "Grocery",
  pharmacy: "Medicine",
  clothing: "Clothing",
};

type Store = {
  id: number;
  name: string;
  address: string;
  city: string;
  pincode: string;
  category: "GROCERY" | "PHARMACY" | "CLOTHING";
};

export default function StoresScreen() {
  const params = useLocalSearchParams();
  const categoryParam = (params.category as string) || "grocery";
  const { spacing, colors } = useTheme();

  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const categoryEnum =
    categoryParam === "pharmacy"
      ? "PHARMACY"
      : categoryParam === "clothing"
      ? "CLOTHING"
      : "GROCERY";

      useEffect(() => {
    let cancelled = false;
    const fetchStores = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await api.get<Store[]>("/stores", {
          params: { city: "Araria", category: categoryEnum },
        });
        console.log("resss", res);
        
        if (!cancelled) setStores(res.data);
      } catch (e) {
        console.error("fetch stores error", e);
        if (!cancelled) setError("Failed to load stores. Pull to refresh.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchStores();
    return () => {
      cancelled = true;
    };
  }, [categoryEnum]);


    return (
    <Screen>
      <View style={styles.header}>
        <Text variant="small" muted>
          Category
        </Text>
        <Text variant="heading">
          {CATEGORY_LABELS[categoryParam] || "Stores"} in Araria
        </Text>
        <Text muted style={{ marginTop: 4 }}>
          Nearby local shops you can order from.
        </Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
          <Text muted style={{ marginTop: 8 }}>
            Loading stores...
          </Text>
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text muted>{error}</Text>
        </View>
      ) : stores.length === 0 ? (
        <View style={styles.center}>
          <Text>No stores found in this category yet.</Text>
        </View>
      ) : (
        <FlatList
          data={stores}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{ paddingBottom: spacing.xxl }}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() =>
                router.push({
                  pathname: "/store/[id]",
                  params: { id: item.id },
                })
              }
            >
              <Card style={styles.storeCard}>
                <Text variant="subheading">{item.name}</Text>
                <Text variant="small" muted style={{ marginTop: 4 }}>
                  {item.address}
                </Text>
              </Card>
            </TouchableOpacity>
          )}
        />
      )}

      <CartButton />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    marginBottom: 16,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  storeCard: {
    marginBottom: 12,
  },
});

