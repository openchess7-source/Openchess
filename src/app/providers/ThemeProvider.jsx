import { createContext, useContext, useEffect, useMemo } from 'react';
import { useLocalStorage } from '../../hooks/useLocalStorage';

const ThemeContext = createContext(null);

function resolveSystemTheme() {
  if (typeof window === 'undefined') return 'dark';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function ThemeProvider({ children }) {
  const [mode, setMode] = useLocalStorage('oc:theme-mode', 'system'); // 'dark' | 'light' | 'system'
  const [density, setDensity] = useLocalStorage('oc:density', 'comfortable'); // 'comfortable' | 'compact'
  const [reducedMotion, setReducedMotion] = useLocalStorage('oc:reduced-motion', false);
  const [animationsEnabled, setAnimationsEnabled] = useLocalStorage('oc:animations', true);

  const resolvedTheme = mode === 'system' ? resolveSystemTheme() : mode;

  useEffect(() => {
    document.documentElement.dataset.theme = resolvedTheme;
  }, [resolvedTheme]);

  useEffect(() => {
    document.documentElement.dataset.density = density;
  }, [density]);

  useEffect(() => {
    document.documentElement.dataset.reducedMotion = String(reducedMotion);
  }, [reducedMotion]);

  const value = useMemo(
    () => ({
      mode,
      setMode,
      resolvedTheme,
      density,
      setDensity,
      reducedMotion,
      setReducedMotion,
      animationsEnabled,
      setAnimationsEnabled,
    }),
    [mode, resolvedTheme, density, reducedMotion, animationsEnabled]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
