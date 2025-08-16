import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

export type Accent = 'blue' | 'purple' | 'emerald' | 'rose' | 'amber';
export type Radius = 'sm' | 'md' | 'lg' | 'xl';
export type Density = 'comfortable' | 'compact';

export type Appearance = {
  accent: Accent;
  radius: Radius;
  density: Density;
  flair: boolean; // background gradient flair
};

const DEFAULT_APPEARANCE: Appearance = {
  accent: 'blue',
  radius: 'lg',
  density: 'comfortable',
  flair: true,
};

const STORAGE_KEY = 'music-connect-appearance';

type Ctx = {
  appearance: Appearance;
  setAppearance: (next: Partial<Appearance>) => void;
  reset: () => void;
};

const AppearanceContext = createContext<Ctx | undefined>(undefined);

function applyAppearance(appearance: Appearance) {
  const root = document.documentElement;
  // Accent palettes -> CSS vars used in index.css
  const palette: Record<Accent, { primary: string; ring: string; chart1: string }>
    = {
      blue: { primary: 'oklch(0.6 0.118 184.704)', ring: 'oklch(0.709 0.01 56.259)', chart1: 'oklch(0.646 0.222 41.116)' },
      purple: { primary: 'oklch(0.627 0.265 303.9)', ring: 'oklch(0.709 0.01 56.259)', chart1: 'oklch(0.488 0.243 264.376)' },
      emerald: { primary: 'oklch(0.769 0.188 70.08)', ring: 'oklch(0.709 0.01 56.259)', chart1: 'oklch(0.769 0.188 70.08)' },
      rose: { primary: 'oklch(0.704 0.191 22.216)', ring: 'oklch(0.709 0.01 56.259)', chart1: 'oklch(0.645 0.246 16.439)' },
      amber: { primary: 'oklch(0.828 0.189 84.429)', ring: 'oklch(0.709 0.01 56.259)', chart1: 'oklch(0.828 0.189 84.429)' },
    };
  const sel = palette[appearance.accent];
  root.style.setProperty('--primary', sel.primary);
  root.style.setProperty('--ring', sel.ring);
  root.style.setProperty('--chart-1', sel.chart1);

  // Radius
  const radiusMap: Record<Radius, string> = {
    sm: '0.375rem',
    md: '0.5rem',
    lg: '0.625rem',
    xl: '0.875rem',
  };
  root.style.setProperty('--radius', radiusMap[appearance.radius]);

  // Density -> a utility variable for paddings (opt-in components may use it)
  root.style.setProperty('--control-py', appearance.density === 'compact' ? '0.5rem' : '0.75rem');

  // Flair -> data attribute for background styles
  if (appearance.flair) {
    root.setAttribute('data-flair', 'on');
  } else {
    root.removeAttribute('data-flair');
  }
}

export function AppearanceProvider({ children }: { children: React.ReactNode }) {
  const [appearance, setAppearanceState] = useState<Appearance>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? { ...DEFAULT_APPEARANCE, ...JSON.parse(raw) } as Appearance : DEFAULT_APPEARANCE;
    } catch {
      return DEFAULT_APPEARANCE;
    }
  });

  useEffect(() => {
    applyAppearance(appearance);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(appearance)); } catch {}
  }, [appearance]);

  const ctx = useMemo<Ctx>(() => ({
    appearance,
    setAppearance: (next) => setAppearanceState((prev) => ({ ...prev, ...next })),
    reset: () => setAppearanceState(DEFAULT_APPEARANCE),
  }), [appearance]);

  return (
    <AppearanceContext.Provider value={ctx}>
      {children}
    </AppearanceContext.Provider>
  );
}

export function useAppearance() {
  const ctx = useContext(AppearanceContext);
  if (!ctx) throw new Error('useAppearance must be used within AppearanceProvider');
  return ctx;
}
