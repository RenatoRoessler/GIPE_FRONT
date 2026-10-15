"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { Skeleton } from "@/components/ui/Skeleton";
import { Text } from "@/components/ui/Text";
import { Toast } from "@/components/ui/Toast";
import { useToast } from "@/hooks/useToast";
import { AbrirCaixaModal } from "../AbrirCaixaModal";
import { CaixaFechado } from "../CaixaFechado";
import { CaixaHeader } from "../CaixaHeader";
import { FecharCaixaModal } from "../FecharCaixaModal";
import { HistoricoTurnosModal } from "../HistoricoTurnosModal";
import { PassarTurnoModal } from "../PassarTurnoModal";
import { SaldoCards } from "../SaldoCards";
import { SangriaModal } from "../SangriaModal";
import { TurnoAtual } from "../TurnoAtual";
import { Page, StatusRow, TitleGroup, VisuallyHidden } from "../Caixa.styles";
import { useCaixa } from "../useCaixa";

type ModalId = "abrir" | "sangria" | "passagem" | "fechar" | "historico";

export function CaixaPage() {
  const { caixaQuery, caixa, turnoQuery } = useCaixa();
  const [modal, setModal] = useState<ModalId | null>(null);
  const { toast, showToast, dismissToast } = useToast();

  const turno = turnoQuery.data;
  const closeModal = () => setModal(null);
  const modalProps = { onClose: closeModal, onSuccess: showToast };

  return (
    <Page>
      <TitleGroup>
        <Text variant="heading" as="h1">
          Caixa
        </Text>
        <Text variant="muted">Controle o caixa, os turnos e as retiradas de dinheiro da sua empresa.</Text>
      </TitleGroup>

      {caixaQuery.isPending ? (
        <div role="status" aria-busy="true">
          <VisuallyHidden>Carregando caixa…</VisuallyHidden>
          <Skeleton height="84px" radius="16px" />
        </div>
      ) : caixaQuery.isError ? (
        <StatusRow>
          <ErrorBanner role="alert">{caixaQuery.error.message}</ErrorBanner>
          <Button
            type="button"
            variant="secondary"
            onClick={() => void caixaQuery.refetch()}
            disabled={caixaQuery.isFetching}
          >
            Tentar novamente
          </Button>
        </StatusRow>
      ) : caixa === null ? (
        <CaixaFechado onAbrir={() => setModal("abrir")} />
      ) : (
        <>
          <CaixaHeader
            caixa={caixa}
            turnoPronto={Boolean(turno)}
            onSangria={() => setModal("sangria")}
            onPassarTurno={() => setModal("passagem")}
            onHistorico={() => setModal("historico")}
            onFechar={() => setModal("fechar")}
          />
          <SaldoCards caixa={caixa} />
          {turnoQuery.isError ? (
            <StatusRow>
              <ErrorBanner role="alert">{turnoQuery.error.message}</ErrorBanner>
              <Button type="button" variant="secondary" onClick={() => void turnoQuery.refetch()}>
                Tentar novamente
              </Button>
            </StatusRow>
          ) : (
            <TurnoAtual turno={turno} />
          )}
        </>
      )}

      {modal === "abrir" && <AbrirCaixaModal {...modalProps} />}
      {modal === "sangria" && turno && <SangriaModal turno={turno} {...modalProps} />}
      {modal === "passagem" && turno && <PassarTurnoModal turno={turno} {...modalProps} />}
      {modal === "fechar" && turno && <FecharCaixaModal turno={turno} {...modalProps} />}
      {modal === "historico" && <HistoricoTurnosModal onClose={closeModal} />}

      {toast && <Toast message={toast.message} variant={toast.variant} onDismiss={dismissToast} />}
    </Page>
  );
}
