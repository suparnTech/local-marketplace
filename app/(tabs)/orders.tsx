import React from "react";
import { Screen } from "../../src/components/layout/Screen";
import { router } from "expo-router";
import { useTheme } from "../../src/theme/useTheme";
import { Text } from "../../src/components/ui/Text";
import { useAppSelector, useAppDispatch } from "../../src/store/hooks";
import {
  clearCart,
  removeOne,
} from "../../src/store/slices/cartSlice";
import { spacing } from "@/src/theme/spacing";
import { Button } from "@/src/components/ui/Button";


export default function OrdersScreen() {
    const items = useAppSelector((s) => s.cart.items);
    const dispatch = useAppDispatch();

  return (
    <Screen>
      <Text variant="heading">Your orders</Text>
      <Text muted style={{ marginTop: 8 }}>
        Once you start ordering from Araria’s stores, they’ll appear here.
      </Text>
      <Button
        title="Go to checkout"
        style={{ marginTop: spacing.md }}
        onPress={() => router.push("/checkout")}
        />

    </Screen>
  );
}
