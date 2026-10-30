import { AREA, podeAcessar, type Area } from "@/lib/permissoes";
import type { PerfilUsuario } from "@/types/usuario";

export type NavIconId = "dashboard" | "pricing" | "users" | "members" | "vehicleIn" | "vehicleOut" | "yard" | "cashier" | "company" | "invoice" | "finance" | "keys" | "agreement" | "stamp";

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
  { label: "Pátio", shortLabel: "Pátio", href: "/patio", icon: "yard", area: AREA.Patio },
  { label: "Entrada de Veículos", shortLabel: "Entrada", acao: "entrada", icon: "vehicleIn", area: AREA.Patio },
  { label: "Saída de Veículos", shortLabel: "Saída", acao: "saida", icon: "vehicleOut", area: AREA.Patio },
  { label: "Caixa", shortLabel: "Caixa", href: "/caixa", icon: "cashier", area: AREA.Caixa },
  { label: "Carimbar ticket", shortLabel: "Carimbo", href: "/carimbo", icon: "stamp", area: AREA.Carimbo },
  { label: "Dashboard", shortLabel: "Dashboard", href: "/dashboard", icon: "dashboard", area: AREA.Inicio },
  { label: "Gestão de Preços", shortLabel: "Preços", href: "/precos", icon: "pricing", area: AREA.Precos },
  { label: "Gestão de Usuários", shortLabel: "Usuários", href: "/usuarios", icon: "users", area: AREA.Usuarios },
  { label: "Mensalistas", shortLabel: "Mensalistas", href: "/mensalistas", icon: "members", area: AREA.Mensalistas },
  { label: "Empresas conveniadas", shortLabel: "Conveniadas", href: "/empresas-conveniadas", icon: "agreement", area: AREA.Conveniadas },
  { label: "Notas Fiscais", shortLabel: "Notas", href: "/notas-fiscais", icon: "invoice", area: AREA.NotasFiscais },
  { label: "Financeiro", shortLabel: "Financeiro", href: "/financeiro", icon: "finance", area: AREA.Financeiro },
  { label: "Minha Empresa", shortLabel: "Empresa", href: "/minha-empresa", icon: "company", area: AREA.Empresa },
  { label: "Quadros de Chaves", shortLabel: "Chaves", href: "/quadros-chaves", icon: "keys", area: AREA.QuadroChaves },
];

// Itens do menu que o perfil pode abrir; sem perfil conhecido, só o Dashboard.
export function navItemsPermitidos(perfil: PerfilUsuario | null | undefined): NavItem[] {
  return NAV_ITEMS.filter((item) => podeAcessar(perfil, item.area));
}

// "Dashboard" só é ativo na rota exata; os demais também nas rotas filhas.
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
