import { AREA, podeAcessar, type Area } from "@/lib/permissoes";
import type { PerfilUsuario } from "@/types/usuario";

export type NavIconId = "home" | "pricing" | "users" | "members" | "vehicleIn" | "vehicleOut" | "yard" | "cashier" | "company" | "invoice" | "keys";

// Ações do menu que abrem um modal por cima da tela atual, em vez de levar a uma página.
export type NavAction = "entrada" | "saida";

export type NavLinkItem = {
  label: string;
  // Rótulo curto, para caber no espaço de um item da barra inferior.
  shortLabel: string;
  href: string;
  icon: NavIconId;
  area: Area;
};

export type NavActionItem = {
  label: string;
  shortLabel: string;
  acao: NavAction;
  icon: NavIconId;
  area: Area;
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
  { label: "Início", shortLabel: "Início", href: "/dashboard", icon: "home", area: AREA.Inicio },
  { label: "Entrada de Veículos", shortLabel: "Entrada", acao: "entrada", icon: "vehicleIn", area: AREA.Patio },
  { label: "Saída de Veículos", shortLabel: "Saída", acao: "saida", icon: "vehicleOut", area: AREA.Patio },
  { label: "Pátio", shortLabel: "Pátio", href: "/patio", icon: "yard", area: AREA.Patio },
  { label: "Caixa", shortLabel: "Caixa", href: "/caixa", icon: "cashier", area: AREA.Caixa },
  { label: "Gestão de Preços", shortLabel: "Preços", href: "/precos", icon: "pricing", area: AREA.Precos },
  { label: "Gestão de Usuários", shortLabel: "Usuários", href: "/usuarios", icon: "users", area: AREA.Usuarios },
  { label: "Mensalistas", shortLabel: "Mensalistas", href: "/mensalistas", icon: "members", area: AREA.Mensalistas },
  { label: "Notas Fiscais", shortLabel: "Notas", href: "/notas-fiscais", icon: "invoice", area: AREA.NotasFiscais },
  { label: "Minha Empresa", shortLabel: "Empresa", href: "/minha-empresa", icon: "company", area: AREA.Empresa },
  { label: "Quadros de Chaves", shortLabel: "Chaves", href: "/quadros-chaves", icon: "keys", area: AREA.QuadroChaves },
];

// Itens do menu que o perfil pode abrir; sem perfil conhecido, só o Início.
export function navItemsPermitidos(perfil: PerfilUsuario | null | undefined): NavItem[] {
  return NAV_ITEMS.filter((item) => podeAcessar(perfil, item.area));
}

// "Início" só é ativo na rota exata; os demais também nas rotas filhas.
export function isNavItemActive(pathname: string, href: string) {
  return href === "/dashboard" ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
}

// Itens de ação não são telas: nunca ficam marcados como "página atual".
export function isNavActive(pathname: string, item: NavItem) {
  return isNavAction(item) ? false : isNavItemActive(pathname, item.href);
}

// Itens que a barra inferior mostra primeiro quando falta espaço: o dia a dia do pátio.
const BAR_PRIORITY = ["/dashboard", "entrada", "saida"];

// Itens que o perfil pode abrir, na ordem em que disputam espaço na barra inferior:
// Início, Entrada e Saída primeiro e depois a ordem do menu.
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

// A barra tem no mínimo três espaços (três itens, ou dois itens e o "Mais").
const MIN_SLOTS = 3;

// Separa os itens que cabem na barra dos que vão para o menu estendido. Se nem todos cabem, o último
// espaço é do botão "Mais", então um a menos é mostrado.
export function dividirItensDaBarra<T>(itens: T[], capacidade: number): { visiveis: T[]; excedentes: T[] } {
  const slots = Math.max(capacidade, MIN_SLOTS);
  if (itens.length <= slots) {
    return { visiveis: itens, excedentes: [] };
  }
  return { visiveis: itens.slice(0, slots - 1), excedentes: itens.slice(slots - 1) };
}

// O botão "Mais" fica ativo quando a tela atual é um dos itens que não couberam na barra.
export function isMaisAtivo(pathname: string, excedentes: NavItem[]) {
  return excedentes.some((item) => isNavActive(pathname, item));
}

// Reordena itens (por exemplo, os excedentes da barra) na ordem do menu completo.
export function ordenarPeloMenu(itens: NavItem[]): NavItem[] {
  return [...itens].sort((a, b) => NAV_ITEMS.indexOf(a) - NAV_ITEMS.indexOf(b));
}
