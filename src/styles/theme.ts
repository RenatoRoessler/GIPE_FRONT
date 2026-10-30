const FONT_SANS = 'var(--font-plus-jakarta), ui-sans-serif, system-ui, sans-serif';
const FONT_MONO = 'var(--font-jetbrains), ui-monospace, Menlo, monospace';

const shared = {
  space: [0, 4, 8, 16, 24, 32, 48, 64],
  fontFamilies: {
    sans: FONT_SANS,
    mono: FONT_MONO,
  },
  fontSizes: {
    xs: "12px",
    sm: "14px",
    md: "16px",
    lg: "20px",
    subtitle: "22px",
    xl: "28px",
    xxl: "40px",
  },
  fontWeights: {
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
  },
  radii: {
    sm: "6px",
    md: "10px",
    lg: "14px",
    xl: "18px",
    full: "9999px",
  },
  layout: {
    // Altura da barra de navegação inferior, sem a área segura do aparelho.
    bottomNavHeight: "64px",
    // Largura máxima do conteúdo da barra inferior e do menu estendido em telas grandes.
    contentMaxWidth: "1120px",
    // Menu lateral das telas grandes: recolhido (só ícones) e expandido (com os nomes).
    sideNavWidth: "72px",
    sideNavExpandedWidth: "240px",
    // Folga abaixo do cabeçalho fixo: topo de painéis fixos e margem ao rolar até uma seção.
    stickyTop: "88px",
    // Painel lateral dos formulários de cadastro (seções e ações) em telas grandes.
    formAsideWidth: "280px",
    // Largura do formulário a partir da qual os campos se distribuem em 6 colunas, cada um com a sua largura.
    formGridWide: "560px",
  },
  breakpoints: {
    sm: "480px",
    md: "768px",
    lg: "1024px",
  },
} as const;

type ThemeColors = {
  // Preenchimento de ação principal e destaque. Nunca como cor de texto: para isso, use `accent`.
  primary: string;
  primaryHover: string;
  primarySoft: string;
  primarySofter: string;
  onPrimary: string;
  // Texto, ícone e linha de destaque (amarelo no escuro, asfalto no claro).
  accent: string;
  // Anel de foco visível.
  focus: string;
  link: string;
  warn: string;
  onWarn: string;
  steel: string;
  danger: string;
  // Texto/ícone sobre o preenchimento `danger`.
  onDanger: string;
  dangerSoft: string;
  success: string;
  // Texto/ícone sobre o preenchimento `success`.
  onSuccess: string;
  background: string;
  surface: string;
  // Trilhos de barra e estado pressionado de cartões: um degrau acima de `surface`.
  surfaceMuted: string;
  text: string;
  textMuted: string;
  // Divisórias e bordas decorativas.
  border: string;
  // Borda de controles (campos, botões secundários): contraste de 3:1 contra o fundo.
  borderStrong: string;
  // Tipo de cliente (relatórios e selos). Texto sobre estas cores é sempre asfalto.
  cliente: { avulso: string; mensal: string; conveniado: string };
  // Forma de pagamento (caixa).
  pagamento: { dinheiro: string; pix: string; credito: string; debito: string };
};

type ThemeTypography = {
  display: string;
  displayTransform: "none" | "uppercase";
  displayTracking: string;
  displaySize: string;
  displayWeight: number;
};

type ThemeShadows = {
  sm: string;
  md: string;
};

export type AppTheme = Omit<typeof shared, "radii"> & {
  radii: Record<keyof typeof shared.radii, string>;
  colors: ThemeColors;
  shadows: ThemeShadows;
  typography: ThemeTypography;
};

// Cores de apoio da marca: iguais nos dois temas.
const cliente = { avulso: "#4C8DFF", mensal: "#19C2B5", conveniado: "#F07A3A" };
const pagamento = { dinheiro: "#7ED38A", pix: "#32BCAD", credito: "#8B7CFF", debito: "#FF8FA3" };

// Títulos em ExtraBold com a fonte principal; caixa alta não faz parte da marca.
const murelTypography: ThemeTypography = {
  display: FONT_SANS,
  displayTransform: "none",
  displayTracking: "-0.02em",
  displaySize: shared.fontSizes.xl,
  displayWeight: shared.fontWeights.extrabold,
};

// Tema claro: giz de fundo, asfalto no texto, amarelo só como preenchimento.
export const lightTheme: AppTheme = {
  ...shared,
  colors: {
    primary: "#FFC20E",
    primaryHover: "#E0A800",
    primarySoft: "rgba(14, 23, 41, 0.08)",
    primarySofter: "rgba(14, 23, 41, 0.14)",
    onPrimary: "#0E1729",
    accent: "#0E1729",
    focus: "#0E1729",
    link: "#0E1729",
    warn: "#E0A800",
    onWarn: "#0E1729",
    steel: "#9AA3B5",
    danger: "#C8242B",
    onDanger: "#FFFFFF",
    dangerSoft: "rgba(200, 36, 43, 0.1)",
    success: "#17795A",
    onSuccess: "#FFFFFF",
    background: "#F4F1E8",
    surface: "#FFFFFF",
    surfaceMuted: "#ECE8DA",
    text: "#0E1729",
    textMuted: "#5A6478",
    border: "#D9D4C5",
    borderStrong: "#737D91",
    cliente,
    pagamento,
  },
  shadows: {
    sm: "0 1px 2px rgba(14, 23, 41, 0.08)",
    md: "0 12px 32px -8px rgba(14, 23, 41, 0.18)",
  },
  typography: murelTypography,
};

// Tema escuro: asfalto de fundo, giz no texto, amarelo faixa como destaque.
export const darkTheme: AppTheme = {
  ...shared,
  colors: {
    primary: "#FFC20E",
    primaryHover: "#E0A800",
    primarySoft: "rgba(255, 194, 14, 0.12)",
    primarySofter: "rgba(255, 194, 14, 0.22)",
    onPrimary: "#0E1729",
    accent: "#FFC20E",
    focus: "#FFC20E",
    link: "#FFC20E",
    warn: "#FFC20E",
    onWarn: "#0E1729",
    steel: "#3A4C6B",
    danger: "#FF5A5F",
    onDanger: "#0E1729",
    dangerSoft: "rgba(255, 90, 95, 0.16)",
    success: "#3CCB7F",
    onSuccess: "#0E1729",
    background: "#0E1729",
    surface: "#16223A",
    surfaceMuted: "#22304B",
    text: "#F4F1E8",
    textMuted: "#9AA3B5",
    border: "#3A4C6B",
    borderStrong: "#6B80A4",
    cliente,
    pagamento,
  },
  shadows: {
    sm: "0 1px 2px rgba(0, 0, 0, 0.3)",
    md: "0 12px 32px -8px rgba(0, 0, 0, 0.5)",
  },
  typography: murelTypography,
};

declare module "styled-components" {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  export interface DefaultTheme extends AppTheme {}
}
