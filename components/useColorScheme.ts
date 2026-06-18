import { useTheme } from "@/context/ThemeProvider";

export function useColorScheme() {
  const { colorScheme } = useTheme();
  return colorScheme;
}
