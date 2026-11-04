"use client";

import { useMutation, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";
import { CAIXA_KEY } from "@/components/caixa/useCaixa";
import { PATIO_QUERY_KEY } from "@/components/patio/patioKeys";
import { QUADROS_QUERY_KEY } from "@/components/quadros/quadrosKeys";
import { ApiError } from "@/lib/api/errors";
import {
  descartarSemEntrada,
  finalizarConferencia,
  iniciarConferencia,
  lerPlaca,
  marcarItem,
} from "@/lib/api/services/conferenciaPatio";
import { normalizePlaca } from "@/lib/placa";
import {
  ORIGEM_ITEM,
  type Conferencia,
  type MetodoConferencia,
  type OrigemLeitura,
  type ResultadoLeitura,
  type SituacaoMarcacao,
} from "@/types/conferenciaPatio";
import { aplicarItem, aplicarLeitura, descartarSemEntradaLocal } from "./conferencia";
import { conferenciaAbertaKey, conferenciaResumoKey } from "./conferenciaKeys";

// A mesma placa vista de novo pela câmera dentro deste intervalo não vira outra leitura.
export const REPETICAO_LEITURA_MS = 5000;

export type UltimaLeitura = { placa: string; leitura: ResultadoLeitura };

export interface UseConferenciaAcoesOptions {
  // Uma leitura que falhou não é recolocada na fila: o operador reaponta a câmera ou digita a placa.
  onErroLeitura?: (placa: string, error: unknown) => void;
}

// Saída e entrada pela conferência mudam o pátio, o caixa e os ganchos de chave, além da própria conferência.
export function atualizarAposAjuste(queryClient: QueryClient) {
  void queryClient.invalidateQueries({ queryKey: conferenciaAbertaKey });
  void queryClient.invalidateQueries({ queryKey: conferenciaResumoKey });
  void queryClient.invalidateQueries({ queryKey: PATIO_QUERY_KEY });
  void queryClient.invalidateQueries({ queryKey: QUADROS_QUERY_KEY });
  void queryClient.invalidateQueries({ queryKey: CAIXA_KEY });
}

// A conferência aberta (cache de `conferenciaAbertaKey`) é a fonte única da tela: cada ação espera a resposta do servidor
// e só então muda o cache, para o operador nunca ver "Conferido" de algo que não foi gravado.
export function useConferenciaAcoes(conferencia: Conferencia | null, { onErroLeitura }: UseConferenciaAcoesOptions = {}) {
  const queryClient = useQueryClient();
  const conferenciaId = conferencia?.patioConferenciaId ?? null;
  const [ultimaLeitura, setUltimaLeitura] = useState<UltimaLeitura | null>(null);

  // Leituras em série: uma requisição por vez, na ordem em que foram vistas, para respostas fora de ordem não se desfazerem.
  const filaRef = useRef<Promise<unknown>>(Promise.resolve());
  const vistasRef = useRef(new Map<string, number>());
  const onErroLeituraRef = useRef(onErroLeitura);

  useEffect(() => {
    onErroLeituraRef.current = onErroLeitura;
  });

  const alterarCache = useCallback(
    (atualizar: (atual: Conferencia) => Conferencia, id: number) => {
      queryClient.setQueryData<Conferencia | null>(conferenciaAbertaKey, (atual) =>
        atual && atual.patioConferenciaId === id ? atualizar(atual) : atual,
      );
    },
    [queryClient],
  );

  const iniciarMutation = useMutation({
    mutationFn: (metodo: MetodoConferencia) => iniciarConferencia(metodo),
    onSuccess: (nova) => {
      queryClient.setQueryData<Conferencia | null>(conferenciaAbertaKey, nova);
      void queryClient.invalidateQueries({ queryKey: conferenciaResumoKey });
    },
    onError: (error) => {
      // Outro operador já iniciou: a tela passa a mostrar "Continuar conferência".
      if (error instanceof ApiError && error.kind === "validation") {
        void queryClient.invalidateQueries({ queryKey: conferenciaAbertaKey });
        void queryClient.invalidateQueries({ queryKey: conferenciaResumoKey });
      }
    },
  });

  const lerMutation = useMutation({
    mutationFn: ({ id, placa, origem }: { id: number; placa: string; origem: OrigemLeitura }) => {
      const execucao = filaRef.current.then(() => lerPlaca(id, { placa, origem }));
      // A fila segue mesmo quando esta leitura falha.
      filaRef.current = execucao.catch(() => undefined);
      return execucao;
    },
  });

  const ler = useCallback(
    async (placaLida: string, origem: OrigemLeitura): Promise<ResultadoLeitura | null> => {
      if (conferenciaId === null) {
        return null;
      }
      const placa = normalizePlaca(placaLida);
      if (placa === "") {
        return null;
      }
      const agora = Date.now();
      const vista = vistasRef.current.get(placa);
      if (origem === ORIGEM_ITEM.Camera && vista !== undefined && agora - vista < REPETICAO_LEITURA_MS) {
        return null;
      }
      vistasRef.current.set(placa, agora);
      try {
        const leitura = await lerMutation.mutateAsync({ id: conferenciaId, placa, origem });
        alterarCache((atual) => aplicarLeitura(atual, leitura), conferenciaId);
        setUltimaLeitura({ placa, leitura });
        return leitura;
      } catch (error) {
        // Sem registro da leitura: a mesma placa pode ser tentada de novo logo em seguida.
        vistasRef.current.delete(placa);
        onErroLeituraRef.current?.(placa, error);
        throw error;
      }
    },
    [alterarCache, conferenciaId, lerMutation],
  );

  const marcarMutation = useMutation({
    mutationFn: ({ id, itemId, situacao }: { id: number; itemId: number; situacao: SituacaoMarcacao }) => marcarItem(id, itemId, situacao),
    onSuccess: (item, { id }) => alterarCache((atual) => aplicarItem(atual, item), id),
  });

  const descartarMutation = useMutation({
    mutationFn: ({ id, placa }: { id: number; placa: string }) => descartarSemEntrada(id, placa),
    onSuccess: (_resultado, { id, placa }) => {
      alterarCache((atual) => descartarSemEntradaLocal(atual, normalizePlaca(placa)), id);
      void queryClient.invalidateQueries({ queryKey: conferenciaAbertaKey });
    },
  });

  const finalizarMutation = useMutation({
    mutationFn: ({ id, observacao }: { id: number; observacao?: string }) => finalizarConferencia(id, observacao),
    onSuccess: () => {
      queryClient.setQueryData<Conferencia | null>(conferenciaAbertaKey, null);
      void queryClient.invalidateQueries({ queryKey: conferenciaResumoKey });
    },
  });

  const marcar = useCallback(
    (itemId: number, situacao: SituacaoMarcacao) => {
      if (conferenciaId === null) {
        return Promise.resolve(null);
      }
      return marcarMutation.mutateAsync({ id: conferenciaId, itemId, situacao });
    },
    [conferenciaId, marcarMutation],
  );

  const descartar = useCallback(
    (placa: string) => {
      if (conferenciaId === null) {
        return Promise.resolve();
      }
      return descartarMutation.mutateAsync({ id: conferenciaId, placa });
    },
    [conferenciaId, descartarMutation],
  );

  const finalizar = useCallback(
    (observacao?: string): Promise<Conferencia | null> => {
      if (conferenciaId === null) {
        return Promise.resolve(null);
      }
      return finalizarMutation.mutateAsync({ id: conferenciaId, observacao });
    },
    [conferenciaId, finalizarMutation],
  );

  return {
    iniciar: iniciarMutation.mutateAsync,
    iniciando: iniciarMutation.isPending,
    erroIniciar: iniciarMutation.error,
    ler,
    lendo: lerMutation.isPending,
    ultimaLeitura,
    marcar,
    marcando: marcarMutation.isPending,
    descartar,
    descartando: descartarMutation.isPending,
    finalizar,
    finalizando: finalizarMutation.isPending,
    erroFinalizar: finalizarMutation.error,
  };
}
