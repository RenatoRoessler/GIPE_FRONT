"use client";

import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { createGlobalStyle, ThemeProvider } from "styled-components";
import { darkTheme, lightTheme } from "@/styles/theme";

export type ThemeMode = "light" | "dark";

const STORAGE_KEY = "murel-theme-mode";
// Chave do nome anterior do sistema: lida uma vez para ninguém perder a preferência de tema.
const LEGACY_STORAGE_KEY = "gipe-theme-mode";

// Fundo, cor e fonte de base seguem o tema escolhido (e não o esquema de cores do sistema).
const GlobalStyle = createGlobalStyle<{ $dark: boolean }>`
  html {
    color-scheme: ${({ $dark }) => ($dark ? "dark" : "light")};
  }

  body {
    background: ${({ theme }) => theme.colors.background};
    color: ${({ theme }) => theme.colors.text};
    font-family: ${({ theme }) => theme.fontFamilies.sans};
    font-variant-numeric: tabular-nums;
  }
`;

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
    const stored = window.localStorage.getItem(STORAGE_KEY) ?? window.localStorage.getItem(LEGACY_STORAGE_KEY);
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
      <ThemeProvider theme={mode === "dark" ? darkTheme : lightTheme}>
        <GlobalStyle $dark={mode === "dark"} />
        {children}
      </ThemeProvider>
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
