"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { LancamentoModal } from "@/components/financeiro/LancamentoModal";
import { financeiroUrl } from "@/components/financeiro/url";
import { ErroSemPermissao } from "@/components/layout/ErroSemPermissao";
import { Button } from "@/components/ui/Button";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { Toast } from "@/components/ui/Toast";
import { useToast } from "@/hooks/useToast";
import { isForbiddenError } from "@/lib/api/errors";
import { TIPO_LANCAMENTO } from "@/types/financeiro";
import { AberturaCaixa } from "../AberturaCaixa";
import { AbrirCaixaModal } from "../AbrirCaixaModal";
import { AcessosCaixa } from "../AcessosCaixa";
import { AcoesCaixa } from "../AcoesCaixa";
import { VisuallyHidden, StatusRow } from "../Caixa.styles";
import { CaixaFechado } from "../CaixaFechado";
import { Tela } from "../CaixaResumo.styles";
import { CaixaSkeleton } from "../CaixaSkeleton";
import { FecharCaixaModal } from "../FecharCaixaModal";
import { FundoEGaveta } from "../FundoEGaveta";
import { PassarTurnoModal } from "../PassarTurnoModal";
import { RecebidoPorForma } from "../RecebidoPorForma";
import { SangriaModal } from "../SangriaModal";
import { useCaixa } from "../useCaixa";
import { ValorEmCaixa } from "../ValorEmCaixa";

type ModalId = "abrir" | "sangria" | "despesa" | "passagem" | "fechar";

export function CaixaPage() {
  const router = useRouter();
  const { caixaQuery, caixa, turnoQuery, movimentosQuery } = useCaixa();
  const [modal, setModal] = useState<ModalId | null>(null);
  const { toast, showToast, dismissToast } = useToast();

  const turno = turnoQuery.data;
  const closeModal = () => setModal(null);
  const modalProps = { onClose: closeModal, onSuccess: showToast };

  return (
    <Tela>
      <VisuallyHidden as="h1">Caixa</VisuallyHidden>

      {caixaQuery.isPending ? (
        <CaixaSkeleton />
      ) : caixaQuery.isError && isForbiddenError(caixaQuery.error) ? (
        <ErroSemPermissao />
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
      ) : turnoQuery.isError && isForbiddenError(turnoQuery.error) ? (
        <ErroSemPermissao />
      ) : (
        <>
          <AcessosCaixa />
          <AberturaCaixa caixa={caixa} />
          <ValorEmCaixa caixa={caixa} movimentos={movimentosQuery} />
          <FundoEGaveta caixa={caixa} turno={turnoQuery} />
          <RecebidoPorForma caixa={caixa} movimentos={movimentosQuery} />
          <AcoesCaixa
            turnoPronto={Boolean(turno)}
            onSangria={() => setModal("sangria")}
            onLancarDespesa={() => setModal("despesa")}
            onTrocarTurno={() => setModal("passagem")}
            onFechar={() => setModal("fechar")}
          />
        </>
      )}

      {modal === "abrir" && <AbrirCaixaModal {...modalProps} />}
      {modal === "sangria" && turno && <SangriaModal turno={turno} {...modalProps} />}
      {modal === "despesa" && (
        <LancamentoModal
          tipoInicial={TIPO_LANCAMENTO.Saida}
          onClose={closeModal}
          onSuccess={showToast}
          onCancelar={closeModal}
          onCriarCategoria={() => router.push(financeiroUrl("categorias"))}
        />
      )}
      {modal === "passagem" && turno && <PassarTurnoModal turno={turno} {...modalProps} />}
      {modal === "fechar" && turno && <FecharCaixaModal turno={turno} {...modalProps} />}

      {toast && <Toast message={toast.message} variant={toast.variant} onDismiss={dismissToast} />}
    </Tela>
  );
}
