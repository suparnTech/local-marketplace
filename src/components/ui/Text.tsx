import React from "react";
import { Text as RNText, TextProps, StyleSheet } from "react-native";
import { useTheme } from "../../theme/useTheme";

type Props = TextProps & {
  variant?: "heading" | "subheading" | "body" | "small";
  muted?: boolean;
};

export function Text({ variant = "body", muted, style, ...rest }: Props) {
  const { colors, typography } = useTheme();

  const fontSize =
    variant === "heading"
      ? typography.heading
      : variant === "subheading"
      ? typography.subheading
      : variant === "small"
      ? typography.small
      : typography.body;

  return (
    <RNText
      style={[
        styles.base,
        {
          color: muted ? colors.textMuted : colors.text,
          fontSize,
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
