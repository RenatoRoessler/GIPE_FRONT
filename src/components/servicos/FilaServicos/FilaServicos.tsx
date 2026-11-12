"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ErroSemPermissao } from "@/components/layout/ErroSemPermissao";
import { Button } from "@/components/ui/Button";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { Skeleton } from "@/components/ui/Skeleton";
import { Tabs } from "@/components/ui/Tabs";
import { Toast } from "@/components/ui/Toast";
import { useCan } from "@/hooks/useCan";
import { useIsMobile } from "@/hooks/useMediaQuery";
import { useToast } from "@/hooks/useToast";
import { ApiError } from "@/lib/api/errors";
import { AREA } from "@/lib/permissoes";
import { STATUS_SERVICO, type ItemFila, type StatusServico } from "@/types/servico";
import { CancelarServicoDialog } from "../CancelarServicoDialog";
import { FilaCard } from "../FilaCard";
import { PARAM_ABA, PARAM_STATUS } from "../params";
import { avisoDeStatus, STATUS_DA_FILA, STATUS_ROTULO, type AcaoDeStatus, type StatusDaFila } from "../status";
import { useAtualizarStatusServico } from "../useAtualizarStatusServico";
import { useFilaServicos } from "../useFilaServicos";
import {
  Atualizado,
  BotaoDesfazer,
  Cabecalho,
  Coluna,
  Colunas,
  Desfazer,
  Estado,
  Titulo,
  TituloColuna,
  Vazio,
  VisuallyHidden,
} from "./FilaServicos.styles";

const VAZIO_DA_COLUNA: Record<StatusDaFila, string> = {
  [STATUS_SERVICO.Aguardando]: "Nenhum serviço aguardando.",
  [STATUS_SERVICO.EmExecucao]: "Nenhum serviço em execução.",
  [STATUS_SERVICO.Pronto]: "Nenhum serviço pronto.",
};

const PRAZO_DO_DESFAZER_MS = 6_000;

function contar(total: number): string {
  return total === 1 ? "1 serviço" : `${total} serviços`;
}

// Coluna pedida no endereço; sem ela (ou inválida), Aguardando.
export function statusDaUrl(valor: string | null): StatusDaFila {
  const numero = Number(valor);
  return STATUS_DA_FILA.find((status) => status === numero) ?? STATUS_SERVICO.Aguardando;
}

// "Atualizado há 12 s", "Atualizado há 3 min". Antes da primeira resposta não há o que dizer.
export function textoAtualizado(atualizadoEm: number, agora: number): string | null {
  if (atualizadoEm === 0) return null;
  const segundos = Math.max(0, Math.floor((agora - atualizadoEm) / 1000));
  return segundos < 60 ? `Atualizado há ${segundos} s` : `Atualizado há ${Math.floor(segundos / 60)} min`;
}

function anuncio(item: ItemFila, destino: StatusServico): string {
  return `Serviço de ${item.nomeServico}, placa ${item.placa}, ${STATUS_ROTULO[destino].toLowerCase()}`;
}

interface Desfazimento {
  mensagem: string;
  item: ItemFila;
  // Status de onde o cartão saiu e para onde "Desfazer" o leva de volta.
  voltarPara: StatusServico;
}

// Fila do lavador: três colunas no desktop e abas com contagem no celular. Trocar o status move o cartão na hora; o
// aviso oferece desfazer, e se o back recusar o cartão volta sozinho.
export function FilaServicos() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const celular = useIsMobile();
  const podeCancelarServico = useCan(AREA.ServicosPatio);
  const fila = useFilaServicos();
  const atualizarStatus = useAtualizarStatusServico();
  const { toast, showToast, dismissToast } = useToast();
  const [cancelando, setCancelando] = useState<ItemFila | null>(null);
  const [desfazimento, setDesfazimento] = useState<Desfazimento | null>(null);
  const [anunciado, setAnunciado] = useState("");
  const [agora, setAgora] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => setAgora(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!desfazimento) return;
    const timer = setTimeout(() => setDesfazimento(null), PRAZO_DO_DESFAZER_MS);
    return () => clearTimeout(timer);
  }, [desfazimento]);

  const porStatus = (status: StatusServico) => fila.itens.filter((item) => item.status === status);
  const total = STATUS_DA_FILA.reduce((soma, status) => soma + porStatus(status).length, 0);
  const statusAtual = statusDaUrl(searchParams.get(PARAM_STATUS));

  function trocarStatus(item: ItemFila, destino: StatusServico, comDesfazer: boolean) {
    // O foco vai ao cartão vizinho da mesma coluna, que ocupa o lugar do que saiu.
    const coluna = porStatus(item.status);
    const posicao = coluna.findIndex((outro) => outro.patioServicoId === item.patioServicoId);
    const vizinho = coluna[posicao + 1] ?? coluna[posicao - 1];
    const origem = item.status;
    atualizarStatus.mutate(
      { idPatio: item.idPatio, patioServicoId: item.patioServicoId, destino },
      {
        onSuccess: () => {
          setAnunciado(anuncio(item, destino));
          if (comDesfazer) {
            setDesfazimento({ mensagem: avisoDeStatus(destino), item: { ...item, status: destino }, voltarPara: origem });
          } else {
            setDesfazimento(null);
            showToast(avisoDeStatus(destino));
          }
        },
        onError: (erro) => showToast(erro.message, "error"),
      },
    );
    if (vizinho) {
      requestAnimationFrame(() => document.querySelector<HTMLElement>(`[data-acao-card="${vizinho.patioServicoId}"]`)?.focus());
    }
  }

  function aoAcionar(item: ItemFila, acao: AcaoDeStatus) {
    trocarStatus(item, acao.destino, !acao.correcao);
  }

  function desfazer() {
    if (!desfazimento) return;
    const { item, voltarPara } = desfazimento;
    setDesfazimento(null);
    trocarStatus(item, voltarPara, false);
  }

  function escolherStatus(id: string) {
    router.replace(`${pathname}?${PARAM_ABA}=fila&${PARAM_STATUS}=${id}`, { scroll: false });
  }

  if (fila.erro instanceof ApiError && fila.erro.kind === "forbidden") {
    return <ErroSemPermissao />;
  }

  function colunaDe(status: StatusDaFila) {
    const itens = porStatus(status);
    const rotulo = STATUS_ROTULO[status];
    return (
      <Coluna key={status} aria-label={`${rotulo}, ${contar(itens.length)}`}>
        {!celular && (
          <TituloColuna>
            {rotulo} <span>{itens.length}</span>
          </TituloColuna>
        )}
        {itens.length === 0 ? (
          <Vazio>{VAZIO_DA_COLUNA[status]}</Vazio>
        ) : (
          itens.map((item) => (
            <FilaCard key={item.patioServicoId} item={item} podeCancelarServico={podeCancelarServico} onAcao={aoAcionar} onCancelar={setCancelando} />
          ))
        )}
      </Coluna>
    );
  }

  function conteudo() {
    if (fila.carregando) {
      return (
        <div role="status" aria-label="Carregando a fila">
          <Colunas>
            {[0, 1, 2].map((indice) => (
              <Skeleton key={indice} height="160px" radius="14px" />
            ))}
          </Colunas>
        </div>
      );
    }
    if (!fila.erro && total === 0) {
      return <Vazio>Nenhum serviço na fila. Os serviços acrescentados aos veículos aparecem aqui.</Vazio>;
    }
    if (celular) {
      const abas = STATUS_DA_FILA.map((status) => ({ id: String(status), label: `${STATUS_ROTULO[status]} (${porStatus(status).length})` }));
      return (
        <Tabs tabs={abas} value={String(statusAtual)} onChange={escolherStatus} aria-label="Colunas da fila" variant="segmentada">
          {colunaDe(statusAtual)}
        </Tabs>
      );
    }
    return <Colunas>{STATUS_DA_FILA.map(colunaDe)}</Colunas>;
  }

  const atualizado = textoAtualizado(fila.atualizadoEm, agora);

  return (
    <section aria-label="Fila de serviços">
      <Cabecalho>
        <Titulo>Fila de serviços{!fila.carregando && ` (${total})`}</Titulo>
        {atualizado && <Atualizado>{atualizado}</Atualizado>}
      </Cabecalho>
      {fila.erro && (
        <Estado>
          <ErrorBanner role="alert">{fila.erro.message}</ErrorBanner>
          <Button variant="secondary" onClick={() => void fila.refetch()}>
            Tentar novamente
          </Button>
        </Estado>
      )}
      {conteudo()}
      <VisuallyHidden aria-live="polite">{anunciado}</VisuallyHidden>
      {desfazimento && (
        <Desfazer role="status">
          <span>{desfazimento.mensagem}</span>
          <BotaoDesfazer type="button" onClick={desfazer}>
            Desfazer
          </BotaoDesfazer>
        </Desfazer>
      )}
      {cancelando && (
        <CancelarServicoDialog
          item={cancelando}
          onClose={() => setCancelando(null)}
          onCancelado={() => {
            setCancelando(null);
            showToast("Serviço cancelado.");
            // O cartão cancelado saiu da fila: o foco vai ao primeiro que sobrou, em vez de se perder.
            requestAnimationFrame(() => document.querySelector<HTMLElement>("[data-acao-card]")?.focus());
          }}
        />
      )}
      {toast && <Toast message={toast.message} variant={toast.variant} onDismiss={dismissToast} />}
    </section>
  );
}
