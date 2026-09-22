export const theme = {
  colors: {
    primary: "#3366ff",
    primaryHover: "#254edb",
    danger: "#e5484d",
    success: "#30a46c",
    background: "#ffffff",
    surface: "#f5f6f8",
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
