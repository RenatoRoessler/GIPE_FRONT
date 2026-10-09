"use client";

import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { ThemeProvider } from "styled-components";
import { darkTheme, lightTheme, signageDarkTheme, signageLightTheme } from "@/styles/theme";

export type ThemeMode = "light" | "dark";

const STORAGE_KEY = "gipe-theme-mode";

type ThemeModeContextValue = {
  mode: ThemeMode;
  toggleThemeMode: () => void;
};

const ThemeModeContext = createContext<ThemeModeContextValue | null>(null);

export function ThemeModeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>("light");

  useEffect(() => {
    // Lido só no cliente (localStorage não existe no SSR): renderiza "light" no
    // primeiro paint para casar com o HTML do servidor e evita mismatch de hidratação;
    // a troca para o valor salvo acontece logo em seguida, neste efeito.
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "dark") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMode("dark");
    }
  }, []);

  function toggleThemeMode() {
    setMode((current) => {
      const next: ThemeMode = current === "light" ? "dark" : "light";
      window.localStorage.setItem(STORAGE_KEY, next);
      return next;
    });
  }

  return (
    <ThemeModeContext.Provider value={{ mode, toggleThemeMode }}>
      <ThemeProvider theme={mode === "dark" ? darkTheme : lightTheme}>{children}</ThemeProvider>
    </ThemeModeContext.Provider>
  );
}

export function useThemeMode() {
  const context = useContext(ThemeModeContext);
  if (!context) {
    throw new Error("useThemeMode deve ser usado dentro de ThemeModeProvider");
  }
  return context;
}

// Tema de sinalização viária da área logada: aninhado dentro do provider global,
// herda o modo (claro/escuro) escolhido e não afeta as telas públicas.
export function SignageThemeProvider({ children }: { children: ReactNode }) {
  const { mode } = useThemeMode();
  return (
    <ThemeProvider theme={mode === "dark" ? signageDarkTheme : signageLightTheme}>
      {children}
    </ThemeProvider>
  );
}
