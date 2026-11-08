import { NavIcon } from "@/components/layout/NavIcons";
import type { NavIconId } from "@/lib/nav";

const ICON_SIZE = 24;

// A barra usa os mesmos ícones do resto do menu (`NavIcon`), em 24px; só o ícone do botão "Mais" é próprio dela.
export function MaisTabIcon() {
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
      <path d="M5 12h.01M12 12h.01M19 12h.01" />
    </svg>
  );
}

// Sinal de "+" do botão de Entrada, maior que os ícones das abas.
export function PlusTabIcon() {
  return (
    <svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function TabIcon({ id }: { id: NavIconId }) {
  return <NavIcon id={id} width={ICON_SIZE} height={ICON_SIZE} aria-hidden="true" />;
}
