"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { isValidPlaca, normalizePlaca } from "@/lib/placa";

const DEBOUNCE_MS = 250;
const PARAM_PLACA = "placa";
const PARAM_ESTACIONAMENTO = "estacionamento";
const TAMANHO_PLACA = 7;

function lerEstacionamento(valor: string | null): number | null {
  const id = Number(valor);
  return valor !== null && valor !== "" && Number.isInteger(id) && id >= 0 ? id : null;
}

// Placa e estacionamento vivem na URL: voltar ou recarregar devolve a conveniada ao mesmo recorte. A placa tem estado
// local (a tecla aparece na hora) e só chega à URL depois de uma pausa; nada empilha histórico.
export function usePatioConveniadaFiltros() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [busca, setBusca] = useState(() => searchParams.get(PARAM_PLACA) ?? "");
  const termo = useDebouncedValue(busca.trim(), DEBOUNCE_MS);
  const queryAtual = searchParams.toString();
  const estacionamento = lerEstacionamento(searchParams.get(PARAM_ESTACIONAMENTO));

  const gravar = useCallback(
    (placa: string, empresaId: number | null) => {
      const params = new URLSearchParams();
      if (placa !== "") params.set(PARAM_PLACA, placa);
      if (empresaId !== null) params.set(PARAM_ESTACIONAMENTO, String(empresaId));
      const query = params.toString();
      if (query === queryAtual) return;
      router.replace(query === "" ? pathname : `${pathname}?${query}`, { scroll: false });
    },
    [pathname, queryAtual, router],
  );

  // O termo assentado chega à URL; o estacionamento já é lido dela.
  useEffect(() => {
    gravar(termo, estacionamento);
  }, [termo, estacionamento, gravar]);

  const placa = normalizePlaca(termo);
  // Só a placa completa e válida vai ao servidor; uma placa parcial só filtra a lista que já está na tela.
  const placaEnviada = isValidPlaca(placa) ? placa : "";
  // Completa mas fora dos padrões: o campo avisa e a lista fica como estava.
  const placaInvalida = placa.length === TAMANHO_PLACA && placaEnviada === "";

  return {
    busca,
    setBusca,
    termo,
    placaEnviada,
    placaInvalida,
    estacionamento,
    setEstacionamento: (empresaId: number | null) => gravar(termo, empresaId),
    limparBusca: () => {
      setBusca("");
      gravar("", estacionamento);
    },
    limparFiltros: () => {
      setBusca("");
      gravar("", null);
    },
  };
}
