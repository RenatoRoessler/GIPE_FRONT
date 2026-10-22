export type NavIconId = "home" | "pricing" | "users" | "members" | "vehicleIn" | "vehicleOut" | "yard" | "cashier" | "reports" | "company" | "invoice";

// Ações do menu que abrem um modal por cima da tela atual, em vez de levar a uma página.
export type NavAction = "entrada" | "saida";

export type NavLinkItem = {
  label: string;
  href: string;
  icon: NavIconId;
};

export type NavActionItem = {
  label: string;
  acao: NavAction;
  icon: NavIconId;
};

export type NavItem = NavLinkItem | NavActionItem;

export function isNavAction(item: NavItem): item is NavActionItem {
  return "acao" in item;
}

// Chave única do item: o endereço (links) ou a ação.
export function navItemKey(item: NavItem): string {
  return isNavAction(item) ? item.acao : item.href;
}

export const NAV_ITEMS: NavItem[] = [
  { label: "Início", href: "/dashboard", icon: "home" },
  { label: "Gestão de Preços", href: "/precos", icon: "pricing" },
  { label: "Gestão de Usuários", href: "/usuarios", icon: "users" },
  { label: "Mensalistas", href: "/mensalistas", icon: "members" },
  { label: "Entrada de Veículos", acao: "entrada", icon: "vehicleIn" },
  { label: "Saída de Veículos", acao: "saida", icon: "vehicleOut" },
  { label: "Pátio", href: "/patio", icon: "yard" },
  { label: "Caixa", href: "/caixa", icon: "cashier" },
  { label: "Notas Fiscais", href: "/notas-fiscais", icon: "invoice" },
  { label: "Relatórios", href: "/relatorios", icon: "reports" },
  { label: "Minha Empresa", href: "/minha-empresa", icon: "company" },
];

// Atalhos da barra inferior (celular): derivados de NAV_ITEMS para não duplicar endereço, ação nem ícone.
const BOTTOM_NAV_LABELS: Record<string, string> = {
  "/dashboard": "Início",
  entrada: "Entrada",
  saida: "Saída",
};

export const BOTTOM_NAV_ITEMS: NavItem[] = Object.entries(BOTTOM_NAV_LABELS).map(([key, label]) => {
  const item = NAV_ITEMS.find((navItem) => navItemKey(navItem) === key);
  if (!item) {
    throw new Error(`Atalho da barra inferior sem item de menu: ${key}`);
  }
  return { ...item, label };
});

// "Início" só é ativo na rota exata; os demais também nas rotas filhas.
export function isNavItemActive(pathname: string, href: string) {
  return href === "/dashboard" ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
}

// Itens de ação não são telas: nunca ficam marcados como "página atual".
export function isNavActive(pathname: string, item: NavItem) {
  return isNavAction(item) ? false : isNavItemActive(pathname, item.href);
}

// O item Menu da barra inferior fica ativo em qualquer tela que não seja o Início: Entrada e Saída abrem modais.
export function isMenuTabActive(pathname: string) {
  return !isNavItemActive(pathname, "/dashboard");
}
