import { AREA, podeAcessar } from "@/lib/permissoes";
import { lightTheme } from "@/styles/theme";
import type { PerfilUsuario } from "@/types/usuario";

// A partir daqui o menu é o lateral (telas grandes); abaixo, a barra inferior (celular e tablet).
const TELA_GRANDE = `(min-width: ${lightTheme.breakpoints.lg})`;

// Sem `matchMedia` (servidor, testes) assume tela grande.
export function ehTelaGrande(): boolean {
  return typeof window === "undefined" || typeof window.matchMedia !== "function" || window.matchMedia(TELA_GRANDE).matches;
}

// Tela em que o sistema abre depois do login e na raiz: o Pátio no celular, o Dashboard nas telas grandes.
// Quem não acessa o Pátio vai sempre ao Dashboard.
export function telaInicial(perfil: PerfilUsuario | null | undefined, telaGrande: boolean = ehTelaGrande()): "/patio" | "/dashboard" {
  return !telaGrande && podeAcessar(perfil, AREA.Patio) ? "/patio" : "/dashboard";
}
