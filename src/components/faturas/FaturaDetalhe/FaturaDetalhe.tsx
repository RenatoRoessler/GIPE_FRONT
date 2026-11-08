"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { formatDataBr } from "@/components/financeiro/format";
import { ErroSemPermissao } from "@/components/layout/ErroSemPermissao";
import { BackButton } from "@/components/ui/BackButton";
import { Button } from "@/components/ui/Button";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { Link } from "@/components/ui/Link";
import { Skeleton } from "@/components/ui/Skeleton";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Text } from "@/components/ui/Text";
import { Toast } from "@/components/ui/Toast";
import { useToast } from "@/hooks/useToast";
import { ApiError, isForbiddenError } from "@/lib/api/errors";
import { formatBRL } from "@/lib/money";
import { SITUACAO_FATURA } from "@/types/fatura";
import { CancelarFaturaDialog } from "../CancelarFaturaDialog";
import { CicloFatura } from "../CicloFatura";
import { Acoes, Apoio, Cartao, CartaoTitulo, DetalheGrid, ErrorArea, Page, SkeletonRows, TituloLinha, ValorHeroi } from "../Faturas.styles";
import { MENSAGEM_CANCELAMENTO, MENSAGEM_PAGAMENTO, mensagemEmissao, numeroFatura, quantidadeSaidas } from "../format";
import { ItensFatura } from "../ItensFatura";
import { PagarFaturaModal } from "../PagarFaturaModal";
import { podeCancelar, podePagar, rotuloSituacao, tomSituacao } from "../situacao";
import { EMITIDA_PARAM, faturaUrl, LISTA_URL } from "../url";
import { useFatura } from "../useFatura";

export interface FaturaDetalheProps {
  id: number;
}

type Modal = "pagar" | "cancelar" | null;

export function FaturaDetalhe({ id }: FaturaDetalheProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const emitida = searchParams.get(EMITIDA_PARAM) === "1";
  const { data, isPending, isError, error, refetch, isFetching } = useFatura(id);
  const [modal, setModal] = useState<Modal>(null);
  const { toast, showToast, dismissToast } = useToast();

  // Vindo da emissão: mostra o aviso uma vez, com os números da própria fatura, e limpa a marca da URL.
  useEffect(() => {
    if (!emitida || !data) {
      return;
    }
    showToast(mensagemEmissao(data.fatura));
    router.replace(faturaUrl(id), { scroll: false });
  }, [emitida, data, id, router, showToast]);

  // Volta para a lista com os filtros de onde veio; sem histórico (link direto), vai para a lista.
  function voltar() {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push(LISTA_URL);
    }
  }

  const botaoVoltar = <BackButton onClick={voltar}>Voltar para faturas</BackButton>;

  if (isError) {
    if (error instanceof ApiError && error.kind === "not_found") {
      return (
        <Page>
          {botaoVoltar}
          <Text variant="heading" as="h1">
            Fatura não encontrada
          </Text>
          <Link href={LISTA_URL}>Ver todas as faturas</Link>
        </Page>
      );
    }
    // 403 não melhora ao tentar de novo: mostra só o aviso de permissão.
    if (isForbiddenError(error)) {
      return (
        <Page>
          {botaoVoltar}
          <ErroSemPermissao />
        </Page>
      );
    }
    return (
      <Page>
        {botaoVoltar}
        <ErrorArea>
          <ErrorBanner role="alert">Não foi possível carregar a fatura. {error.message}</ErrorBanner>
          <Button type="button" variant="secondary" onClick={() => void refetch()} disabled={isFetching}>
            Tentar novamente
          </Button>
        </ErrorArea>
      </Page>
    );
  }

  if (isPending) {
    return (
      <Page>
        {botaoVoltar}
        <div role="status" aria-label="Carregando fatura">
          <SkeletonRows>
            <Skeleton height="28px" width="40%" />
            <Skeleton height="48px" width="60%" />
            {Array.from({ length: 5 }, (_, index) => (
              <Skeleton key={index} height="20px" />
            ))}
          </SkeletonRows>
        </div>
      </Page>
    );
  }

  const { fatura, itens } = data;
  const cancelada = fatura.situacao === SITUACAO_FATURA.Cancelada;
  const apoio = [quantidadeSaidas(fatura.quantidadeSaidas), fatura.situacao === SITUACAO_FATURA.Paga ? null : `vence em ${formatDataBr(fatura.vencimento)}`].filter(Boolean).join(" · ");

  return (
    <Page>
      {botaoVoltar}
      <DetalheGrid>
        <Cartao aria-labelledby="fatura-titulo">
          <TituloLinha>
            <Text variant="heading" as="h1" id="fatura-titulo">
              Fatura {numeroFatura(fatura)}
            </Text>
            <StatusBadge tone={tomSituacao(fatura.situacao)}>{rotuloSituacao(fatura.situacao)}</StatusBadge>
          </TituloLinha>
          <Text>{fatura.conveniada}</Text>
          <ValorHeroi $cancelada={cancelada}>{formatBRL(fatura.valorTotal)}</ValorHeroi>
          <Apoio>{apoio}</Apoio>
          {fatura.observacao && <Apoio>Obs.: {fatura.observacao}</Apoio>}
          {(podePagar(fatura) || podeCancelar(fatura)) && (
            <Acoes>
              {podePagar(fatura) && (
                <Button type="button" onClick={() => setModal("pagar")}>
                  Registrar pagamento
                </Button>
              )}
              {podeCancelar(fatura) && (
                <Button type="button" variant="secondary" onClick={() => setModal("cancelar")}>
                  Cancelar fatura
                </Button>
              )}
            </Acoes>
          )}
        </Cartao>
        <Cartao aria-labelledby="ciclo-titulo">
          <CartaoTitulo id="ciclo-titulo">Ciclo da fatura</CartaoTitulo>
          <CicloFatura fatura={fatura} />
        </Cartao>
      </DetalheGrid>
      <Cartao aria-labelledby="saidas-titulo">
        <CartaoTitulo id="saidas-titulo">Saídas desta fatura</CartaoTitulo>
        <ItensFatura fatura={fatura} itens={itens} />
      </Cartao>
      {modal === "pagar" && (
        <PagarFaturaModal
          fatura={fatura}
          onClose={() => setModal(null)}
          onPaga={() => {
            setModal(null);
            showToast(MENSAGEM_PAGAMENTO);
          }}
        />
      )}
      {modal === "cancelar" && (
        <CancelarFaturaDialog
          fatura={fatura}
          onClose={() => setModal(null)}
          onCancelada={() => {
            setModal(null);
            showToast(MENSAGEM_CANCELAMENTO);
          }}
        />
      )}
      {toast && <Toast message={toast.message} variant={toast.variant} onDismiss={dismissToast} />}
    </Page>
  );
}
