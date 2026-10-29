import type { ModeloVeiculo } from "@/types/veiculo";

export const LIMITE_SUGESTOES = 50;

export type ModeloBuscavel = ModeloVeiculo & { chave: string };

export type TrechoDestacado = { antes: string; casado: string; depois: string };

// Sem acento, sem diferença de caixa e sem espaços nas pontas.
export function normalizarBusca(texto: string): string {
  return texto
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

export function prepararModelos(modelos: ModeloVeiculo[]): ModeloBuscavel[] {
  return modelos.map((modelo) => ({ ...modelo, chave: normalizarBusca(modelo.nome) }));
}

// Primeiro os modelos que começam com o texto, depois os que contêm; a ordem da lista é preservada em cada grupo.
export function filtrarModelos(
  modelos: ModeloBuscavel[],
  texto: string,
  limite = LIMITE_SUGESTOES,
): ModeloBuscavel[] {
  const termo = normalizarBusca(texto);
  if (termo === "") {
    return [];
  }
  const comecam: ModeloBuscavel[] = [];
  const contem: ModeloBuscavel[] = [];
  for (const modelo of modelos) {
    const indice = modelo.chave.indexOf(termo);
    if (indice === 0) {
      comecam.push(modelo);
    } else if (indice > 0) {
      contem.push(modelo);
    }
  }
  return [...comecam, ...contem].slice(0, limite);
}

// Divide o nome no trecho digitado. Sem casamento (ou com normalização que muda o tamanho), não destaca nada.
export function destacarTrecho(nome: string, texto: string): TrechoDestacado {
  const termo = normalizarBusca(texto);
  const chave = normalizarBusca(nome);
  const indice = termo === "" || chave.length !== nome.length ? -1 : chave.indexOf(termo);
  if (indice < 0) {
    return { antes: nome, casado: "", depois: "" };
  }
  return {
    antes: nome.slice(0, indice),
    casado: nome.slice(indice, indice + termo.length),
    depois: nome.slice(indice + termo.length),
  };
}
