import type { ReactNode } from "react";
import { NavIcon } from "@/components/layout/NavSign/NavIcons";

const ICON_SIZE = 24;

// A barra usa os mesmos ícones do resto do menu (`NavIcon`), em 24px; só o hambúrguer do botão Menu é próprio dela.
export function MenuTabIcon() {
  return (
    <svg
      width={ICON_SIZE}
      height={ICON_SIZE}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}

function HomeTabIcon() {
  return <NavIcon id="home" width={ICON_SIZE} height={ICON_SIZE} aria-hidden="true" />;
}

function EntradaTabIcon() {
  return <NavIcon id="vehicleIn" width={ICON_SIZE} height={ICON_SIZE} aria-hidden="true" />;
}

function SaidaTabIcon() {
  return <NavIcon id="vehicleOut" width={ICON_SIZE} height={ICON_SIZE} aria-hidden="true" />;
}

// Ícone de cada atalho da barra, pela chave do item (endereço do link ou ação).
export const TAB_ICONS: Record<string, () => ReactNode> = {
  "/dashboard": HomeTabIcon,
  entrada: EntradaTabIcon,
  saida: SaidaTabIcon,
};
