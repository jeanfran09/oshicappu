"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { buildPalette, type ThemePalette } from "@/utils/color";

const STORAGE_KEY = "oshicappu-theme";

type StoredTheme = {
  oshiId: string;
  oshiName: string;
  color: string;
};

type ThemeContextType = {
  activeOshiId: string | null;
  activeOshiName: string | null;
  isReady: boolean;
  setTheme: (
    oshiId: string,
    oshiName: string,
    color: string
  ) => void;
  resetTheme: () => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(
  undefined
);

function applyPalette(palette: ThemePalette) {
  const root = document.documentElement;
  root.style.setProperty("--background", palette.background);
  root.style.setProperty("--foreground", palette.foreground);
  root.style.setProperty("--accent", palette.accent);
  root.style.setProperty(
    "--accent-secondary",
    palette.accentSecondary
  );
}

function clearPalette() {
  const root = document.documentElement;
  root.style.removeProperty("--background");
  root.style.removeProperty("--foreground");
  root.style.removeProperty("--accent");
  root.style.removeProperty("--accent-secondary");
}

export function ThemeProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [active, setActive] = useState<StoredTheme | null>(null);
  const [isReady, setIsReady] = useState(false);

  // Apply any saved theme as soon as we mount, before paint feels
  // best-effort here since this is a client component tree.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);

      if (raw) {
        const parsed: StoredTheme = JSON.parse(raw);
        setActive(parsed);
        applyPalette(buildPalette(parsed.color));
      }
    } catch (error) {
      console.error("Error loading saved theme:", error);
    } finally {
      setIsReady(true);
    }
  }, []);

  const setTheme = (
    oshiId: string,
    oshiName: string,
    color: string
  ) => {
    const next: StoredTheme = { oshiId, oshiName, color };

    setActive(next);
    applyPalette(buildPalette(color));

    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(next)
      );
    } catch (error) {
      console.error("Error saving theme:", error);
    }
  };

  const resetTheme = () => {
    setActive(null);
    clearPalette();

    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error("Error clearing saved theme:", error);
    }
  };

  return (
    <ThemeContext.Provider
      value={{
        activeOshiId: active?.oshiId ?? null,
        activeOshiName: active?.oshiName ?? null,
        isReady,
        setTheme,
        resetTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (context === undefined) {
    throw new Error(
      "useTheme must be used within a ThemeProvider"
    );
  }

  return context;
}
