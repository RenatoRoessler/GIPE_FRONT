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
  onSign: string;
  signEdge: string;
  link: string;
  warn: string;
  onWarn: string;
  steel: string;
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

type ThemeTypography = {
  display: string;
  displayTransform: "none" | "uppercase";
  displayTracking: string;
  displaySize: string;
};

type ThemeShadows = {
  sm: string;
  md: string;
  glow: string;
};

export type AppTheme = Omit<typeof shared, "radii"> & {
  radii: Record<keyof typeof shared.radii, string>;
  colors: ThemeColors;
  shadows: ThemeShadows;
  typography: ThemeTypography;
};

// Tipografia dos temas atuais: o título segue a fonte do corpo, sem caixa alta.
const plainTypography: ThemeTypography = {
  display: "inherit",
  displayTransform: "none",
  displayTracking: "normal",
  displaySize: shared.fontSizes.xl,
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
    onSign: "#FFFFFF",
    signEdge: "#FFFFFF",
    link: "#2C5CE0",
    warn: "#F5B800",
    onWarn: "#131A2B",
    steel: "#8A95A3",
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
  typography: plainTypography,
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
    onSign: "#1A1A1A",
    signEdge: "#F2F0EE",
    link: "#FF7A5C",
    warn: "#F5B800",
    onWarn: "#1A1A1A",
    steel: "#5A6573",
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
  typography: plainTypography,
};

// Temas de sinalização viária ("Modelo B"): usados apenas na área logada.
const signageShared = {
  ...shared,
  radii: { ...shared.radii, md: "10px", lg: "14px" },
};

const signageTypography: ThemeTypography = {
  display: 'var(--font-barlow-condensed), "Arial Narrow", sans-serif',
  displayTransform: "uppercase",
  displayTracking: ".02em",
  displaySize: "38px",
};

export const signageLightTheme: AppTheme = {
  ...signageShared,
  colors: {
    primary: "#0A4AA0",
    primaryHover: "#0D5CC4",
    primarySoft: "#E3ECF8",
    primarySofter: "#C7D9F1",
    onPrimary: "#FFFFFF",
    onSign: "#FFFFFF",
    signEdge: "#FFFFFF",
    link: "#0A4AA0",
    warn: "#FFCC00",
    onWarn: "#14202E",
    steel: "#8A95A3",
    danger: "#E23D4E",
    success: "#17803F",
    background: "#FFFFFF",
    surface: "#EDF0F4",
    glass: "rgba(255, 255, 255, 0.62)",
    glassBorder: "rgba(255, 255, 255, 0.5)",
    text: "#14202E",
    textMuted: "#4D5B6C",
    border: "#D5DBE3",
  },
  shadows: {
    sm: "0 1px 2px rgba(10, 30, 60, 0.08)",
    md: "0 12px 32px -8px rgba(10, 30, 60, 0.2)",
    glow: "0 6px 10px -4px rgba(10, 30, 60, 0.35)",
  },
  typography: signageTypography,
};

export const signageDarkTheme: AppTheme = {
  ...signageShared,
  colors: {
    primary: "#1768D1",
    primaryHover: "#2A7BE6",
    primarySoft: "rgba(23, 104, 209, 0.2)",
    primarySofter: "rgba(23, 104, 209, 0.34)",
    onPrimary: "#FFFFFF",
    onSign: "#FFFFFF",
    signEdge: "#E8EDF3",
    link: "#7DB3FF",
    warn: "#FFCC00",
    onWarn: "#14202E",
    steel: "#5A6573",
    danger: "#FF6B6B",
    success: "#5FD08E",
    background: "#151C25",
    surface: "#0D1218",
    glass: "rgba(21, 28, 37, 0.62)",
    glassBorder: "rgba(255, 255, 255, 0.08)",
    text: "#E8EDF3",
    textMuted: "#9EABBA",
    border: "#27313D",
  },
  shadows: {
    sm: "0 1px 2px rgba(0, 0, 0, 0.3)",
    md: "0 12px 32px -8px rgba(0, 0, 0, 0.5)",
    glow: "none",
  },
  typography: signageTypography,
};

declare module "styled-components" {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  export interface DefaultTheme extends AppTheme {}
}
