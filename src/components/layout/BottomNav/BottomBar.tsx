"use client";

import NextLink from "next/link";
import type { Ref } from "react";
import { usePathname } from "next/navigation";
import { BOTTOM_NAV_ITEMS, isMenuTabActive, isNavAction, isNavItemActive, navItemKey, type NavAction } from "@/lib/nav";
import { Bar, IconPill, TabButton, TabLink } from "./BottomNav.styles";
import { MenuTabIcon, TAB_ICONS } from "./BottomBarIcons";

export interface BottomBarProps {
  menuOpen: boolean;
  onMenuClick: () => void;
  // Id do painel que o botão Menu controla.
  menuId: string;
  // Chamado ao tocar em Entrada ou Saída, que abrem um modal em vez de levar a uma página.
  onAction: (acao: NavAction) => void;
  // Para o painel devolver o foco ao botão ao fechar (alguns navegadores não o fazem sozinhos).
  menuButtonRef?: Ref<HTMLButtonElement>;
}

export const BottomBar = ({ menuOpen, onMenuClick, menuId, onAction, menuButtonRef }: BottomBarProps) => {
  const pathname = usePathname();
  const menuActive = menuOpen || isMenuTabActive(pathname);

  return (
    <Bar aria-label="Navegação principal">
      {BOTTOM_NAV_ITEMS.map((item) => {
        if (isNavAction(item)) {
          return (
            <TabButton key={navItemKey(item)} type="button" $active={false} aria-haspopup="dialog" onClick={() => onAction(item.acao)}>
              <IconPill $active={false}>{TAB_ICONS[navItemKey(item)]()}</IconPill>
              {item.label}
            </TabButton>
          );
        }
        const active = isNavItemActive(pathname, item.href);
        return (
          <TabLink key={item.href} as={NextLink} href={item.href} $active={active} aria-current={active ? "page" : undefined}>
            <IconPill $active={active}>{TAB_ICONS[navItemKey(item)]()}</IconPill>
            {item.label}
          </TabLink>
        );
      })}
      <TabButton
        ref={menuButtonRef}
        type="button"
        $active={menuActive}
        onClick={onMenuClick}
        aria-haspopup="dialog"
        aria-expanded={menuOpen}
        aria-controls={menuId}
      >
        <IconPill $active={menuActive}>
          <MenuTabIcon />
        </IconPill>
        Menu
      </TabButton>
    </Bar>
  );
};
