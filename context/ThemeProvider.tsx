import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme as useSystemColorScheme } from 'react-native';

type ThemeMode = 'light' | 'dark' | 'system';
type ResolvedTheme = 'light' | 'dark';

interface ThemeContextType {
  themeMode: ThemeMode;
  colorScheme: ResolvedTheme;
  setThemeMode: (mode: ThemeMode) => void;
  gradientEnabled: boolean;
  setGradientEnabled: (enabled: boolean) => void;
}

const THEME_STORAGE_KEY = '@app_theme_mode';
const GRADIENT_STORAGE_KEY = '@app_gradient_enabled';

const ThemeContext = createContext<ThemeContextType>({
  themeMode: 'system',
  colorScheme: 'light',
  setThemeMode: () => {},
  gradientEnabled: false,
  setGradientEnabled: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemColorScheme = useSystemColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');
  const [gradientEnabled, setGradientEnabledState] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    Promise.all([
      AsyncStorage.getItem(THEME_STORAGE_KEY),
      AsyncStorage.getItem(GRADIENT_STORAGE_KEY),
    ]).then(([storedTheme, storedGradient]) => {
      if (storedTheme === 'light' || storedTheme === 'dark' || storedTheme === 'system') {
        setThemeModeState(storedTheme);
      }

      if (storedGradient === 'true') setGradientEnabledState(true);
      if (storedGradient === 'false') setGradientEnabledState(false);

      setIsLoaded(true);
    });
  }, []);

  const setThemeMode = (mode: ThemeMode) => {
    setThemeModeState(mode);
    AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
  };

  const setGradientEnabled = (enabled: boolean) => {
    setGradientEnabledState(enabled);
    AsyncStorage.setItem(GRADIENT_STORAGE_KEY, enabled ? 'true' : 'false');
  };

  const colorScheme: ResolvedTheme =
    themeMode === 'system' ? (systemColorScheme ?? 'light') : themeMode;

  if (!isLoaded) return null;

  return (
    <ThemeContext.Provider
      value={{ themeMode, colorScheme, setThemeMode, gradientEnabled, setGradientEnabled }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
