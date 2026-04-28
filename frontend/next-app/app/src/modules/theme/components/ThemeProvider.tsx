"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type ReactNode,
} from "react";

type ThemeMode = "light" | "dark";

type ThemeWave = {
  key: number;
  x: number;
  y: number;
  color: string;
} | null;

type ThemeContextValue = {
  theme: ThemeMode;
  hydrated: boolean;
  toggleTheme: (origin?: { x: number; y: number }) => void;
};

const THEME_STORAGE_KEY = "app-theme";
const ThemeContext = createContext<ThemeContextValue | null>(null);
const subscribeHydration = () => () => undefined;

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<ThemeMode>(() => getStoredTheme());
  const hydrated = useSyncExternalStore(subscribeHydration, () => true, () => false);
  const [wave, setWave] = useState<ThemeWave>(null);
  const waveTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    applyTheme(theme);

    return () => {
      if (waveTimeoutRef.current) {
        window.clearTimeout(waveTimeoutRef.current);
      }
    };
  }, [theme]);

  const toggleTheme = useCallback((origin?: { x: number; y: number }) => {
    const nextTheme: ThemeMode = theme === "dark" ? "light" : "dark";
    const x = origin?.x ?? window.innerWidth / 2;
    const y = origin?.y ?? window.innerHeight / 2;

    setWave({
      key: Date.now(),
      x,
      y,
      color: nextTheme === "dark" ? "#08111d" : "#f4f7fb",
    });

    applyTheme(nextTheme);
    saveTheme(nextTheme);
    setTheme(nextTheme);

    if (waveTimeoutRef.current) {
      window.clearTimeout(waveTimeoutRef.current);
    }

    waveTimeoutRef.current = window.setTimeout(() => {
      setWave(null);
    }, 700);
  }, [theme]);

  const value = useMemo(
    () => ({
      theme,
      hydrated,
      toggleTheme,
    }),
    [hydrated, theme, toggleTheme]
  );

  return (
    <ThemeContext.Provider value={value}>
      {children}
      {wave ? (
        <div
          key={wave.key}
          className="theme-wave"
          style={
            {
              "--theme-wave-x": `${wave.x}px`,
              "--theme-wave-y": `${wave.y}px`,
              "--theme-wave-color": wave.color,
            } as CSSProperties
          }
        />
      ) : null}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }

  return context;
}

function getStoredTheme(): ThemeMode {
  if (typeof window === "undefined") {
    return "light";
  }

  const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
  return storedTheme === "dark" ? "dark" : "light";
}

function saveTheme(theme: ThemeMode) {
  window.localStorage.setItem(THEME_STORAGE_KEY, theme);
}

function applyTheme(theme: ThemeMode) {
  document.documentElement.dataset.theme = theme;
}
