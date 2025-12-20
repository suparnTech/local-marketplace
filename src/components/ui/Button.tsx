import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity
} from "react-native";
import { useTheme } from "../../theme/useTheme";

type ButtonProps = {
  title: string;
  onPress?: () => void;
  variant?: "primary" | "ghost" | "outline";
  disabled?: boolean;
  style?: any;
};

export function Button({ title, variant = "primary", style, ...rest }: ButtonProps) {
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

  if (variant === "outline") {
    return (
      <TouchableOpacity
        style={[styles.base, styles.ghost, style]}
        activeOpacity={0.7}
        {...rest}
      >
        <Text style={[styles.text, { color: "#fff" }]}>{title}</Text>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity style={[styles.base, style]} activeOpacity={0.8} {...rest}>
      <LinearGradient
        colors={["#8B5CF6", "#06B6D4"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <Text style={[styles.text, { color: "#fff" }]}>{title}</Text>
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
