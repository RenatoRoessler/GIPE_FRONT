"use client";

import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { useTheme } from "styled-components";
import { NavSign } from "@/components/layout/NavSign";
import { NAV_ITEMS, isNavItemActive } from "@/lib/nav";
import {
  Beam,
  CloseButton,
  Dialog,
  Panel,
  PanelHeader,
  PanelTitle,
  SignList,
  Trigger,
} from "./MobileNav.styles";

export function MobileNav() {
  const pathname = usePathname();
  const theme = useTheme();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const dialogId = useId();

  function open() {
    dialogRef.current?.showModal();
    setIsOpen(true);
  }

  function close() {
    dialogRef.current?.close();
  }

  // Navegar para outra rota fecha o painel.
  useEffect(() => {
    dialogRef.current?.close();
  }, [pathname]);

  // Ao crescer até o breakpoint do pórtico, o painel não faz mais sentido.
  useEffect(() => {
    const query = window.matchMedia(`(min-width: ${theme.breakpoints.lg})`);
    function handleChange(event: MediaQueryListEvent) {
      if (event.matches) dialogRef.current?.close();
    }
    query.addEventListener("change", handleChange);
    return () => query.removeEventListener("change", handleChange);
  }, [theme.breakpoints.lg]);

  return (
    <>
      <Trigger
        type="button"
        onClick={open}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-controls={dialogId}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
          <path d="M4 7h16M4 12h16M4 17h16" />
        </svg>
        Menu
      </Trigger>
      <Dialog
        ref={dialogRef}
        id={dialogId}
        aria-labelledby={`${dialogId}-title`}
        onClose={() => setIsOpen(false)}
        onClick={(event) => {
          // O clique no backdrop chega ao próprio <dialog>; o painel ocupa todo o conteúdo.
          if (event.target === dialogRef.current) close();
        }}
      >
        <Panel>
          <PanelHeader>
            <PanelTitle id={`${dialogId}-title`}>Menu</PanelTitle>
            <CloseButton type="button" onClick={close} aria-label="Fechar menu">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
                <path d="M6 6l12 12M18 6 6 18" />
              </svg>
            </CloseButton>
          </PanelHeader>
          <Beam aria-hidden="true" />
          <nav aria-label="Menu principal">
            <SignList>
              {NAV_ITEMS.map((item) => (
                <li key={item.href}>
                  <NavSign item={item} active={isNavItemActive(pathname, item.href)} variant="panel" onNavigate={close} />
                </li>
              ))}
            </SignList>
          </nav>
        </Panel>
      </Dialog>
    </>
  );
}
