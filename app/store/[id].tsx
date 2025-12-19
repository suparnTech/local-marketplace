import React, { useEffect, useState } from "react";
import { View, StyleSheet, FlatList } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { Screen } from "../../src/components/layout/Screen";
import { Text } from "../../src/components/ui/Text";
import { Card } from "../../src/components/ui/Card";
import { Button } from "../../src/components/ui/Button";
import { useTheme } from "../../src/theme/useTheme";
import { useAppDispatch } from "../../src/store/hooks";
import { addItem } from "../../src/store/slices/cartSlice";
import { api } from "../../src/lib/api";
import { CartButton } from "../../src/components/ui/CartButton";



const MOCK_STORE = {
  id: "1",
  name: "Mishra Kirana Store",
  address: "Ward 5, Main Road, Araria",
  description: "Trusted kirana for daily essentials in your mohalla.",
  deliveryAvailable: true,
  pickupAvailable: true,
};

const MOCK_PRODUCTS = [
  { id: "p1", name: "Aashirvaad Atta 5kg", unit: "bag", price: 260 },
  { id: "p2", name: "Fortune Oil 1L", unit: "bottle", price: 140 },
  { id: "p3", name: "Amul Taaza 1L", unit: "pack", price: 72 },
];
const store = {
  name: "Store",
  address: "Araria",
  description: "Local shop",
  deliveryAvailable: true,
  pickupAvailable: true,
};

type Product = {
  id: number;
  name: string;
  unit: string;
  price: number; // from SELECT app_price AS price
};

export default function StoreDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const storeId = Number(id);
  const { spacing, colors } = useTheme();
  const dispatch = useAppDispatch();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

    useEffect(() => {
    let cancelled = false;
    const fetchProducts = async () => {
      if (!storeId || Number.isNaN(storeId)) return;
      try {
        setLoading(true);
        setError(null);
        const res = await api.get<Product[]>(`/stores/${storeId}/products`);
        if (!cancelled) setProducts(res.data);
      } catch (e) {
        console.error("fetch products error", e);
        if (!cancelled) setError("Failed to load products.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchProducts();
    return () => {
      cancelled = true;
    };
  }, [storeId]);


  // Later we’ll fetch by id; for now always MOCK_STORE
  const store = MOCK_STORE;

    return (
    <Screen>
      <Card style={styles.headerCard}>
        <Text variant="heading">{store.name}</Text>
        <Text variant="small" muted style={{ marginTop: 4 }}>
          {store.address}
        </Text>
        <Text variant="body" muted style={{ marginTop: 8 }}>
          {store.description}
        </Text>
      </Card>

      <View style={{ marginTop: spacing.lg, marginBottom: spacing.sm }}>
        <Text variant="subheading">Products</Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <Text muted>Loading products...</Text>
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text muted>{error}</Text>
        </View>
      ) : products.length === 0 ? (
        <View style={styles.center}>
          <Text>No products yet.</Text>
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{ paddingBottom: spacing.xxl }}
          renderItem={({ item }) => (
            <Card style={styles.productCard}>
              <View style={{ flex: 1 }}>
                <Text>{item.name}</Text>
                <Text variant="small" muted style={{ marginTop: 4 }}>
                  {item.unit}
                </Text>
                <Text variant="body" style={{ marginTop: 4 }}>
                  ₹{item.price}
                </Text>
              </View>
              <Button
                title="Add"
                style={styles.addButton}
                onPress={() =>
                  dispatch(
                    addItem({
                      id: String(item.id),
                      name: item.name,
                      price: item.price,
                    })
                  )
                }
              />
            </Card>
          )}
        />
      )}

      <CartButton />
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerCard: {
    marginBottom: 16,
  },
  center: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
  productCard: {
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
  },
  addButton: {
    marginLeft: 12,
    minWidth: 80,
  },
});