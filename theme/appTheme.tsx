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
  background: '#f3f5f8',
  surface: '#ffffff',
  surfaceMuted: '#f8fafc',
  surfaceAccent: '#faf5ff',
  text: '#0f172a',
  textMuted: '#475569',
  textOnHero: '#f8fafc',
  hero: '#0f172a',
  heroMuted: '#cbd5e1',
  border: '#dbe3ee',
  primary: '#2563eb',
  primarySoft: '#eff6ff',
  success: '#15803d',
  successSoft: '#dcfce7',
  danger: '#b91c1c',
  dangerSoft: '#fef2f2',
  warning: '#7c3aed',
  warningSoft: '#f3e8ff',
  info: '#0369a1',
  infoSoft: '#e0f2fe',
};

const darkPalette: AppPalette = {
  mode: 'dark',
  background: '#020617',
  surface: '#0f172a',
  surfaceMuted: '#111827',
  surfaceAccent: '#2e1065',
  text: '#e2e8f0',
  textMuted: '#94a3b8',
  textOnHero: '#f8fafc',
  hero: '#111827',
  heroMuted: '#93c5fd',
  border: '#1e293b',
  primary: '#60a5fa',
  primarySoft: '#172554',
  success: '#4ade80',
  successSoft: '#14532d',
  danger: '#f87171',
  dangerSoft: '#450a0a',
  warning: '#c084fc',
  warningSoft: '#3b0764',
  info: '#38bdf8',
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
