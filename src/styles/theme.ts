const shared = {
  space: [0, 4, 8, 16, 24, 32, 48, 64],
  fontSizes: {
    xs: "12px",
    sm: "14px",
    md: "16px",
    lg: "20px",
    xl: "28px",
  },
  fontWeights: {
    regular: 400,
    medium: 500,
    bold: 700,
  },
  radii: {
    sm: "4px",
    md: "8px",
    lg: "16px",
    full: "9999px",
  },
  breakpoints: {
    sm: "480px",
    md: "768px",
    lg: "1024px",
  },
} as const;

type ThemeColors = {
  primary: string;
  primaryHover: string;
  primarySoft: string;
  primarySofter: string;
  onPrimary: string;
  danger: string;
  success: string;
  background: string;
  surface: string;
  glass: string;
  glassBorder: string;
  text: string;
  textMuted: string;
  border: string;
};

type ThemeShadows = {
  sm: string;
  md: string;
  glow: string;
};

export type AppTheme = typeof shared & {
  colors: ThemeColors;
  shadows: ThemeShadows;
};

// Tema claro: "Confiança Azul"
export const lightTheme: AppTheme = {
  ...shared,
  colors: {
    primary: "#2C5CE0",
    primaryHover: "#1E46B8",
    primarySoft: "#E7EDFC",
    primarySofter: "#D3DFFA",
    onPrimary: "#FFFFFF",
    danger: "#E23D4E",
    success: "#1F9D6C",
    background: "#FFFFFF",
    surface: "#F3F5FA",
    glass: "rgba(255, 255, 255, 0.62)",
    glassBorder: "rgba(255, 255, 255, 0.5)",
    text: "#131A2B",
    textMuted: "#64708A",
    border: "#E1E5EE",
  },
  shadows: {
    sm: "0 1px 2px rgba(17, 19, 24, 0.06)",
    md: "0 12px 32px -8px rgba(17, 19, 24, 0.16)",
    glow: "0 20px 48px -12px rgba(44, 92, 224, 0.35)",
  },
};

// Tema escuro: "Grafite Coral"
export const darkTheme: AppTheme = {
  ...shared,
  colors: {
    primary: "#FF7A5C",
    primaryHover: "#FF9678",
    primarySoft: "rgba(255, 122, 92, 0.16)",
    primarySofter: "rgba(255, 122, 92, 0.28)",
    onPrimary: "#1A1A1A",
    danger: "#FF6B6B",
    success: "#4FBE86",
    background: "#1A1A1A",
    surface: "#232323",
    glass: "rgba(35, 35, 35, 0.62)",
    glassBorder: "rgba(255, 255, 255, 0.08)",
    text: "#F2F0EE",
    textMuted: "#A3A19D",
    border: "#383838",
  },
  shadows: {
    sm: "0 1px 2px rgba(0, 0, 0, 0.3)",
    md: "0 12px 32px -8px rgba(0, 0, 0, 0.5)",
    glow: "0 20px 48px -12px rgba(255, 122, 92, 0.35)",
  },
};

declare module "styled-components" {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  export interface DefaultTheme extends AppTheme {}
}
