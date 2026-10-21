"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import { Text } from "@/components/ui/Text";
import type { ToastVariant } from "@/components/ui/Toast";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import type { AgendaGrupoId, AgendaItemData, Mensalista, SituacaoMensalista } from "@/types/mensalista";
import { AGENDA_GRUPO_TITULOS, filtrarAgenda, montarAgenda, totalDeItens, type AgendaAcao } from "../agenda";
import { ListError } from "../ListError";
import { EmptyState, SkeletonRows } from "../Mensalistas.styles";
import { derivarSituacao } from "../situacao";
import { useAgendaMensalistas } from "../useAgendaMensalistas";
import { useContratosMensalistas } from "../useContratosMensalistas";
import { useReenviarContrato } from "../useReenviarContrato";
import { AgendaGrupo } from "./AgendaGrupo";
import { AgendaResumo } from "./AgendaResumo";
import { Anuncio, Barra, Busca, Conteudo, EmDia, Grupos, MaisBotao, Nota } from "./AgendaView.styles";

const DEBOUNCE_MS = 250;
const BUSCA_ID = "agenda-busca";
const ESQUELETO_GRUPOS = 2;
const ESQUELETO_LINHAS = 3;

export interface AgendaViewProps {
  onNovo: () => void;
  onVerFicha: (mensalista: Mensalista) => void;
  // Abre o pagamento, levando a situação já derivada do item.
  onReceberPagamento: (mensalista: Mensalista, situacao: SituacaoMensalista) => void;
  // Leva à aba com todos os cadastros.
  onVerLista: () => void;
  onToast: (message: string, variant?: ToastVariant) => void;
  // Algum modal está aberto: o foco só volta para a agenda depois que ele fecha.
  bloqueado?: boolean;
}

// O que lembrar do item em que o operador clicou "Receber", para devolver o foco quando ele sair da fila.
type Pendente = { id: number; nome: string; grupo: AgendaGrupoId; vizinhos: number[] };

export function AgendaView({ onNovo, onVerFicha, onReceberPagamento, onVerLista, onToast, bloqueado = false }: AgendaViewProps) {
  const { data, isPending, isError, error, refetch, isFetching, isPlaceholderData } = useAgendaMensalistas();
  const contratos = useContratosMensalistas(data?.items ?? []);
  const { reenviar, reenviandoId } = useReenviarContrato({
    onSuccess: ({ email }) =>
      onToast(`Novo link enviado para ${email}. Vale por 7 dias; o link anterior deixa de funcionar.`),
    onError: (message) => onToast(message, "error"),
  });
  const [busca, setBusca] = useState("");
  const termo = useDebouncedValue(busca.trim(), DEBOUNCE_MS);
  const [anuncio, setAnuncio] = useState("");
  const pendente = useRef<Pendente | null>(null);
  const container = useRef<HTMLDivElement>(null);

  const hoje = new Date();
  const agenda = data
    ? montarAgenda(data.items, (m) => derivarSituacao(m, contratos.get(m.mensalistaId), hoje), hoje)
    : null;
  const resultado = agenda ? filtrarAgenda(agenda, termo) : null;
  const buscando = termo !== "";
  const idsVisiveis = resultado?.grupos.flatMap((grupo) => grupo.itens.map((item) => item.mensalista.mensalistaId)).join(",") ?? "";

  // Depois de um pagamento o item sai da fila: o foco vai para o vizinho que ocupa o lugar, e o leitor de tela é avisado.
  useEffect(() => {
    const ultimo = pendente.current;
    if (!ultimo || bloqueado) {
      return;
    }
    pendente.current = null;
    const presentes = new Set(idsVisiveis.split(",").filter(Boolean).map(Number));
    if (presentes.has(ultimo.id)) {
      return;
    }
    setAnuncio(`${ultimo.nome} saiu de ${AGENDA_GRUPO_TITULOS[ultimo.grupo]}.`);
    const proximo = ultimo.vizinhos.find((id) => presentes.has(id));
    const raiz = container.current;
    const alvo =
      (proximo !== undefined && raiz?.querySelector<HTMLElement>(`[data-agenda-nome="${proximo}"]`)) ||
      raiz?.querySelector<HTMLElement>(`[data-agenda-grupo="${ultimo.grupo}"] h3`) ||
      document.getElementById(BUSCA_ID);
    alvo?.focus();
  }, [idsVisiveis, bloqueado]);

  function handleAcao(item: AgendaItemData, acao: AgendaAcao) {
    const { mensalista } = item;
    if (acao === "receber") {
      const grupo = resultado?.grupos.find((candidato) => candidato.id === item.grupo);
      const ordem = grupo?.itens.map((outro) => outro.mensalista.mensalistaId) ?? [];
      const indice = ordem.indexOf(mensalista.mensalistaId);
      pendente.current = {
        id: mensalista.mensalistaId,
        nome: mensalista.nome,
        grupo: item.grupo,
        // Primeiro quem vinha depois, depois quem vinha antes.
        vizinhos: [...ordem.slice(indice + 1), ...ordem.slice(0, Math.max(indice, 0)).reverse()],
      };
      onReceberPagamento(mensalista, item.situacao);
      return;
    }
    reenviar(mensalista.mensalistaId);
  }

  const campoDeBusca = (
    <Busca>
      <Input
        id={BUSCA_ID}
        label="Buscar por nome, placa ou documento"
        value={busca}
        onChange={(event) => setBusca(event.target.value)}
        autoComplete="off"
        placeholder="Nome, placa ou documento"
      />
    </Busca>
  );

  if (isError) {
    return <ListError error={error} what="a agenda" onRetry={() => void refetch()} retrying={isFetching} />;
  }

  if (isPending || !agenda || !resultado) {
    return (
      <div role="status" aria-label="Carregando a agenda">
        <Grupos>
          {Array.from({ length: ESQUELETO_GRUPOS }, (_, grupo) => (
            <SkeletonRows key={grupo}>
              <Skeleton width="180px" height="24px" />
              {Array.from({ length: ESQUELETO_LINHAS }, (_, linha) => (
                <Skeleton key={linha} height="44px" />
              ))}
            </SkeletonRows>
          ))}
        </Grupos>
      </div>
    );
  }

  if (data && data.items.length === 0) {
    return (
      <EmptyState>
        <Text variant="muted">Nenhum mensalista cadastrado.</Text>
        <Button type="button" onClick={onNovo}>
          Novo mensalista
        </Button>
      </EmptyState>
    );
  }

  const encontrados = totalDeItens(resultado);

  return (
    <Conteudo ref={container} $refreshing={isPlaceholderData} aria-busy={isPlaceholderData}>
      <Barra>
        {buscando ? (
          <Text variant="muted" role="status">
            {encontrados === 0
              ? `Nada encontrado para “${termo}”.`
              : `${encontrados} ${encontrados === 1 ? "encontrado" : "encontrados"}`}
          </Text>
        ) : (
          <AgendaResumo resumo={resultado.resumo} truncado={data?.truncado} />
        )}
        {campoDeBusca}
      </Barra>

      {buscando && encontrados === 0 ? (
        <EmptyState>
          <Text variant="muted">Nenhum mensalista com esse nome, placa ou documento.</Text>
          <Button type="button" variant="secondary" onClick={() => setBusca("")}>
            Limpar busca
          </Button>
        </EmptyState>
      ) : resultado.grupos.length === 0 ? (
        <EmptyState>
          <Text variant="muted">Nenhum mensalista para atender até domingo.</Text>
          <Button type="button" variant="secondary" onClick={onVerLista}>
            Ver todos os mensalistas
          </Button>
        </EmptyState>
      ) : (
        <Grupos>
          {resultado.grupos.map((grupo) => (
            <AgendaGrupo
              key={grupo.id}
              grupo={grupo}
              hoje={hoje}
              semLimite={buscando}
              onVerFicha={onVerFicha}
              onAcao={handleAcao}
              reenviandoId={reenviandoId}
            />
          ))}
        </Grupos>
      )}

      {!buscando && agenda.emDia > 0 && resultado.grupos.length > 0 && (
        <EmDia>
          <span>
            {agenda.emDia === 1
              ? "1 mensalista em dia, com vencimento depois de domingo"
              : `${agenda.emDia} mensalistas em dia, com vencimento depois de domingo`}
          </span>
          <MaisBotao type="button" variant="secondary" size="sm" onClick={onVerLista}>
            Ver todos
          </MaisBotao>
        </EmDia>
      )}

      {data?.truncado && (
        <Nota>{`Mostrando os primeiros ${data.items.length} de ${data.totalRecords} mensalistas. Use a Lista para os demais.`}</Nota>
      )}
      <Anuncio role="status">{anuncio}</Anuncio>
    </Conteudo>
  );
}
