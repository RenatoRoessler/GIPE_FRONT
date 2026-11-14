import type { CategoriaFormValues, ServicoFormValues } from "@/lib/schemas/servico";
import { CATEGORIAS_NA_TELA } from "../Catalogo/cartao";

export const SEM_ORIGEM = "Preencha o valor de uma categoria para repetir nas outras.";

export type ResultadoDoRepetir =
  | {
      ok: true;
      valores: ServicoFormValues;
      // Categoria cujos valores foram repetidos e quantas receberam o valor.
      origem: number;
      copiadas: number;
    }
  | { ok: false; erro: string };

const preenchido = (texto: string) => texto.trim() !== "";

// "Repetir a 1ª linha nas vazias": a primeira categoria ligada com valor vira modelo das ligadas que estão sem valor.
// Quem já tem valor não muda; a duração e o tempo grátis da origem, quando existem, vão junto.
export function repetirPrimeiraLinha(valores: ServicoFormValues): ResultadoDoRepetir {
  const origem = CATEGORIAS_NA_TELA.find((id) => valores.categorias[id]?.recebe && preenchido(valores.categorias[id].valor));
  if (origem === undefined) return { ok: false, erro: SEM_ORIGEM };

  const base = valores.categorias[origem];
  const categorias: Record<number, CategoriaFormValues> = { ...valores.categorias };
  let copiadas = 0;
  for (const id of CATEGORIAS_NA_TELA) {
    const linha = valores.categorias[id];
    if (id === origem || !linha.recebe || preenchido(linha.valor)) continue;
    copiadas += 1;
    categorias[id] = {
      ...linha,
      valor: base.valor,
      // Como no protótipo: a duração e o tempo grátis da origem, quando ela os tem, valem para as vazias.
      duracao: preenchido(base.duracao) ? base.duracao : linha.duracao,
      gratis: preenchido(base.gratis) ? base.gratis : linha.gratis,
    };
  }
  return { ok: true, valores: { ...valores, categorias }, origem, copiadas };
}
