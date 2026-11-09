"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { parseFiltroSituacao, type FiltroSituacao } from "../filtros";

export const BUSCA_DEBOUNCE_MS = 300;
const BASE_PATH = "/precos";

export type PrecoSalvo = "criado" | "atualizado";

function parsePagina(value: string | null): number {
  const page = Number(value);
  return Number.isInteger(page) && page >= 1 ? page : 1;
}

function parsePreco(value: string | null): number | null {
  if (value === null || !/^\d+$/.test(value)) {
    return null;
  }
  const id = Number(value);
  return id >= 1 ? id : null;
}

function parseSalvo(value: string | null): PrecoSalvo | null {
  return value === "criado" || value === "atualizado" ? value : null;
}

interface Partes {
  q: string;
  situacao: FiltroSituacao;
  pagina: number;
  preco: number | null;
  salvo: PrecoSalvo | null;
  lista: boolean;
}

// Só o que foge do padrão vai para o endereço: `/precos` limpo significa "tudo, página 1, sem seleção, lista fechada".
function montarUrl({ q, situacao, pagina, preco, salvo, lista }: Partes): string {
  const params = new URLSearchParams();
  if (preco !== null) params.set("preco", String(preco));
  if (q.trim() !== "") params.set("q", q.trim());
  if (situacao !== "todas") params.set("situacao", situacao);
  if (pagina > 1) params.set("pagina", String(pagina));
  if (lista) params.set("lista", "1");
  if (salvo) params.set("salvo", salvo);
  const texto = params.toString();
  return texto ? `${BASE_PATH}?${texto}` : BASE_PATH;
}

export interface PrecosUrlState {
  // Texto do campo de busca (imediato); o endereço recebe o valor depois do debounce.
  q: string;
  situacao: FiltroSituacao;
  pagina: number;
  // Tabela escolhida explicitamente (vinda do endereço); nulo quando só vale a seleção padrão.
  preco: number | null;
  salvo: PrecoSalvo | null;
  // A lista completa (busca, filtros e paginação) está aberta.
  listaAberta: boolean;
  setQ: (value: string) => void;
  setSituacao: (value: FiltroSituacao) => void;
  setPagina: (value: number) => void;
  // Trocar de tabela substitui a entrada do histórico e fecha a lista completa; `push` cria uma entrada nova.
  selecionar: (id: number | null, opcoes?: { push?: boolean }) => void;
  // Abrir cria uma entrada no histórico: o botão Voltar do navegador devolve a consulta.
  abrirLista: () => void;
  fecharLista: () => void;
  limparSalvo: () => void;
}

// A navegação da tela vive no endereço (tabela, busca, situação, página e lista aberta): recarregar ou compartilhar
// o link volta ao mesmo ponto, e o botão Voltar do navegador funciona no celular.
export function usePrecosUrlState(): PrecosUrlState {
  const router = useRouter();
  const searchParams = useSearchParams();

  const urlQ = searchParams.get("q") ?? "";
  const situacao = parseFiltroSituacao(searchParams.get("situacao"));
  const pagina = parsePagina(searchParams.get("pagina"));
  const preco = parsePreco(searchParams.get("preco"));
  const salvo = parseSalvo(searchParams.get("salvo"));
  const listaAberta = searchParams.get("lista") === "1";

  const [q, setQ] = useState(urlQ);
  const qDebounced = useDebouncedValue(q, BUSCA_DEBOUNCE_MS);

  // Sempre a versão mais recente dos valores, para o efeito do debounce não gravar dados velhos.
  const atual = useRef<Partes>({ q: urlQ, situacao, pagina, preco, salvo, lista: listaAberta });
  useEffect(() => {
    atual.current = { q: urlQ, situacao, pagina, preco, salvo, lista: listaAberta };
  });

  useEffect(() => {
    if (qDebounced.trim() !== atual.current.q.trim()) {
      router.replace(montarUrl({ ...atual.current, q: qDebounced, pagina: 1 }), { scroll: false });
    }
  }, [qDebounced, router]);

  const alterarQ = useCallback(
    (value: string) => {
      setQ(value);
      // Resultado novo: volta ao início da lista sem esperar o debounce.
      if (pagina > 1) {
        router.replace(montarUrl({ q: urlQ, situacao, pagina: 1, preco, salvo, lista: listaAberta }), { scroll: false });
      }
    },
    [listaAberta, pagina, preco, router, salvo, situacao, urlQ],
  );

  const setSituacao = useCallback(
    (value: FiltroSituacao) => {
      router.replace(montarUrl({ q: urlQ, situacao: value, pagina: 1, preco, salvo, lista: listaAberta }), { scroll: false });
    },
    [listaAberta, preco, router, salvo, urlQ],
  );

  const setPagina = useCallback(
    (value: number) => {
      router.replace(montarUrl({ q: urlQ, situacao, pagina: value, preco, salvo, lista: listaAberta }), { scroll: false });
    },
    [listaAberta, preco, router, salvo, situacao, urlQ],
  );

  const selecionar = useCallback(
    (id: number | null, opcoes: { push?: boolean } = {}) => {
      const url = montarUrl({ q: urlQ, situacao, pagina, preco: id, salvo, lista: false });
      if (opcoes.push) {
        router.push(url, { scroll: false });
      } else {
        router.replace(url, { scroll: false });
      }
    },
    [pagina, router, salvo, situacao, urlQ],
  );

  const abrirLista = useCallback(() => {
    router.push(montarUrl({ q: urlQ, situacao, pagina, preco, salvo, lista: true }), { scroll: false });
  }, [pagina, preco, router, salvo, situacao, urlQ]);

  const fecharLista = useCallback(() => {
    router.replace(montarUrl({ q: urlQ, situacao, pagina, preco, salvo, lista: false }), { scroll: false });
  }, [pagina, preco, router, salvo, situacao, urlQ]);

  const limparSalvo = useCallback(() => {
    router.replace(montarUrl({ q: urlQ, situacao, pagina, preco, salvo: null, lista: listaAberta }), { scroll: false });
  }, [listaAberta, pagina, preco, router, situacao, urlQ]);

  return {
    q,
    situacao,
    pagina,
    preco,
    salvo,
    listaAberta,
    setQ: alterarQ,
    setSituacao,
    setPagina,
    selecionar,
    abrirLista,
    fecharLista,
    limparSalvo,
  };
}
