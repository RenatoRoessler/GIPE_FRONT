import { z } from "zod";
import type { PlanoAdesao } from "@/types/plano";

// `diferencaPercentual`, `promocaoInicio` e `valorPromocional` não entram: `valorAtual` já traz o preço vigente.
export const planoDtoSchema = z.object({
  planoAdesaoId: z.number(),
  plano: z.string().min(1),
  tipoPeriodoPlano: z.number().int(),
  validadeDuracaoMeses: z.number(),
  valor: z.number().nonnegative(),
  valorAtual: z.number().nonnegative(),
  emPromocao: z.boolean(),
  promocaoFim: z.string().nullish(),
  ordemExibicao: z.number(),
});

export type PlanoDto = z.infer<typeof planoDtoSchema>;

const TAMANHO_DATA = "AAAA-MM-DD".length;

// O back-end devolve em caixa alta ("MENSAL"); a tela mostra "Mensal".
function normalizarNome(nome: string): string {
  const texto = nome.trim().toLowerCase();
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

function emCentavos(valor: number): number {
  return Math.round(valor * 100);
}

export function fromPlanoResponse(dto: PlanoDto): PlanoAdesao {
  const centavosTabela = emCentavos(dto.valor);
  const centavosAtual = emCentavos(dto.valorAtual);
  // Dado incoerente (atual não menor que a tabela) não vira promoção: não haveria o que riscar.
  const emPromocao = dto.emPromocao && centavosAtual < centavosTabela;
  // Corta a string em vez de usar `Date`: o fuso do navegador nunca muda o dia que o back-end informou.
  const promocaoAte = emPromocao && dto.promocaoFim ? dto.promocaoFim.slice(0, TAMANHO_DATA) : undefined;

  return {
    id: dto.planoAdesaoId,
    tipo: dto.tipoPeriodoPlano,
    nome: normalizarNome(dto.plano),
    meses: dto.validadeDuracaoMeses,
    centavosTabela,
    centavosAtual,
    emPromocao,
    promocaoAte,
  };
}
