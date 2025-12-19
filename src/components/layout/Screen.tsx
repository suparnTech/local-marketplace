import React, { ReactNode } from "react";
import { View, StyleSheet, StatusBar } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "../../theme/useTheme";

type Props = { children: ReactNode };

export function Screen({ children }: Props) {
  const { colors, scheme } = useTheme();
  return (
    <View style={styles.root}>
      <StatusBar barStyle={scheme === "dark" ? "light-content" : "dark-content"} />
      <LinearGradient
        colors={["#020617", "#0f172a", "#020617"]}
        style={StyleSheet.absoluteFillObject}
      />
      <View style={[styles.content, { paddingTop: 48 }]}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { flex: 1, paddingHorizontal: 16 },
});
