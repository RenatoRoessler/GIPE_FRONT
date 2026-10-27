import type { KeyBoardLinha } from "@/components/ui/KeyBoardGrid";
import type { LinhaQuadroPayload, QuadroChaves, QuadroFormValues } from "@/types/quadroChaves";

export const MAX_LINHAS = 26;
export const MAX_COLUNAS = 255;
// Acima disso a prévia do quadro deixa de ser utilizável na tela.
export const MAX_POSICOES = 600;

type Dimensoes = Pick<QuadroFormValues, "linhas" | "colunas" | "foraDeUso">;

// 0 -> "A", 25 -> "Z".
export function rotuloLinha(indice: number): string {
  return String.fromCharCode(65 + indice);
}

// "A", 2 -> "A2".
export function rotuloGancho(linha: string, coluna: number): string {
  return `${linha}${coluna}`;
}

export function rotulosLinhas(linhas: number): string[] {
  return Array.from({ length: linhas }, (_, indice) => rotuloLinha(indice));
}

// Total de ganchos que o quadro terá, descontados os fora de uso.
export function totalEmUso({ linhas, colunas, foraDeUso }: Dimensoes): number {
  const rotulos = new Set(
    rotulosLinhas(linhas).flatMap((linha) => Array.from({ length: colunas }, (_, i) => rotuloGancho(linha, i + 1))),
  );
  return rotulos.size - foraDeUso.filter((rotulo) => rotulos.has(rotulo)).length;
}

// "Fora de uso" não existe no back: a posição simplesmente não é enviada (as colunas não precisam ser seguidas).
// Linhas que ficam sem nenhuma coluna também são omitidas, porque o back exige ao menos uma.
export function gerarPayload(valores: Dimensoes): LinhaQuadroPayload[] {
  const fora = new Set(valores.foraDeUso);
  return rotulosLinhas(valores.linhas)
    .map((linha) => ({
      linha,
      colunas: Array.from({ length: valores.colunas }, (_, i) => i + 1).filter(
        (coluna) => !fora.has(rotuloGancho(linha, coluna)),
      ),
    }))
    .filter((linha) => linha.colunas.length > 0);
}

// Só as posições que ainda não existem no quadro.
export function diffAcrescimo(quadro: QuadroChaves, valores: Dimensoes): LinhaQuadroPayload[] {
  const existentes = new Set(
    quadro.linhas.flatMap((linha) =>
      linha.colunas.map((posicao) => rotuloGancho(linha.linha.toUpperCase(), posicao.coluna)),
    ),
  );
  return gerarPayload(valores)
    .map((linha) => ({
      linha: linha.linha,
      colunas: linha.colunas.filter((coluna) => !existentes.has(rotuloGancho(linha.linha, coluna))),
    }))
    .filter((linha) => linha.colunas.length > 0);
}

export type GanchoSugerido = { patioQuadroChaveId: number; linha: string; coluna: number };

// Primeiro gancho livre, na ordem do quadro (linha, depois coluna).
export function sugerirGancho(quadro: QuadroChaves | undefined): GanchoSugerido | null {
  for (const linha of quadro?.linhas ?? []) {
    const livre = linha.colunas.find((posicao) => posicao.disponivel);
    if (livre) {
      return { patioQuadroChaveId: livre.patioQuadroChaveId, linha: linha.linha, coluna: livre.coluna };
    }
  }
  return null;
}

export function contarLivres(quadro: QuadroChaves): number {
  return quadro.linhas.reduce((soma, linha) => soma + linha.colunas.filter((posicao) => posicao.disponivel).length, 0);
}

export function contarPosicoes(quadro: QuadroChaves): number {
  return quadro.linhas.reduce((soma, linha) => soma + linha.colunas.length, 0);
}

// O quadro com mais ganchos livres; no empate, o primeiro da lista.
export function escolherQuadroInicial(quadros: QuadroChaves[]): QuadroChaves | undefined {
  return quadros.reduce<QuadroChaves | undefined>(
    (melhor, quadro) => (melhor === undefined || contarLivres(quadro) > contarLivres(melhor) ? quadro : melhor),
    undefined,
  );
}

// Linhas do quadro no formato da grade. Posição ocupada pela chave de outro veículo vira "ocupado".
export function linhasDaGrade(quadro: QuadroChaves, selecionadoId?: number | null): KeyBoardLinha[] {
  return quadro.linhas.map((linha) => ({
    rotulo: linha.linha,
    ganchos: linha.colunas.map((posicao) => ({
      id: posicao.patioQuadroChaveId,
      coluna: posicao.coluna,
      rotulo: rotuloGancho(linha.linha, posicao.coluna),
      estado: !posicao.disponivel ? "ocupado" : posicao.patioQuadroChaveId === selecionadoId ? "selecionado" : "livre",
    })),
  }));
}

// Rótulo de um gancho pelo id, para as mensagens ("Excluir o gancho A3?").
export function rotuloDoGancho(quadro: QuadroChaves, patioQuadroChaveId: number): string | null {
  for (const linha of quadro.linhas) {
    const posicao = linha.colunas.find((item) => item.patioQuadroChaveId === patioQuadroChaveId);
    if (posicao) return rotuloGancho(linha.linha, posicao.coluna);
  }
  return null;
}
