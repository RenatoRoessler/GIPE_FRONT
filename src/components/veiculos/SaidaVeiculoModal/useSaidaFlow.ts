"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";
import { EMPRESA_QUERY_KEY } from "@/components/empresa/MinhaEmpresa/EmpresaForm";
import { getEmpresa } from "@/lib/api/services/empresa";
import { consultarSaida, registrarSaida, resolverBuscaPorToken } from "@/lib/api/services/patio";
import { parseMoney } from "@/lib/money";
import { saidaBuscaSchema, toSaidaBusca, type SaidaBuscaValues } from "@/lib/schemas/saida";
import type { SaidaBusca, SaidaConsulta } from "@/types/saida";
import type { SaidaBuscaField } from "../BuscaManualSaida";
import { QR_INVALIDO_MESSAGE } from "../LeitorQrSaida";
import type { SaidaResultado } from "../ReciboSaidaStep";
import { calcularTroco, FORMA_DINHEIRO, FORMA_PADRAO, getPagamentoStatus, valoresIguais } from "../saida";

// O valor e a permanência dependem do instante da consulta: o servidor recalcula a cada ciclo.
export const INTERVALO_SAIDA_MS = 30_000;
export const BUSCA_DEBOUNCE_MS = 400;
// Depois de uma busca que falhou, o mesmo QR ainda diante da câmera não dispara outra busca por este tempo.
export const REPETICAO_TOKEN_MS = 5000;

export const SAIDA_CONSULTA_KEY = "saida-consulta";
const EMPTY_BUSCA: SaidaBuscaValues = { placa: "", token: "", sequencial: "" };
const ATUALIZACAO_FALHOU = "Não foi possível atualizar o valor. Mantida a última consulta.";

// Derivada dos dados: recibo com a saída registrada, pagamento com um veículo consultado, pesquisa nos demais casos.
export type SaidaFase = "pesquisa" | "pagamento" | "recibo";

type ConfirmInput = { busca: SaidaBusca; consulta: SaidaConsulta; forma: string; recebido: string };
type ConfirmResult =
  | { tipo: "mudou"; nova: SaidaConsulta }
  | { tipo: "registrada"; resultado: SaidaResultado };

export function useSaidaFlow() {
  const queryClient = useQueryClient();

  const [buscaValues, setBuscaValues] = useState<SaidaBuscaValues>(EMPTY_BUSCA);
  const [buscaErrors, setBuscaErrors] = useState<Partial<Record<SaidaBuscaField, string>>>({});
  const [busca, setBusca] = useState<SaidaBusca | null>(null);
  const [avisoQr, setAvisoQr] = useState<string | undefined>();
  const [valorAnterior, setValorAnterior] = useState<number | null>(null);
  const [forma, setForma] = useState(FORMA_PADRAO);
  const [recebido, setRecebido] = useState("");
  const [resultado, setResultado] = useState<SaidaResultado | null>(null);
  const [consultaRecibo, setConsultaRecibo] = useState<SaidaConsulta | null>(null);

  // Último valor exibido: serve para perceber, no ciclo de atualização, que o valor mudou.
  const ultimoValorRef = useRef<number | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Cliques no mesmo instante enxergam o mesmo `isPending`: a trava precisa valer de imediato.
  const enviandoRef = useRef(false);
  const ultimoTokenRef = useRef<string | null>(null);
  const tokenFalhoRef = useRef<{ token: string; em: number } | null>(null);

  const registrarFalhaDoToken = useCallback(() => {
    tokenFalhoRef.current = ultimoTokenRef.current ? { token: ultimoTokenRef.current, em: Date.now() } : null;
  }, []);

  const cancelarDebounce = useCallback(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
  }, []);

  useEffect(() => cancelarDebounce, [cancelarDebounce]);

  const confirmMutation = useMutation({
    mutationFn: async (input: ConfirmInput): Promise<ConfirmResult> => {
      const nova = await consultarSaida(input.busca);
      if (!valoresIguais(nova.valor, input.consulta.valor)) {
        return { tipo: "mudou", nova };
      }
      // [A CONFIRMAR] O backend pode recusar valor divergente do calculado; a mensagem aparece junto ao pagamento.
      const saida = await registrarSaida(input.consulta.patioId, {
        valor: input.consulta.valor,
        formaPagamento: Number(input.forma),
      });
      const emDinheiro = input.forma === FORMA_DINHEIRO;
      const valorRecebido = emDinheiro ? parseMoney(input.recebido) : null;
      return {
        tipo: "registrada",
        resultado: {
          saida,
          recebido: valorRecebido,
          troco: valorRecebido === null ? null : calcularTroco(valorRecebido, saida.valor),
          emitidoEm: new Date().toISOString(),
        },
      };
    },
    onSettled: () => {
      enviandoRef.current = false;
    },
    onSuccess: (data, variables) => {
      if (data.tipo === "mudou") {
        ultimoValorRef.current = data.nova.valor;
        setValorAnterior(variables.consulta.valor);
        queryClient.setQueryData([SAIDA_CONSULTA_KEY, variables.busca], data.nova);
        return;
      }
      setConsultaRecibo(variables.consulta);
      setResultado(data.resultado);
    },
  });

  const consultaQuery = useQuery({
    queryKey: [SAIDA_CONSULTA_KEY, busca],
    queryFn: async () => {
      let nova: SaidaConsulta;
      try {
        nova = await consultarSaida(busca as SaidaBusca);
      } catch (error) {
        registrarFalhaDoToken();
        throw error;
      }
      const anterior = ultimoValorRef.current;
      if (anterior !== null && !valoresIguais(anterior, nova.valor)) {
        setValorAnterior(anterior);
      }
      ultimoValorRef.current = nova.valor;
      return nova;
    },
    enabled: busca !== null && resultado === null,
    refetchInterval: confirmMutation.isPending ? false : INTERVALO_SAIDA_MS,
    refetchOnWindowFocus: false,
    retry: false,
    gcTime: 0,
  });

  const novaBusca = useCallback((proxima: SaidaBusca | null) => {
    ultimoValorRef.current = null;
    setValorAnterior(null);
    setRecebido("");
    setBusca(proxima);
  }, []);

  const qrMutation = useMutation({
    mutationFn: resolverBuscaPorToken,
    onSuccess: (resolvida) => {
      tokenFalhoRef.current = null;
      novaBusca(resolvida);
    },
    onError: registrarFalhaDoToken,
  });

  const consulta = consultaQuery.data ?? null;
  const fase: SaidaFase = resultado ? "recibo" : consulta ? "pagamento" : "pesquisa";

  // Pré-carrega a empresa para o recibo já nascer completo (falha não bloqueia).
  useQuery({
    queryKey: EMPRESA_QUERY_KEY,
    queryFn: getEmpresa,
    enabled: consulta !== null,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  // ---- Leitura por QR ----

  const handleToken = useCallback(
    (lido: string) => {
      const falho = tokenFalhoRef.current;
      if (falho && falho.token === lido && Date.now() - falho.em < REPETICAO_TOKEN_MS) {
        return;
      }
      ultimoTokenRef.current = lido;
      cancelarDebounce();
      setAvisoQr(undefined);
      setBuscaErrors({});
      setBuscaValues(EMPTY_BUSCA);
      novaBusca(null);
      qrMutation.mutate(lido);
    },
    // `mutate` é estável; a mutação inteira muda a cada render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [cancelarDebounce, novaBusca, qrMutation.mutate],
  );

  const handleQrInvalido = useCallback(() => setAvisoQr(QR_INVALIDO_MESSAGE), []);

  // ---- Busca manual ----

  const consultarManual = useCallback(
    (values: SaidaBuscaValues, mostrarErro: boolean) => {
      const vazio = Object.values(values).every((value) => value.trim() === "");
      const result = saidaBuscaSchema.safeParse(values);
      if (vazio || !result.success) {
        if (mostrarErro && !vazio && !result.success) {
          const errors: Partial<Record<SaidaBuscaField, string>> = {};
          for (const issue of result.error.issues) {
            const field = issue.path[0] as SaidaBuscaField;
            errors[field] ??= issue.message;
          }
          setBuscaErrors(errors);
        }
        novaBusca(null);
        return;
      }
      setBuscaErrors({});
      const identificacao = toSaidaBusca(result.data);
      if (identificacao.tipo === "token") {
        // O token digitado segue o mesmo caminho do QR: vira uma busca antes de consultar a saída.
        novaBusca(null);
        ultimoTokenRef.current = identificacao.valor;
        qrMutation.mutate(identificacao.valor);
        return;
      }
      novaBusca(identificacao);
    },
    // `mutate` é estável; a mutação inteira muda a cada render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [novaBusca, qrMutation.mutate],
  );

  const handleBuscaChange = useCallback(
    (field: SaidaBuscaField, value: string) => {
      const proximo = { ...buscaValues, [field]: value };
      setBuscaValues(proximo);
      setBuscaErrors((current) => ({ ...current, [field]: undefined }));
      setAvisoQr(undefined);
      tokenFalhoRef.current = null;
      qrMutation.reset();
      cancelarDebounce();
      // Placa só é consultada completa e o token, quando o operador para de digitar. O sequencial só com Enter:
      // um número parcial ("1" de "12") encontraria outro veículo.
      const incompleta = field === "placa" && value !== "" && value.length < 7;
      if (incompleta || field === "sequencial") {
        novaBusca(null);
        return;
      }
      debounceRef.current = setTimeout(() => consultarManual(proximo, field === "placa"), BUSCA_DEBOUNCE_MS);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [buscaValues, cancelarDebounce, consultarManual, novaBusca, qrMutation.reset],
  );

  const handleBuscaEnter = useCallback(() => {
    cancelarDebounce();
    consultarManual(buscaValues, true);
  }, [buscaValues, cancelarDebounce, consultarManual]);

  // ---- Limpar e confirmar ----

  const limpar = useCallback(() => {
    tokenFalhoRef.current = null;
    ultimoTokenRef.current = null;
    cancelarDebounce();
    qrMutation.reset();
    confirmMutation.reset();
    novaBusca(null);
    setBuscaValues(EMPTY_BUSCA);
    setBuscaErrors({});
    setAvisoQr(undefined);
    setForma(FORMA_PADRAO);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cancelarDebounce, novaBusca, qrMutation.reset, confirmMutation.reset]);

  // Volta para a pesquisa descartando tudo; não vale enquanto a saída está sendo registrada.
  const voltar = useCallback(() => {
    if (enviandoRef.current || confirmMutation.isPending) {
      return;
    }
    limpar();
  }, [confirmMutation.isPending, limpar]);

  const pagamento = consulta ? getPagamentoStatus(forma, recebido, consulta.valor) : null;
  const buscando = qrMutation.isPending || (busca !== null && consultaQuery.isPending);
  const enviando = confirmMutation.isPending;

  const confirmar = useCallback(() => {
    if (!busca || !consulta || enviandoRef.current || !pagamento?.canConfirm) {
      return;
    }
    enviandoRef.current = true;
    confirmMutation.reset();
    confirmMutation.mutate({ busca, consulta, forma, recebido });
  }, [busca, consulta, confirmMutation, forma, pagamento?.canConfirm, recebido]);

  // ---- Avisos ----

  const erroConsulta = qrMutation.isError ? qrMutation.error.message : consultaQuery.isError && !consulta ? consultaQuery.error.message : undefined;
  const falhaAtualizacao = consultaQuery.isError && consulta !== null ? ATUALIZACAO_FALHOU : undefined;
  const aviso = avisoQr ?? erroConsulta ?? falhaAtualizacao;

  const hasProgress =
    resultado === null &&
    (consulta !== null || Object.values(buscaValues).some((value) => value !== ""));

  return {
    fase,
    buscaValues,
    buscaErrors,
    aviso,
    consulta,
    consultaRecibo,
    valorAnterior,
    forma,
    recebido,
    resultado,
    pagamento,
    buscando,
    enviando,
    erroRegistro: confirmMutation.isError ? confirmMutation.error.message : undefined,
    isBusy: buscando || enviando,
    hasProgress,
    handleToken,
    handleQrInvalido,
    handleBuscaChange,
    handleBuscaEnter,
    setForma,
    setRecebido,
    voltar,
    confirmar,
  };
}
