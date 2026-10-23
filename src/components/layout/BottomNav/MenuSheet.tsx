"use client";

import NextLink from "next/link";
import type { Ref } from "react";
import { NavIcon } from "@/components/layout/NavSign/NavIcons";
import { Skeleton } from "@/components/ui/Skeleton";
import { useCurrentUser } from "@/contexts/CurrentUserContext";
import { isNavAction, isNavActive, navItemKey, navItemsPermitidos, type NavAction } from "@/lib/nav";
import { CloseButton, Grabber, Sheet, SheetHeader, SheetList, SheetRow, SheetTitle } from "./BottomNav.styles";

export interface MenuSheetProps {
  id: string;
  dialogRef: Ref<HTMLDialogElement>;
  pathname: string;
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

const SKELETON_KEYS = ["a", "b", "c"];

export function MenuSheet({ id, dialogRef, pathname, onRequestClose, onAction, onClosed }: MenuSheetProps) {
  const { user, isLoading } = useCurrentUser();

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
        <SheetTitle id={`${id}-title`}>Menu</SheetTitle>
        <CloseButton type="button" onClick={onRequestClose} aria-label="Fechar menu">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
            <path d="M6 6l12 12M18 6 6 18" />
          </svg>
        </CloseButton>
      </SheetHeader>
      <nav aria-label="Todas as telas">
        <SheetList aria-busy={isLoading}>
          {isLoading &&
            SKELETON_KEYS.map((key) => (
              <li key={key}>
                <Skeleton height="48px" radius="8px" />
              </li>
            ))}
          {(isLoading ? [] : navItemsPermitidos(user?.perfil)).map((item) => {
            if (isNavAction(item)) {
              return (
                <li key={navItemKey(item)}>
                  <SheetRow as="button" type="button" $active={false} aria-haspopup="dialog" onClick={() => onAction(item.acao)}>
                    <NavIcon id={item.icon} width={22} height={22} aria-hidden="true" />
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
                  <NavIcon id={item.icon} width={22} height={22} aria-hidden="true" />
                  {item.label}
                  <ChevronIcon />
                </SheetRow>
              </li>
            );
          })}
        </SheetList>
      </nav>
    </Sheet>
  );
}
