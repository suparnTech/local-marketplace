import React, { ReactNode } from "react";
import { View, StyleSheet, ViewProps } from "react-native";
import { useTheme } from "../../theme/useTheme";

type Props = ViewProps & { children: ReactNode };

export function Card({ children, style, ...rest }: Props) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
        },
        style,
      ]}
      {...rest}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
  },
});
