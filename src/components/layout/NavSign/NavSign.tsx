"use client";

import NextLink from "next/link";
import { isNavAction, type NavAction, type NavItem } from "@/lib/nav";
import { NavIcon } from "./NavIcons";
import { Sign } from "./NavSign.styles";

export interface NavSignProps {
  item: NavItem;
  active: boolean;
  // Chamado ao acionar um item de ação (abre um modal em vez de navegar).
  onAction: (acao: NavAction) => void;
}

export function NavSign({ item, active, onAction }: NavSignProps) {
  if (isNavAction(item)) {
    return (
      <Sign as="button" type="button" $active={false} aria-haspopup="dialog" onClick={() => onAction(item.acao)}>
        <NavIcon id={item.icon} aria-hidden="true" />
        {item.label}
      </Sign>
    );
  }

  return (
    <Sign as={NextLink} href={item.href} $active={active} aria-current={active ? "page" : undefined}>
      <NavIcon id={item.icon} aria-hidden="true" />
      {item.label}
    </Sign>
  );
}
