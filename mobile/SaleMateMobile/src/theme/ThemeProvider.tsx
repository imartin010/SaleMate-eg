import React, {createContext, useContext, useMemo, useState} from 'react';
import {Appearance} from 'react-native';

type ThemeMode = 'light' | 'dark';

type Theme = {
  mode: ThemeMode;
  colors: {
    background: string;
    card: string;
    text: string;
    primary: string;
    border: string;
    muted: string;
    success: string;
    danger: string;
  };
};

type ThemeContextValue = {
  theme: Theme;
  toggleMode: () => void;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const lightColors = {
  background: '#f9fafb',
  card: '#ffffff',
  text: '#0f172a',
  primary: '#3b82f6',
  border: '#e5e7eb',
  muted: '#6b7280',
  success: '#16a34a',
  danger: '#dc2626',
};

const darkColors = {
  background: '#020617',
  card: '#020617',
  text: '#e5e7eb',
  primary: '#3b82f6',
  border: '#1f2937',
  muted: '#9ca3af',
  success: '#22c55e',
  danger: '#f87171',
};

export const ThemeProvider: React.FC<{children: React.ReactNode}> = ({
  children,
}) => {
  const system = Appearance.getColorScheme();
  const [mode, setMode] = useState<ThemeMode>(system === 'dark' ? 'dark' : 'light');

  const theme = useMemo<Theme>(
    () => ({
      mode,
      colors: mode === 'dark' ? darkColors : lightColors,
    }),
    [mode],
  );

  const value = useMemo(
    () => ({
      theme,
      toggleMode: () =>
        setMode(current => (current === 'dark' ? 'light' : 'dark')),
    }),
    [theme],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return ctx;
}


