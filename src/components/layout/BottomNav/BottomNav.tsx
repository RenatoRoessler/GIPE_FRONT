"use client";

import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { useTheme } from "styled-components";
import { useVeiculoModais } from "@/components/veiculos/VeiculoModais";
import type { NavAction } from "@/lib/nav";
import { BottomBar } from "./BottomBar";
import { MenuSheet } from "./MenuSheet";

// Barra de navegação inferior do celular e o painel com todas as telas, que o botão Menu abre.
export function BottomNav() {
  const pathname = usePathname();
  const theme = useTheme();
  const { abrirEntrada, abrirSaida } = useVeiculoModais();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  // Ação escolhida no painel: o modal só abre depois que o painel terminou de fechar, para nunca haver dois ao mesmo tempo.
  const pendingActionRef = useRef<NavAction | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const sheetId = useId();

  function abrir(acao: NavAction) {
    if (acao === "entrada") abrirEntrada();
    else abrirSaida();
  }

  function open() {
    dialogRef.current?.showModal();
    setIsOpen(true);
  }

  function close() {
    dialogRef.current?.close();
  }

  function handleSheetAction(acao: NavAction) {
    pendingActionRef.current = acao;
    close();
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
      <BottomBar menuOpen={isOpen} onMenuClick={open} menuId={sheetId} menuButtonRef={menuButtonRef} onAction={abrir} />
      <MenuSheet
        id={sheetId}
        dialogRef={dialogRef}
        pathname={pathname}
        onRequestClose={close}
        onAction={handleSheetAction}
        onClosed={() => {
          setIsOpen(false);
          // Garante o retorno do foco ao botão Menu mesmo em navegadores que não o devolvem (Safari).
          menuButtonRef.current?.focus();
          const acao = pendingActionRef.current;
          pendingActionRef.current = null;
          if (acao) abrir(acao);
        }}
      />
    </>
  );
}
