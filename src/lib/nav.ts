export type NavIconId = "pricing" | "users" | "vehicleIn" | "vehicleOut" | "reports";

export type NavItem = {
  label: string;
  href: string;
  icon: NavIconId;
};

export const NAV_ITEMS: NavItem[] = [
  { label: "Gestão de Preços", href: "/precos", icon: "pricing" },
  { label: "Gestão de Usuários", href: "/usuarios", icon: "users" },
  { label: "Entrada de Veículos", href: "/veiculos/entrada", icon: "vehicleIn" },
  { label: "Saída de Veículos", href: "/veiculos/saida", icon: "vehicleOut" },
  { label: "Relatórios", href: "/relatorios", icon: "reports" },
];
