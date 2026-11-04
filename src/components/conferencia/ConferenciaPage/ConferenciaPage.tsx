"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { ListError } from "@/components/mensalistas/ListError";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { Skeleton } from "@/components/ui/Skeleton";
import { Toast } from "@/components/ui/Toast";
import { useToast } from "@/hooks/useToast";
import { formatPlacaExibicao } from "@/lib/placa";
import type { ConferenciaEtapa } from "@/types/conferenciaPatio";
import { ConferenciaConferindo } from "../ConferenciaConferindo";
import { ConferenciaDivergencias } from "../ConferenciaDivergencias";
import { ConferenciaInicio } from "../ConferenciaInicio";
import { ConferenciaResumo } from "../ConferenciaResumo";
import type { ConferenciaAcoes } from "../tipos";
import { useConferenciaAberta } from "../useConferenciaAberta";
import { useConferenciaAcoes } from "../useConferenciaAcoes";
import { Avisos, EsqueletoCartao, Tela, VisuallyHidden } from "./ConferenciaPage.styles";

export const PARAM_ETAPA = "etapa";
const ETAPAS: readonly ConferenciaEtapa[] = ["conferindo", "divergencias", "resumo"];
export const AVISO_ENCERRADA = "Esta conferência foi encerrada.";

export function etapaDaUrl(valor: string | null): ConferenciaEtapa {
  return ETAPAS.find((etapa) => etapa === valor) ?? "inicio";
}

// Esqueleto no formato do conteúdo; também serve de reserva do Suspense da página.
export function ConferenciaEsqueleto() {
  return (
    <Tela>
      <VisuallyHidden>Conferência de pátio</VisuallyHidden>
      <EsqueletoCartao role="status" aria-label="Carregando a conferência">
        <Skeleton height="28px" width="60%" />
        <Skeleton height="148px" radius="18px" />
        <Skeleton height="64px" radius="14px" />
        <Skeleton height="64px" radius="14px" />
        <Skeleton height="52px" radius="14px" />
      </EsqueletoCartao>
    </Tela>
  );
}

export function ConferenciaPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const etapa = etapaDaUrl(searchParams.get(PARAM_ETAPA));

  const abertaQuery = useConferenciaAberta({ ativo: true });
  const conferencia = abertaQuery.data ?? null;
  const { toast, showToast, dismissToast } = useToast();
  const [encerrada, setEncerrada] = useState(false);

  const acoes = useConferenciaAcoes(conferencia, {
    onErroLeitura: (placa) => showToast(`Não foi possível gravar a placa ${formatPlacaExibicao(placa)}. Tente de novo.`, "error"),
  });

  // Quem finaliza não vê o aviso de "encerrada": ele só aparece quando a conferência some por ação de outra pessoa
  // (outro operador finalizou ou o caixa foi fechado).
  const finalizouAquiRef = useRef(false);
  const tinhaConferenciaRef = useRef(false);
  const { finalizar } = acoes;
  const finalizarAqui = useCallback<ConferenciaAcoes["finalizar"]>(
    async (observacao) => {
      finalizouAquiRef.current = true;
      setEncerrada(false);
      try {
        return await finalizar(observacao);
      } catch (error) {
        finalizouAquiRef.current = false;
        throw error;
      }
    },
    [finalizar],
  );

  const irPara = useCallback(
    (proxima: ConferenciaEtapa) => {
      router.push(proxima === "inicio" ? pathname : `${pathname}?${PARAM_ETAPA}=${proxima}`);
    },
    [pathname, router],
  );

  useEffect(() => {
    if (abertaQuery.isPending || abertaQuery.isError) {
      return;
    }
    if (conferencia !== null) {
      tinhaConferenciaRef.current = true;
      return;
    }
    if (tinhaConferenciaRef.current) {
      tinhaConferenciaRef.current = false;
      if (finalizouAquiRef.current) {
        finalizouAquiRef.current = false;
      } else {
        setEncerrada(true);
      }
    }
    // Sem conferência em andamento só existe o início: a etapa avançada volta para lá.
    if (etapa !== "inicio") {
      router.replace(pathname);
    }
  }, [abertaQuery.isPending, abertaQuery.isError, conferencia, etapa, pathname, router]);

  if (abertaQuery.isPending) {
    return <ConferenciaEsqueleto />;
  }

  if (abertaQuery.isError && conferencia === null) {
    return (
      <Tela>
        <VisuallyHidden>Conferência de pátio</VisuallyHidden>
        <Avisos>
          <ListError error={abertaQuery.error} what="a conferência de pátio" onRetry={() => void abertaQuery.refetch()} retrying={abertaQuery.isFetching} />
        </Avisos>
      </Tela>
    );
  }

  const props = { acoes: { ...acoes, finalizar: finalizarAqui }, onIr: irPara, onMensagem: showToast };

  return (
    <Tela>
      {encerrada && conferencia === null && (
        <Avisos>
          <ErrorBanner role="alert">{AVISO_ENCERRADA}</ErrorBanner>
        </Avisos>
      )}

      {conferencia === null || etapa === "inicio" ? (
        <ConferenciaInicio conferencia={conferencia} {...props} />
      ) : etapa === "conferindo" ? (
        <ConferenciaConferindo conferencia={conferencia} {...props} />
      ) : etapa === "divergencias" ? (
        <ConferenciaDivergencias conferencia={conferencia} {...props} />
      ) : (
        <ConferenciaResumo conferencia={conferencia} {...props} />
      )}

      {toast && <Toast message={toast.message} variant={toast.variant} onDismiss={dismissToast} />}
    </Tela>
  );
}
