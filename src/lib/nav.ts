export type NavIconId = "home" | "pricing" | "users" | "vehicleIn" | "vehicleOut" | "reports" | "company";

export type NavItem = {
  label: string;
  href: string;
  icon: NavIconId;
};

export const NAV_ITEMS: NavItem[] = [
  { label: "Início", href: "/dashboard", icon: "home" },
  { label: "Gestão de Preços", href: "/precos", icon: "pricing" },
  { label: "Gestão de Usuários", href: "/usuarios", icon: "users" },
  { label: "Entrada de Veículos", href: "/veiculos/entrada", icon: "vehicleIn" },
  { label: "Saída de Veículos", href: "/veiculos/saida", icon: "vehicleOut" },
  { label: "Relatórios", href: "/relatorios", icon: "reports" },
  { label: "Minha Empresa", href: "/minha-empresa", icon: "company" },
];

// "Início" só é ativo na rota exata; os demais também nas rotas filhas.
export function isNavItemActive(pathname: string, href: string) {
  return href === "/dashboard" ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
}
