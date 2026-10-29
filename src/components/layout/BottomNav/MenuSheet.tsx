"use client";

import NextLink from "next/link";
import type { Ref } from "react";
import { NavIcon } from "@/components/layout/NavIcons";
import { getVersionLink } from "@/lib/version";
import { isNavAction, isNavActive, navItemKey, type NavAction, type NavItem } from "@/lib/nav";
import { CloseButton, Grabber, IconTile, Sheet, SheetHeader, SheetList, SheetRow, SheetTitle, VersaoRow } from "./BottomNav.styles";

export interface MenuSheetProps {
  id: string;
  dialogRef: Ref<HTMLDialogElement>;
  pathname: string;
  // Só os itens que não couberam na barra inferior, na ordem do menu.
  itens: NavItem[];
  // Chamado quando o painel pede para fechar (fechar, escolher uma tela ou toque no fundo).
  onRequestClose: () => void;
  // Chamado ao tocar em Entrada ou Saída: o contêiner fecha o painel e só então abre o modal.
  onAction: (acao: NavAction) => void;
  // Chamado quando o <dialog> terminou de fechar, por qualquer motivo (inclusive Esc).
  onClosed: () => void;
}

function ChevronIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m9 6 6 6-6 6" />
    </svg>
  );
}

export function MenuSheet({ id, dialogRef, pathname, itens, onRequestClose, onAction, onClosed }: MenuSheetProps) {
  const versao = getVersionLink();

  return (
    <Sheet
      ref={dialogRef}
      id={id}
      aria-labelledby={`${id}-title`}
      onClose={onClosed}
      onClick={(event) => {
        // O clique no fundo chega ao próprio <dialog>; o conteúdo ocupa todo o painel.
        if (event.target === event.currentTarget) onRequestClose();
      }}
    >
      <Grabber aria-hidden="true" />
      <SheetHeader>
        <SheetTitle id={`${id}-title`}>Mais</SheetTitle>
        <CloseButton type="button" onClick={onRequestClose} aria-label="Fechar menu">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
            <path d="M6 6l12 12M18 6 6 18" />
          </svg>
        </CloseButton>
      </SheetHeader>
      <nav aria-label="Outras telas">
        <SheetList>
          {itens.map((item) => {
            if (isNavAction(item)) {
              return (
                <li key={navItemKey(item)}>
                  <SheetRow as="button" type="button" $active={false} aria-haspopup="dialog" onClick={() => onAction(item.acao)}>
                    <IconTile>
                      <NavIcon id={item.icon} width={22} height={22} aria-hidden="true" />
                    </IconTile>
                    {item.label}
                    <ChevronIcon />
                  </SheetRow>
                </li>
              );
            }
            const active = isNavActive(pathname, item);
            return (
              <li key={item.href}>
                <SheetRow as={NextLink} href={item.href} $active={active} aria-current={active ? "page" : undefined} onClick={onRequestClose}>
                  <IconTile>
                    <NavIcon id={item.icon} width={22} height={22} aria-hidden="true" />
                  </IconTile>
                  {item.label}
                  <ChevronIcon />
                </SheetRow>
              </li>
            );
          })}
        </SheetList>
      </nav>
      <VersaoRow as={NextLink} href={versao.href} onClick={onRequestClose}>
        {versao.label}
      </VersaoRow>
    </Sheet>
  );
}
