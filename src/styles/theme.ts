export const theme = {
  colors: {
    primary: "#3366ff",
    primaryHover: "#254edb",
    primarySoft: "#eaf0ff",
    primarySofter: "#dce8ff",
    danger: "#e5484d",
    success: "#30a46c",
    background: "#ffffff",
    surface: "#f5f6f8",
    glass: "rgba(255, 255, 255, 0.62)",
    glassBorder: "rgba(255, 255, 255, 0.5)",
    text: "#111318",
    textMuted: "#6b7280",
    border: "#e2e4e9",
  },
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
  shadows: {
    sm: "0 1px 2px rgba(17, 19, 24, 0.06)",
    md: "0 12px 32px -8px rgba(17, 19, 24, 0.16)",
    glow: "0 20px 48px -12px rgba(51, 102, 255, 0.35)",
  },
  breakpoints: {
    sm: "480px",
    md: "768px",
    lg: "1024px",
  },
} as const;

export type AppTheme = typeof theme;

declare module "styled-components" {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  export interface DefaultTheme extends AppTheme {}
}
