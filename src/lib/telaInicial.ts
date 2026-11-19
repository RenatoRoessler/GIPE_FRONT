import { isNavAction, navItemsPermitidos } from "@/lib/nav";
import { AREA, podeAcessar } from "@/lib/permissoes";
import { lightTheme } from "@/styles/theme";
import type { PerfilUsuario } from "@/types/usuario";

// A partir daqui o menu é o lateral (telas grandes); abaixo, a barra inferior (celular e tablet).
const TELA_GRANDE = `(min-width: ${lightTheme.breakpoints.lg})`;

// Sem `matchMedia` (servidor, testes) assume tela grande.
export function ehTelaGrande(): boolean {
  return typeof window === "undefined" || typeof window.matchMedia !== "function" || window.matchMedia(TELA_GRANDE).matches;
}

// Última saída: quem não acessa nenhuma área ainda abre a própria conta (troca de senha e sair).
const SEM_AREA = "/usuario";

// Tela em que o sistema abre depois do login e na raiz. Cada perfil abre numa tela que pode usar:
// 1. a conveniada, no Carimbo (ela vive nele e não tem Visão Geral);
// 2. nas telas grandes, a Visão Geral para quem a acessa (por padrão só o Administrador);
// 3. no celular, e nas telas grandes de quem não vê a Visão Geral, o Pátio para quem o acessa;
// 4. a Visão Geral para quem a acessa mas não tem o Pátio;
// 5. senão, a primeira tela do menu que o perfil pode abrir (Financeiro abre no Financeiro, Lavador na Fila de serviços);
// 6. sem nenhuma área, a própria conta.
export function telaInicial(perfil: PerfilUsuario | null | undefined, telaGrande: boolean = ehTelaGrande()): string {
  if (podeAcessar(perfil, AREA.Carimbo)) {
    return "/carimbo";
  }
  const veVisaoGeral = podeAcessar(perfil, AREA.Inicio);
  if (telaGrande && veVisaoGeral) {
    return "/dashboard";
  }
  if (podeAcessar(perfil, AREA.Patio)) {
    return "/patio";
  }
  if (veVisaoGeral) {
    return "/dashboard";
  }
  const primeira = navItemsPermitidos(perfil).find((item) => !isNavAction(item));
  return primeira && !isNavAction(primeira) ? primeira.href : SEM_AREA;
}
