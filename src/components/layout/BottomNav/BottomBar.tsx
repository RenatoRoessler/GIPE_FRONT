"use client";

import NextLink from "next/link";
import type { Ref } from "react";
import { usePathname } from "next/navigation";
import { Skeleton } from "@/components/ui/Skeleton";
import { isNavAction, isNavItemActive, navItemKey, type NavAction, type NavItem } from "@/lib/nav";
import { MaisTabIcon, TabIcon } from "./BottomBarIcons";
import { Bar, BarInner, IconPill, SkeletonSlot, TabButton, TabLabel, TabLink } from "./BottomNav.styles";

// Espaços reservados enquanto a sessão carrega ou a largura ainda não foi medida.
const SKELETON_SLOTS = ["a", "b", "c", "d"];

export interface BottomBarProps {
  // Itens que cabem na barra, já na ordem de prioridade.
  itens: NavItem[];
  // Mostra o botão "Mais", que abre o menu estendido com o que não coube.
  temMais: boolean;
  // "Mais" destacado: o painel está aberto ou a tela atual é um item que não coube.
  maisAtivo: boolean;
  // Sessão ainda carregando ou largura ainda não medida.
  carregando: boolean;
  menuOpen: boolean;
  onMenuClick: () => void;
  // Id do painel que o botão "Mais" controla.
  menuId: string;
  // Chamado ao tocar em Entrada ou Saída, que abrem um modal em vez de levar a uma página.
  onAction: (acao: NavAction) => void;
  // Para o painel devolver o foco ao botão ao fechar (alguns navegadores não o fazem sozinhos).
  menuButtonRef?: Ref<HTMLButtonElement>;
  // Elemento externo da barra, o que se mede para saber quantos itens cabem.
  barRef?: Ref<HTMLElement>;
}

export const BottomBar = ({ itens, temMais, maisAtivo, carregando, menuOpen, onMenuClick, menuId, onAction, menuButtonRef, barRef }: BottomBarProps) => {
  const pathname = usePathname();
  const slots = carregando ? SKELETON_SLOTS.length : itens.length + (temMais ? 1 : 0);

  return (
    <Bar ref={barRef} aria-label="Navegação principal">
      <BarInner $slots={slots} aria-busy={carregando}>
        {carregando &&
          SKELETON_SLOTS.map((key) => (
            <SkeletonSlot key={key}>
              <Skeleton width="40px" height="32px" radius="8px" />
            </SkeletonSlot>
          ))}
        {!carregando &&
          itens.map((item) => {
            if (isNavAction(item)) {
              return (
                <TabButton key={navItemKey(item)} type="button" $active={false} aria-haspopup="dialog" onClick={() => onAction(item.acao)}>
                  <IconPill $active={false}>
                    <TabIcon id={item.icon} />
                  </IconPill>
                  <TabLabel>{item.shortLabel}</TabLabel>
                </TabButton>
              );
            }
            const active = isNavItemActive(pathname, item.href);
            return (
              <TabLink key={item.href} as={NextLink} href={item.href} $active={active} aria-current={active ? "page" : undefined}>
                <IconPill $active={active}>
                  <TabIcon id={item.icon} />
                </IconPill>
                <TabLabel>{item.shortLabel}</TabLabel>
              </TabLink>
            );
          })}
        {!carregando && temMais && (
          <TabButton
            ref={menuButtonRef}
            type="button"
            $active={maisAtivo}
            onClick={onMenuClick}
            aria-haspopup="dialog"
            aria-expanded={menuOpen}
            aria-controls={menuId}
          >
            <IconPill $active={maisAtivo}>
              <MaisTabIcon />
            </IconPill>
            <TabLabel>Mais</TabLabel>
          </TabButton>
        )}
      </BarInner>
    </Bar>
  );
};
