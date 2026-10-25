"use client";

import { usePathname } from "next/navigation";
import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { useTheme } from "styled-components";
import { useVeiculoModais } from "@/components/veiculos/VeiculoModais";
import { useCurrentUser } from "@/contexts/CurrentUserContext";
import { dividirItensDaBarra, isMaisAtivo, navItemsPorPrioridade, ordenarPeloMenu, type NavAction } from "@/lib/nav";
import { BottomBar } from "./BottomBar";
import { MenuSheet } from "./MenuSheet";
import { useBarCapacity } from "./useBarCapacity";

// Barra de navegação inferior (em todas as larguras) e o menu estendido com o que não coube nela.
export function BottomNav() {
  const pathname = usePathname();
  const theme = useTheme();
  const { user, isLoading } = useCurrentUser();
  const { abrirEntrada, abrirSaida } = useVeiculoModais();
  const { ref: medirBarra, capacidade } = useBarCapacity(parseInt(theme.layout.contentMaxWidth, 10));
  const barRef = useRef<HTMLElement | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  // Ação escolhida no painel: o modal só abre depois que o painel terminou de fechar, para nunca haver dois ao mesmo tempo.
  const pendingActionRef = useRef<NavAction | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const sheetId = useId();

  const carregando = isLoading || capacidade === null;
  const { visiveis, excedentes } = useMemo(() => {
    if (capacidade === null) return { visiveis: [], excedentes: [] };
    return dividirItensDaBarra(navItemsPorPrioridade(user?.perfil), capacidade);
  }, [capacidade, user?.perfil]);
  const itensDoPainel = useMemo(() => ordenarPeloMenu(excedentes), [excedentes]);
  const temMais = excedentes.length > 0;
  const maisAtivo = isOpen || isMaisAtivo(pathname, excedentes);

  // A barra é medida pelo hook e também guardada aqui, para devolver o foco a ela se o "Mais" sumir.
  const definirBarra = useCallback(
    (elemento: HTMLElement | null) => {
      barRef.current = elemento;
      medirBarra(elemento);
    },
    [medirBarra],
  );

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

  // Se a tela cresce e tudo passa a caber na barra, o painel não tem mais o que mostrar.
  useEffect(() => {
    if (!temMais) dialogRef.current?.close();
  }, [temMais]);

  return (
    <>
      <BottomBar
        itens={visiveis}
        temMais={temMais}
        maisAtivo={maisAtivo}
        carregando={carregando}
        menuOpen={isOpen}
        onMenuClick={open}
        menuId={sheetId}
        menuButtonRef={menuButtonRef}
        barRef={definirBarra}
        onAction={abrir}
      />
      <MenuSheet
        id={sheetId}
        dialogRef={dialogRef}
        pathname={pathname}
        itens={itensDoPainel}
        onRequestClose={close}
        onAction={handleSheetAction}
        onClosed={() => {
          setIsOpen(false);
          // Garante o retorno do foco ao botão "Mais" mesmo em navegadores que não o devolvem (Safari);
          // se ele sumiu (a tela cresceu), o foco vai para o primeiro item da barra.
          const alvo = menuButtonRef.current ?? barRef.current?.querySelector<HTMLElement>("a, button");
          alvo?.focus();
          const acao = pendingActionRef.current;
          pendingActionRef.current = null;
          if (acao) abrir(acao);
        }}
      />
    </>
  );
}
