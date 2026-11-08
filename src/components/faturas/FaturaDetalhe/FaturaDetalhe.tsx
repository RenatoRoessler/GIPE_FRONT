"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { formatDataBr } from "@/components/financeiro/format";
import { ErroSemPermissao } from "@/components/layout/ErroSemPermissao";
import { Accordion, AccordionItem } from "@/components/ui/Accordion";
import { BackButton } from "@/components/ui/BackButton";
import { Button } from "@/components/ui/Button";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { Link } from "@/components/ui/Link";
import { Skeleton } from "@/components/ui/Skeleton";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Text } from "@/components/ui/Text";
import { Toast } from "@/components/ui/Toast";
import { useIsMobile } from "@/hooks/useMediaQuery";
import { useToast } from "@/hooks/useToast";
import { ApiError, isForbiddenError } from "@/lib/api/errors";
import { formatBRL } from "@/lib/money";
import { formatDataInput } from "@/lib/periodo";
import { SITUACAO_FATURA } from "@/types/fatura";
import { AcoesFatura } from "../AcoesFatura";
import { CancelarFaturaDialog } from "../CancelarFaturaDialog";
import { CicloFatura } from "../CicloFatura";
import { Apoio, Cartao, CartaoTitulo, DetalheGrid, ErrorArea, Page, SkeletonRows, TituloLinha, ValorHeroi } from "../Faturas.styles";
import { MENSAGEM_CANCELAMENTO, MENSAGEM_PAGAMENTO, mensagemEmissao, numeroFatura, quantidadeSaidas, resumoCiclo } from "../format";
import { ItensFatura } from "../ItensFatura";
import { ObservacaoFatura } from "../ObservacaoFatura";
import { PagarFaturaModal } from "../PagarFaturaModal";
import { rotuloSituacao, tomSituacao } from "../situacao";
import { EMITIDA_PARAM, faturaUrl, LISTA_URL } from "../url";
import { useFatura } from "../useFatura";
import { VencimentoAviso } from "../VencimentoAviso";
import { avisoVencimento } from "../vencimento";

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
  const celular = useIsMobile();
  // Hoje (AAAA-MM-DD) calculado uma vez, para o destaque de vencimento.
  const [hoje] = useState(() => formatDataInput(new Date()));
  const [cicloAberto, setCicloAberto] = useState(false);
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
  const paga = fatura.situacao === SITUACAO_FATURA.Paga;
  const aviso = avisoVencimento(fatura, hoje);
  const apoio = [quantidadeSaidas(fatura.quantidadeSaidas), paga ? null : `vence em ${formatDataBr(fatura.vencimento)}`].filter(Boolean).join(" · ");
  const acoes = { fatura, onPagar: () => setModal("pagar"), onCancelar: () => setModal("cancelar") };

  const heroi = (
    <Cartao aria-labelledby="fatura-titulo">
      <TituloLinha>
        <Text variant="heading" as="h1" id="fatura-titulo">
          Fatura {numeroFatura(fatura)}
        </Text>
        <StatusBadge tone={tomSituacao(fatura.situacao)}>{rotuloSituacao(fatura.situacao)}</StatusBadge>
      </TituloLinha>
      <Text>{fatura.conveniada}</Text>
      <ValorHeroi $cancelada={cancelada}>{formatBRL(fatura.valorTotal)}</ValorHeroi>
      {celular ? (
        <>
          {/* O vencimento só importa enquanto a fatura está aberta; paga diz quando foi paga e cancelada não diz nada. */}
          {aviso && <VencimentoAviso aviso={aviso} />}
          {aviso && (aviso.tipo === "vencida" || aviso.tipo === "hoje") && <Apoio>Vencimento {formatDataBr(fatura.vencimento)}</Apoio>}
          {paga && fatura.dataPagamento && <Apoio>Paga em {formatDataBr(fatura.dataPagamento.slice(0, 10))}</Apoio>}
          <Apoio>{quantidadeSaidas(fatura.quantidadeSaidas)}</Apoio>
        </>
      ) : (
        <Apoio>{apoio}</Apoio>
      )}
      <ObservacaoFatura observacao={fatura.observacao} />
      {!celular && <AcoesFatura {...acoes} lugar="heroi" />}
    </Cartao>
  );

  return (
    <Page>
      {botaoVoltar}
      {celular ? (
        <>
          {heroi}
          <Accordion>
            <AccordionItem title="Ciclo da fatura" summary={resumoCiclo(fatura)} open={cicloAberto} onOpenChange={setCicloAberto}>
              <CicloFatura fatura={fatura} />
            </AccordionItem>
          </Accordion>
        </>
      ) : (
        <DetalheGrid>
          {heroi}
          <Cartao aria-labelledby="ciclo-titulo">
            <CartaoTitulo id="ciclo-titulo">Ciclo da fatura</CartaoTitulo>
            <CicloFatura fatura={fatura} />
          </Cartao>
        </DetalheGrid>
      )}
      <Cartao aria-labelledby="saidas-titulo">
        <CartaoTitulo id="saidas-titulo">Saídas desta fatura</CartaoTitulo>
        <ItensFatura fatura={fatura} itens={itens} />
      </Cartao>
      {celular && <AcoesFatura {...acoes} lugar="barra" />}
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
