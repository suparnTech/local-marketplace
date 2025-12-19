import React from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAppSelector } from "../../store/hooks";
import { useTheme } from "../../theme/useTheme";
import { router } from "expo-router";
import { Text } from "./Text";

export function CartButton() {
  const { colors } = useTheme();
  const count = useAppSelector((s) =>
    s.cart.items.reduce((sum, i) => sum + i.quantity, 0)
  );

  if (count === 0) return null; // hide when cart empty

  return (
    <View pointerEvents="box-none" style={styles.container}>
      <TouchableOpacity
        activeOpacity={0.9}
        style={[styles.button, { backgroundColor: colors.overlay }]}
        onPress={() => router.push("/checkout")}
      >
        <Ionicons name="cart-outline" size={20} color={colors.primary} />
        <Text variant="body" style={{ marginLeft: 8 }}>
          Cart · {count} item{count > 1 ? "s" : ""}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 24,
    right: 16,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.4)",
  },
});
