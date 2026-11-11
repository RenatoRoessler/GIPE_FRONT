import { GRUPOS_NAV, navItemKey, navItemsPermitidos, type NavIconId } from "@/lib/nav";
import type { PerfilUsuario } from "@/types/usuario";
import { BOAS_VINDAS_CONVENIADA, BOAS_VINDAS_EQUIPE, CONTEUDO_MODULOS, ehConveniada, PRONTO_CONVENIADA, PRONTO_EQUIPE } from "./conteudo";

export type Passo = {
  id: string;
  titulo: string;
  texto: string;
  // Só os passos de módulo têm ícone e "onde encontrar".
  icone?: NavIconId;
  onde?: string;
};

function ondeEncontrar(grupo: string | undefined): string {
  const titulo = GRUPOS_NAV.find((candidato) => candidato.id === grupo)?.titulo;
  return titulo ? `No menu, em ${titulo}.` : "No menu.";
}

// Boas-vindas, um passo por módulo que o perfil acessa (na ordem do menu) e o fechamento. Perfil desconhecido só vê as pontas
// e o que é de acesso geral.
export function montarPassos(perfil: PerfilUsuario | null | undefined): Passo[] {
  const conveniada = ehConveniada(perfil);
  const boasVindas = conveniada ? BOAS_VINDAS_CONVENIADA : BOAS_VINDAS_EQUIPE;
  const pronto = conveniada ? PRONTO_CONVENIADA : PRONTO_EQUIPE;

  const modulos: Passo[] = navItemsPermitidos(perfil).flatMap((item) => {
    const chave = navItemKey(item);
    const conteudo = CONTEUDO_MODULOS[chave];
    // Item sem texto não entra no tour; o teste de completude impede que isso passe despercebido.
    if (!conteudo) return [];
    return [{ id: chave, titulo: item.label, texto: conteudo.texto, icone: item.icon, onde: ondeEncontrar(item.grupo) }];
  });

  return [{ id: "boas-vindas", ...boasVindas }, ...modulos, { id: "pronto", ...pronto }];
}
