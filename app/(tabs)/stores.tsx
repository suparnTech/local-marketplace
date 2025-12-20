// app/(tabs)/stores.tsx - Stores Screen (Hidden from tab bar)
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, StyleSheet, TouchableOpacity, View } from "react-native";
import { Screen } from "../../src/components/layout/Screen";
import { Card } from "../../src/components/ui/Card";
import { CartButton } from "../../src/components/ui/CartButton";
import { Text } from "../../src/components/ui/Text";
import { api } from "../../src/lib/api";
import { colors } from "../../src/theme/colors";

export default function StoresScreen() {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStores();
  }, []);

  const fetchStores = async () => {
    try {
      const response = await api.get("/stores");
      setStores(response.data);
    } catch (error) {
      console.error("Failed to fetch stores:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <View style={styles.container}>
        <Text variant="heading">Stores</Text>
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator color={colors.primary} />
            <Text muted style={{ marginTop: 8 }}>
              Loading stores...
            </Text>
          </View>
        ) : (
          <FlatList
            data={stores}
            keyExtractor={(item: any) => item.id}
            renderItem={({ item }: any) => (
              <TouchableOpacity onPress={() => router.push(`/store/${item.id}` as any)}>
                <Card>
                  <Text variant="subheading">{item.name}</Text>
                  <Text muted>{item.address}</Text>
                </Card>
              </TouchableOpacity>
            )}
          />
        )}
      </View>
      <CartButton />
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
