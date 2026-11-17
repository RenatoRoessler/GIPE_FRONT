"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ErroSemPermissao } from "@/components/layout/ErroSemPermissao";
import { Button } from "@/components/ui/Button";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { Input } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import { Tabs } from "@/components/ui/Tabs";
import { Toast } from "@/components/ui/Toast";
import { useCan } from "@/hooks/useCan";
import { useAgora } from "@/hooks/useAgora";
import { useIsMobile } from "@/hooks/useMediaQuery";
import { useToast } from "@/hooks/useToast";
import { ApiError } from "@/lib/api/errors";
import { AREA } from "@/lib/permissoes";
import { STATUS_SERVICO, type ItemFila, type StatusServico } from "@/types/servico";
import { CancelarServicoDialog } from "../CancelarServicoDialog";
import { FilaCard } from "../FilaCard";
import { atrasado, filtrarFila, ordenarColuna, outrosNoCarro, statusInicialDaFila } from "../fila";
import { PARAM_STATUS } from "../params";
import { ResumoDaFila, type AlvoDoResumo } from "../ResumoDaFila";
import { avisoDeStatus, STATUS_DA_FILA, STATUS_ROTULO, type AcaoDeStatus, type StatusDaFila } from "../status";
import { useAtualizarStatusServico } from "../useAtualizarStatusServico";
import { useFilaServicos } from "../useFilaServicos";
import {
  AbaConteudo,
  AbaContagem,
  AbaNome,
  Atualizado,
  BotaoDesfazer,
  Busca,
  Cabecalho,
  Coluna,
  Colunas,
  Desfazer,
  Estado,
  Eyebrow,
  PontoAtraso,
  Topo,
  TituloColuna,
  Vazio,
  VisuallyHidden,
} from "./FilaServicos.styles";

const VAZIO_DA_COLUNA: Record<StatusDaFila, string> = {
  [STATUS_SERVICO.Aguardando]: "Nenhum carro esperando serviço.",
  [STATUS_SERVICO.EmExecucao]: "Ninguém lavando agora.",
  [STATUS_SERVICO.Pronto]: "Nenhum carro pronto aguardando retirada.",
};

// Os tempos do cartão são em minutos: renovar a cada 30 s basta, sem redesenhar a fila a cada segundo.
const INTERVALO_DOS_TEMPOS_MS = 30_000;
const hora = new Intl.DateTimeFormat("pt-BR", { timeStyle: "short" });

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

// "Atualizado há N s" muda a cada segundo; fica num componente próprio para só ele ser redesenhado, e não a fila inteira.
function AtualizadoHa({ atualizadoEm }: { atualizadoEm: number }) {
  const agora = useAgora(1000);
  const texto = textoAtualizado(atualizadoEm, agora);
  return texto ? <Atualizado>{texto}</Atualizado> : null;
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
  const [busca, setBusca] = useState("");
  // Aba em que a fila abre no celular: decidida uma única vez, na primeira resposta. Depois disso quem manda é a pessoa
  // (pelo endereço), e as atualizações automáticas não trocam a aba.
  const [statusInicial, setStatusInicial] = useState<StatusDaFila | null>(null);
  if (statusInicial === null && fila.atualizadoEm !== 0) {
    setStatusInicial(statusInicialDaFila(fila.itens));
  }
  const agora = useAgora(INTERVALO_DOS_TEMPOS_MS);
  useEffect(() => {
    if (!desfazimento) return;
    const timer = setTimeout(() => setDesfazimento(null), PRAZO_DO_DESFAZER_MS);
    return () => clearTimeout(timer);
  }, [desfazimento]);

  // A busca por placa ou prisma só filtra o que se vê; o resumo e o "+N no carro" contam a fila inteira.
  const visiveis = filtrarFila(fila.itens, busca);
  const buscando = busca.trim() !== "";
  const porStatus = (status: StatusServico) => visiveis.filter((item) => item.status === status);
  const statusDoEndereco = searchParams.get(PARAM_STATUS);
  const statusAtual = statusDoEndereco !== null ? statusDaUrl(statusDoEndereco) : (statusInicial ?? STATUS_SERVICO.Aguardando);

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
    router.replace(`${pathname}?${PARAM_STATUS}=${id}`, { scroll: false });
  }

  // Tocar numa pílula do resumo abre a aba dela. "Passou da previsão" abre a de em andamento, onde os atrasados vêm
  // primeiro, e leva o primeiro cartão à vista (só rola: o foco fica no botão tocado).
  function selecionarDoResumo(alvo: AlvoDoResumo) {
    const destino: StatusDaFila =
      alvo === "aguardando" ? STATUS_SERVICO.Aguardando : alvo === "pronto" ? STATUS_SERVICO.Pronto : STATUS_SERVICO.EmExecucao;
    escolherStatus(String(destino));
    if (alvo === "atrasados") {
      requestAnimationFrame(() => document.querySelector<HTMLElement>("[data-acao-card]")?.scrollIntoView?.({ block: "nearest" }));
    }
  }

  if (fila.erro instanceof ApiError && fila.erro.kind === "forbidden") {
    return <ErroSemPermissao />;
  }

  function colunaDe(status: StatusDaFila) {
    // Os atrasados ficam no topo da coluna (só há atraso em andamento).
    const itens = ordenarColuna(porStatus(status), agora);
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
            <FilaCard
              key={item.patioServicoId}
              item={item}
              agora={agora}
              outros={outrosNoCarro(fila.itens, item)}
              podeCancelarServico={podeCancelarServico}
              onAcao={aoAcionar}
              onCancelar={setCancelando}
            />
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
    if (!fila.erro && fila.itens.length === 0) {
      return <Vazio>Nenhum serviço na fila. Os serviços acrescentados aos veículos aparecem aqui.</Vazio>;
    }
    if (buscando && visiveis.length === 0) {
      return (
        <Estado>
          <Vazio>Nenhum serviço encontrado para essa placa ou prisma.</Vazio>
          <Button variant="secondary" size="sm" onClick={() => setBusca("")}>
            Limpar busca
          </Button>
        </Estado>
      );
    }
    if (celular) {
      const atrasados = porStatus(STATUS_SERVICO.EmExecucao).filter((item) => atrasado(item, agora)).length;
      const abas = STATUS_DA_FILA.map((status) => {
        const total = porStatus(status).length;
        const rotulo = STATUS_ROTULO[status];
        const comAtraso = status === STATUS_SERVICO.EmExecucao && atrasados > 0;
        const aviso = comAtraso ? `, ${atrasados} ${atrasados === 1 ? "passou" : "passaram"} da previsão` : "";
        return {
          id: String(status),
          label: (
            <AbaConteudo>
              <AbaContagem>
                {comAtraso && <PontoAtraso aria-hidden="true" />}
                {total}
              </AbaContagem>
              <AbaNome>{rotulo}</AbaNome>
            </AbaConteudo>
          ),
          ariaLabel: `${rotulo}, ${contar(total)}${aviso}`,
        };
      });
      return (
        <Tabs tabs={abas} value={String(statusAtual)} onChange={escolherStatus} aria-label="Colunas da fila" variant="segmentada">
          {colunaDe(statusAtual)}
        </Tabs>
      );
    }
    return <Colunas>{STATUS_DA_FILA.map(colunaDe)}</Colunas>;
  }

  return (
    <section aria-label="Fila de serviços">
      <Cabecalho>
        <Topo>
          <Eyebrow>Lava-rápido · agora {hora.format(agora)}</Eyebrow>
          <AtualizadoHa atualizadoEm={fila.atualizadoEm} />
        </Topo>
        {!fila.carregando && !fila.erro && (
          <ResumoDaFila itens={fila.itens} agora={agora} statusAtual={statusAtual} onSelecionar={celular ? selecionarDoResumo : undefined} />
        )}
        <Busca>
          <Input
            label="Placa ou prisma"
            type="search"
            autoComplete="off"
            autoCapitalize="characters"
            placeholder="Placa ou prisma"
            value={busca}
            onChange={(event) => setBusca(event.target.value.toUpperCase())}
            onKeyDown={(event) => {
              if (event.key === "Escape") setBusca("");
            }}
          />
        </Busca>
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
