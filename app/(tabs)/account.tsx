import React from "react";
import { Screen } from "../../src/components/layout/Screen";
import { Text } from "../../src/components/ui/Text";
import { Button } from "../../src/components/ui/Button";
import { View } from "react-native";

export default function AccountScreen() {
  return (
    <Screen>
      <Text variant="heading">Account</Text>
      <Text muted style={{ marginTop: 8 }}>
        Login, language and app settings will come here.
      </Text>
      <View style={{ marginTop: 24 }}>
        <Button title="Login / Manage profile" />
      </View>
    </Screen>
  );
}
