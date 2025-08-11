import React, { createContext, useContext } from 'react';

export type ThemeMode = 'system' | 'light' | 'dark';

export interface ThemeContextValue {
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  isDarkMode: boolean;
}

const defaultValue: ThemeContextValue = {
  themeMode: 'system',
  setThemeMode: () => {},
  isDarkMode: false,
};

export const ThemeContext = createContext<ThemeContextValue>(defaultValue);

export function useAppTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}

