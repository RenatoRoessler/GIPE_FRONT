import { AREA, podeAcessar, type Area } from "@/lib/permissoes";
import type { PerfilUsuario } from "@/types/usuario";

export type NavIconId = "dashboard" | "pricing" | "users" | "members" | "vehicleIn" | "vehicleOut" | "yard" | "cashier" | "company" | "settings" | "invoice" | "finance" | "keys" | "agreement" | "stamp" | "checklist" | "stampedYard" | "bill";

// Ações do menu que abrem um modal por cima da tela atual, em vez de levar a uma página.
export type NavAction = "entrada" | "saida";

export type NavLinkItem = {
  label: string;
  // Rótulo curto, para caber no espaço de um item da barra inferior.
  shortLabel: string;
  href: string;
  icon: NavIconId;
  area: Area;
  // Grupo do menu; os itens da conveniada não têm.
  grupo?: GrupoNavId;
};

export type NavActionItem = {
  label: string;
  shortLabel: string;
  acao: NavAction;
  icon: NavIconId;
  area: Area;
  grupo?: GrupoNavId;
};

export type NavItem = NavLinkItem | NavActionItem;

export function isNavAction(item: NavItem): item is NavActionItem {
  return "acao" in item;
}

// Chave única do item: o endereço (links) ou a ação.
export function navItemKey(item: NavItem): string {
  return isNavAction(item) ? item.acao : item.href;
}

// Grupos do menu, na ordem em que aparecem. A ordem dos itens dentro de cada grupo é a de NAV_ITEMS.
export const GRUPOS_NAV = [
  { id: "operacao", titulo: "Operação" },
  { id: "financeiro", titulo: "Financeiro" },
  { id: "configuracoes", titulo: "Configurações" },
] as const;

export type GrupoNavId = (typeof GRUPOS_NAV)[number]["id"];

// NAV_ITEMS está na ordem do menu: a Visão Geral, que fica fora dos grupos e abre o menu, depois Operação, Financeiro
// e Configurações e, no fim, os itens da conveniada (também sem grupo, mas de um perfil que não vê a Visão Geral).
export const NAV_ITEMS: NavItem[] = [
  { label: "Visão Geral", shortLabel: "Visão Geral", href: "/dashboard", icon: "dashboard", area: AREA.Inicio },
  { label: "Pátio", shortLabel: "Pátio", href: "/patio", icon: "yard", area: AREA.Patio, grupo: "operacao" },
  { label: "Entrada de Veículos", shortLabel: "Entrada", acao: "entrada", icon: "vehicleIn", area: AREA.Patio, grupo: "operacao" },
  { label: "Saída de Veículos", shortLabel: "Saída", acao: "saida", icon: "vehicleOut", area: AREA.Patio, grupo: "operacao" },
  { label: "Conferência de pátio", shortLabel: "Conferência", href: "/conferencia-patio", icon: "checklist", area: AREA.Patio, grupo: "operacao" },
  { label: "Financeiro", shortLabel: "Financeiro", href: "/financeiro", icon: "finance", area: AREA.Financeiro, grupo: "financeiro" },
  { label: "Caixa", shortLabel: "Caixa", href: "/caixa", icon: "cashier", area: AREA.Caixa, grupo: "financeiro" },
  { label: "Faturas", shortLabel: "Faturas", href: "/faturas", icon: "bill", area: AREA.Faturas, grupo: "financeiro" },
  { label: "Notas Fiscais", shortLabel: "Notas", href: "/notas-fiscais", icon: "invoice", area: AREA.NotasFiscais, grupo: "financeiro" },
  { label: "Minha Empresa", shortLabel: "Empresa", href: "/minha-empresa", icon: "company", area: AREA.Empresa, grupo: "configuracoes" },
  { label: "Configurações", shortLabel: "Config.", href: "/configuracoes", icon: "settings", area: AREA.Configuracoes, grupo: "configuracoes" },
  { label: "Gestão de Preços", shortLabel: "Preços", href: "/precos", icon: "pricing", area: AREA.Precos, grupo: "configuracoes" },
  { label: "Quadros de Chaves", shortLabel: "Chaves", href: "/quadros-chaves", icon: "keys", area: AREA.QuadroChaves, grupo: "configuracoes" },
  { label: "Mensalistas", shortLabel: "Mensalistas", href: "/mensalistas", icon: "members", area: AREA.Mensalistas, grupo: "configuracoes" },
  { label: "Gestão de Usuários", shortLabel: "Usuários", href: "/usuarios", icon: "users", area: AREA.Usuarios, grupo: "configuracoes" },
  { label: "Empresas conveniadas", shortLabel: "Conveniadas", href: "/empresas-conveniadas", icon: "agreement", area: AREA.Conveniadas, grupo: "configuracoes" },
  { label: "Carimbar ticket", shortLabel: "Carimbo", href: "/carimbo", icon: "stamp", area: AREA.Carimbo },
  { label: "Pátio da conveniada", shortLabel: "Pátio", href: "/patio-conveniada", icon: "stampedYard", area: AREA.PatioConveniada },
];

export type GrupoNav = { id: GrupoNavId | null; titulo: string | null; itens: NavItem[] };

// Separa os itens por grupo. Os que não têm grupo (`id` e `titulo` nulos) vêm primeiro, sem título, como a Visão Geral;
// depois os grupos, na ordem de GRUPOS_NAV. Grupo sem item não aparece. Dentro de cada bloco mantém a ordem recebida:
// quem chama passa a lista já na ordem do menu.
export function agruparItens(itens: NavItem[]): GrupoNav[] {
  const grupos: GrupoNav[] = GRUPOS_NAV.map((grupo) => ({ id: grupo.id, titulo: grupo.titulo, itens: itens.filter((item) => item.grupo === grupo.id) })).filter(
    (grupo) => grupo.itens.length > 0,
  );
  const semGrupo = itens.filter((item) => item.grupo === undefined);
  return semGrupo.length > 0 ? [{ id: null, titulo: null, itens: semGrupo }, ...grupos] : grupos;
}

// Itens do menu que o perfil pode abrir; sem perfil conhecido, só a Visão Geral.
export function navItemsPermitidos(perfil: PerfilUsuario | null | undefined): NavItem[] {
  return NAV_ITEMS.filter((item) => podeAcessar(perfil, item.area));
}

// A Visão Geral (/dashboard) só é ativa na rota exata; os demais também nas rotas filhas.
export function isNavItemActive(pathname: string, href: string) {
  return href === "/dashboard" ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
}

// Itens de ação não são telas: nunca ficam marcados como "página atual".
export function isNavActive(pathname: string, item: NavItem) {
  return isNavAction(item) ? false : isNavItemActive(pathname, item.href);
}

// Itens que a barra inferior mostra primeiro quando falta espaço: o dia a dia do pátio.
const BAR_PRIORITY = ["/patio", "entrada", "saida", "/caixa"];

// Itens que o perfil pode abrir, na ordem em que disputam espaço na barra inferior:
// Pátio, Entrada, Saída e Caixa primeiro e depois a ordem do menu.
export function navItemsPorPrioridade(perfil: PerfilUsuario | null | undefined): NavItem[] {
  const prioridade = (item: NavItem) => {
    const posicao = BAR_PRIORITY.indexOf(navItemKey(item));
    return posicao === -1 ? BAR_PRIORITY.length : posicao;
  };
  return navItemsPermitidos(perfil)
    .map((item, indice) => ({ item, indice }))
    .sort((a, b) => prioridade(a.item) - prioridade(b.item) || a.indice - b.indice)
    .map(({ item }) => item);
}

// Barra inferior de cinco posições fixas, na ordem visual: Pátio, Caixa, Entrada (no centro), Saída e Mais.
// São os mesmos itens de BAR_PRIORITY, só que na ordem da barra.
export const BARRA_FIXA = ["/patio", "/caixa", "entrada", "saida"];

// Monta a barra de posições fixas, com os quatro itens e o que sobra para o "Mais" (na ordem do menu).
// Devolve `null` se o perfil não tem algum dos quatro (conveniadas, por exemplo): ele usa a barra adaptativa.
export function montarBarraFixa(perfil: PerfilUsuario | null | undefined): { itens: NavItem[]; excedentes: NavItem[] } | null {
  const permitidos = navItemsPermitidos(perfil);
  const itens: NavItem[] = [];
  for (const chave of BARRA_FIXA) {
    const item = permitidos.find((candidato) => navItemKey(candidato) === chave);
    if (!item) return null;
    itens.push(item);
  }
  return { itens, excedentes: permitidos.filter((item) => !itens.includes(item)) };
}

// A barra tem no mínimo cinco espaços (quatro itens e o "Mais"): Pátio, Entrada, Saída e Caixa aparecem até em telas estreitas.
const MIN_SLOTS = 5;

// Em telas de celular (menos de COMPACTA_ABAIXO espaços) a barra mostra só os itens prioritários (Pátio, Entrada, Saída e Caixa)
// e deixa o resto, a começar pelo Dashboard, no "Mais".
const COMPACTA_ABAIXO = 8;
const ITENS_NA_BARRA_COMPACTA = BAR_PRIORITY.length;

// Separa os itens que cabem na barra dos que vão para o menu estendido. Se nem todos cabem, o último
// espaço é do botão "Mais", então um a menos é mostrado.
export function dividirItensDaBarra<T>(itens: T[], capacidade: number): { visiveis: T[]; excedentes: T[] } {
  const slots = Math.max(capacidade, MIN_SLOTS);
  const mostrados = slots < COMPACTA_ABAIXO ? ITENS_NA_BARRA_COMPACTA : slots - 1;
  if (itens.length <= mostrados || (slots >= COMPACTA_ABAIXO && itens.length <= slots)) {
    return { visiveis: itens, excedentes: [] };
  }
  return { visiveis: itens.slice(0, mostrados), excedentes: itens.slice(mostrados) };
}

// O botão "Mais" fica ativo quando a tela atual é um dos itens que não couberam na barra.
export function isMaisAtivo(pathname: string, excedentes: NavItem[]) {
  return excedentes.some((item) => isNavActive(pathname, item));
}

// Reordena itens (por exemplo, os excedentes da barra) na ordem do menu completo.
export function ordenarPeloMenu(itens: NavItem[]): NavItem[] {
  return [...itens].sort((a, b) => NAV_ITEMS.indexOf(a) - NAV_ITEMS.indexOf(b));
}
