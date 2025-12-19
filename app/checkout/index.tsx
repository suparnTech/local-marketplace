import React, { useMemo, useState } from "react";
import { View, StyleSheet, TextInput, TouchableOpacity } from "react-native";
import { Screen } from "../../src/components/layout/Screen";
import { Text } from "../../src/components/ui/Text";
import { Button } from "../../src/components/ui/Button";
import { Card } from "../../src/components/ui/Card";
import { useTheme } from "../../src/theme/useTheme";
import { useAppSelector } from "../../src/store/hooks";

type OrderType = "DELIVERY" | "PICKUP";

export default function CheckoutScreen() {
  const { colors, spacing } = useTheme();
  const items = useAppSelector((s) => s.cart.items);

  const [orderType, setOrderType] = useState<OrderType>("DELIVERY");
  const [address, setAddress] = useState("");
  const [landmark, setLandmark] = useState("");

  const itemsTotal = useMemo(
    () => items.reduce((sum, i) => sum + i.price * i.quantity, 0),
    [items]
  );
  const deliveryFee = orderType === "DELIVERY" ? 20 : 0;
  const platformFee = 3; // placeholder
  const grandTotal = itemsTotal + deliveryFee + platformFee;

  return (
    <Screen>
      <Text variant="heading">Checkout</Text>

      <Text variant="subheading" style={{ marginTop: spacing.md }}>
        Order type
      </Text>
      <View style={styles.segmentRow}>
        <TouchableOpacity
          style={[
            styles.segment,
            {
              backgroundColor:
                orderType === "DELIVERY" ? colors.primarySoft : colors.surfaceSoft,
            },
          ]}
          onPress={() => setOrderType("DELIVERY")}
        >
          <Text
            variant="body"
            muted={orderType !== "DELIVERY"}
          >
            Delivery
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.segment,
            {
              backgroundColor:
                orderType === "PICKUP" ? colors.primarySoft : colors.surfaceSoft,
            },
          ]}
          onPress={() => setOrderType("PICKUP")}
        >
          <Text
            variant="body"
            muted={orderType !== "PICKUP"}
          >
            Pickup
          </Text>
        </TouchableOpacity>
      </View>

      {orderType === "DELIVERY" && (
        <>
          <Text variant="subheading" style={{ marginTop: spacing.md }}>
            Delivery address
          </Text>
          <Card style={{ marginTop: spacing.sm }}>
            <TextInput
              placeholder="House / Flat / Street"
              placeholderTextColor={colors.textMuted}
              style={[styles.input, { color: colors.text }]}
              value={address}
              onChangeText={setAddress}
              multiline
            />
            <TextInput
              placeholder="Nearby landmark (optional)"
              placeholderTextColor={colors.textMuted}
              style={[styles.input, { color: colors.text, marginTop: 8 }]}
              value={landmark}
              onChangeText={setLandmark}
            />
          </Card>
        </>
      )}

      <Text variant="subheading" style={{ marginTop: spacing.lg }}>
        Order summary
      </Text>
      <Card style={{ marginTop: spacing.sm }}>
        {items.length === 0 ? (
          <Text muted>No items in cart.</Text>
        ) : (
          <>
            {items.map((item) => (
              <View key={item.id} style={styles.summaryRow}>
                <Text>{item.name} × {item.quantity}</Text>
                <Text>₹{item.price * item.quantity}</Text>
              </View>
            ))}
            <View style={styles.summaryRow}>
              <Text muted>Items total</Text>
              <Text>₹{itemsTotal}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text muted>Delivery fee</Text>
              <Text>₹{deliveryFee}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text muted>Platform fee</Text>
              <Text>₹{platformFee}</Text>
            </View>
            <View style={[styles.summaryRow, { marginTop: 4 }]}>
              <Text variant="subheading">To pay</Text>
              <Text variant="subheading">₹{grandTotal}</Text>
            </View>
          </>
        )}
      </Card>

      <Button
        title="Place order (dummy)"
        style={{ marginTop: spacing.lg }}
        onPress={() => {
          // later we will call backend /orders
          console.log("Place order stub");
        }}
        disabled={items.length === 0}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  segmentRow: {
    flexDirection: "row",
    marginTop: 8,
    gap: 8,
  },
  segment: {
    flex: 1,
    borderRadius: 999,
    paddingVertical: 10,
    alignItems: "center",
  },
  input: {
    fontSize: 14,
    paddingVertical: 4,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 6,
  },
});
