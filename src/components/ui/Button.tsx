import React from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  TouchableOpacityProps,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "../../theme/useTheme";

type Props = TouchableOpacityProps & {
  title: string;
  variant?: "primary" | "ghost";
};

export function Button({ title, variant = "primary", style, ...rest }: Props) {
  const { colors } = useTheme();

  if (variant === "ghost") {
    return (
      <TouchableOpacity
        style={[styles.base, styles.ghost, { borderColor: colors.primary }, style]}
        activeOpacity={0.7}
        {...rest}
      >
        <Text style={[styles.text, { color: colors.primary }]}>{title}</Text>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity style={[styles.base, style]} activeOpacity={0.8} {...rest}>
      <LinearGradient
        colors={[colors.primary, colors.accentSoft]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <Text style={[styles.text, { color: "#020617" }]}>{title}</Text>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 999,
    overflow: "hidden",
  },
  gradient: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    fontWeight: "600",
    fontSize: 15,
  },
  ghost: {
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 18,
    alignItems: "center",
    justifyContent: "center",
  },
});
