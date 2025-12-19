import React from "react";
import { View, StyleSheet, FlatList, TouchableOpacity } from "react-native";
import { Screen } from "../../src/components/layout/Screen";
import { Text } from "../../src/components/ui/Text";
import { Card } from "../../src/components/ui/Card";
import { Button } from "../../src/components/ui/Button";
import { useTheme } from "../../src/theme/useTheme";
import { Link } from "expo-router";

const categories = [
  { id: "grocery", label: "Grocery", subtitle: "Daily essentials" },
  { id: "pharmacy", label: "Medicine", subtitle: "Chemists nearby" },
  { id: "clothing", label: "Clothing", subtitle: "Local fashion" },
];

export default function HomeScreen() {
  const { spacing } = useTheme();

  return (
    <Screen>
      <View style={styles.header}>
        <Text variant="small" muted>
          City
        </Text>
        <Text variant="heading">Araria</Text>
        <Text variant="body" muted>
          Sab kuch, yahin se.
        </Text>
      </View>

      <Card style={styles.heroCard}>
        <Text variant="heading">Order from local shops</Text>
        <Text muted style={{ marginTop: 4 }}>
          Groceries, medicines, and clothes from trusted stores in your area.
        </Text>
        <Button
          title="Start shopping"
          style={{ marginTop: spacing.md }}
        />
      </Card>

      <Text variant="subheading" style={{ marginTop: spacing.lg, marginBottom: spacing.sm }}>
        Categories
      </Text>

      <FlatList
        data={categories}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingVertical: spacing.sm }}
        renderItem={({ item }) => (
          <Link
            href={{
              pathname: "/(tabs)/stores",
              params: { category: item.id },
            }}
            asChild
          >
            <TouchableOpacity style={styles.categoryCard}>
              <Text variant="body">{item.label}</Text>
              <Text variant="small" muted style={{ marginTop: 4 }}>
                {item.subtitle}
              </Text>
            </TouchableOpacity>
          </Link>
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    marginBottom: 16,
  },
  heroCard: {
    marginTop: 8,
  },
  categoryCard: {
    borderRadius: 16,
    padding: 16,
    marginRight: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "rgba(15,23,42,0.8)",
    minWidth: 140,
  },
});
