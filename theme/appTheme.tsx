import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';

type ThemeMode = 'light' | 'dark';

const THEME_STORAGE_KEY = 'dividamos-cta-theme-mode';

export type AppPalette = {
  mode: 'light' | 'dark';
  background: string;
  surface: string;
  surfaceMuted: string;
  surfaceAccent: string;
  text: string;
  textMuted: string;
  textOnHero: string;
  hero: string;
  heroMuted: string;
  border: string;
  primary: string;
  primarySoft: string;
  success: string;
  successSoft: string;
  danger: string;
  dangerSoft: string;
  warning: string;
  warningSoft: string;
  info: string;
  infoSoft: string;
};

const lightPalette: AppPalette = {
  mode: 'light',
  background: '#fafafa',
  surface: '#ffffff',
  surfaceMuted: '#f8fafc',
  surfaceAccent: '#fef3e2',
  text: '#171717',
  textMuted: '#737373',
  textOnHero: '#f8fafc',
  hero: '#0a0a0a',
  heroMuted: '#e85d04',
  border: '#e5e5e5',
  primary: '#e85d04',
  primarySoft: '#fef3e2',
  success: '#15803d',
  successSoft: '#dcfce7',
  danger: '#ef4444',
  dangerSoft: '#fef2f2',
  warning: '#e85d04',
  warningSoft: '#fef3e2',
  info: '#0369a1',
  infoSoft: '#e0f2fe',
};

const darkPalette: AppPalette = {
  mode: 'dark',
  background: '#0a0a0a',
  surface: '#141414',
  surfaceMuted: '#1a1a1a',
  surfaceAccent: '#1e1e1e',
  text: '#ededed',
  textMuted: '#a1a1aa',
  textOnHero: '#f8fafc',
  hero: '#141414',
  heroMuted: '#e85d04',
  border: '#262626',
  primary: '#e85d04',
  primarySoft: '#2d1f0a',
  success: '#4ade80',
  successSoft: '#14532d',
  danger: '#ef4444',
  dangerSoft: '#450a0a',
  warning: '#e85d04',
  warningSoft: '#2d1f0a',
  info: '#4a90d9',
  infoSoft: '#082f49',
};

type ThemeContextValue = {
  colors: AppPalette;
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  cycleMode: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [mode, setMode] = useState<ThemeMode>(systemScheme === 'dark' ? 'dark' : 'light');
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const loadStoredMode = async () => {
      try {
        const storedMode = await AsyncStorage.getItem(THEME_STORAGE_KEY);

        if (storedMode === 'light' || storedMode === 'dark') {
          setMode(storedMode);
        } else {
          setMode(systemScheme === 'dark' ? 'dark' : 'light');
        }
      } finally {
        setIsHydrated(true);
      }
    };

    loadStoredMode();
  }, [systemScheme]);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
  }, [isHydrated, mode]);

  const value = useMemo<ThemeContextValue>(() => ({
    colors: mode === 'dark' ? darkPalette : lightPalette,
    mode,
    setMode,
    cycleMode: () => {
      setMode(currentMode => (currentMode === 'light' ? 'dark' : 'light'));
    },
  }), [mode]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useAppTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error('useAppTheme must be used within ThemeProvider');
  }

  return context;
}
