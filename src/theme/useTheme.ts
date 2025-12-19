// src/theme/useTheme.ts
import { useColorScheme } from "react-native";
import { lightColors, darkColors } from "./colors";
import { typography } from "./typography";
import { spacing } from "./spacing";

export function useTheme() {
  const scheme = useColorScheme();
  const colors = scheme === "dark" ? darkColors : lightColors;
  return { colors, typography, spacing, scheme };
}
