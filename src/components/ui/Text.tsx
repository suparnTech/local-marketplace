import React from "react";
import { Text as RNText, StyleSheet, TextProps } from "react-native";
import { colors } from "../../theme/colors";

type Props = TextProps & {
  variant?: "heading" | "subheading" | "body" | "small";
  muted?: boolean;
};

export function Text({ variant = "body", muted, style, ...rest }: Props) {

  const fontSize =
    variant === "heading"
      ? 24
      : variant === "subheading"
        ? 18
        : variant === "small"
          ? 12
          : 14;

  const fontWeight =
    variant === "heading"
      ? "bold"
      : variant === "subheading"
        ? "600"
        : "normal";

  return (
    <RNText
      style={[
        styles.base,
        {
          color: muted ? colors.textMuted : colors.text,
          fontSize,
          fontWeight: fontWeight as any,
        },
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  base: {
    fontFamily: "System",
  },
});
