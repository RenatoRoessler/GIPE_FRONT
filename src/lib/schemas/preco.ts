import { z } from "zod";
import { parseMoney } from "@/lib/money";
import {
  TIPO_CATEGORIA,
  TIPO_CATEGORIA_OPTIONS,
  TIPO_REGRA_OPTIONS,
  type PrecoFormValues,
} from "@/types/preco";

const INTEGER = /^\d+$/;

function integerField(requiredMessage: string, invalidMessage: string) {
  return z.string().trim().min(1, requiredMessage).regex(INTEGER, invalidMessage);
}

function moneyField(requiredMessage: string) {
  return z
    .string()
    .trim()
    .min(1, requiredMessage)
    .refine((value) => !Number.isNaN(parseMoney(value)), "Informe um valor válido, ex.: 15,00");
}

const TIPOS_REGRA = TIPO_REGRA_OPTIONS.map((option) => String(option.value));

export const precoInfoSchema = z
  .object({
    descricao: z.string().trim().min(1, "Informe a descrição"),
    tipoRegra: z.string().refine((value) => TIPOS_REGRA.includes(value), "Selecione o tipo de regra"),
    prioridade: integerField("Informe a prioridade", "Use um número inteiro maior ou igual a zero"),
    inicioVigencia: z.string().trim().min(1, "Informe o início da vigência"),
    fimVigencia: z.string().trim(),
    toleranciaEntradaMinutos: integerField("Informe a tolerância", "Use um número inteiro de minutos"),
    toleranciaAlteracaoFaixaMinutos: integerField("Informe a tolerância", "Use um número inteiro de minutos"),
    periodoDiaria: integerField("Informe o período da diária", "Use um número inteiro de minutos").refine(
      (value) => Number(value) > 0,
      "O período deve ser maior que zero",
    ),
    valorDiaria: moneyField("Informe o valor da diária"),
    valorAdicionalDiaria: moneyField("Informe o valor adicional"),
    ativo: z.boolean(),
  })
  .superRefine((value, ctx) => {
    // Strings no formato "YYYY-MM-DDTHH:mm" comparam corretamente em ordem lexicográfica.
    if (value.fimVigencia !== "" && value.inicioVigencia !== "" && value.fimVigencia <= value.inicioVigencia) {
      ctx.addIssue({
        code: "custom",
        path: ["fimVigencia"],
        message: "O fim deve ser posterior ao início da vigência",
      });
    }
  });

const horarioSchema = z
  .object({
    diaSemana: z.string().regex(/^[1-7]$/, "Selecione o dia da semana"),
    horaInicio: z.string().trim().min(1, "Informe a hora de início"),
    horaFim: z.string().trim().min(1, "Informe a hora de fim"),
    dataInicio: z.string().trim(),
    dataFim: z.string().trim(),
    ativo: z.boolean(),
  })
  .superRefine((value, ctx) => {
    if (value.horaInicio !== "" && value.horaFim !== "" && value.horaFim <= value.horaInicio) {
      ctx.addIssue({ code: "custom", path: ["horaFim"], message: "A hora de fim deve ser após a de início" });
    }
    if (value.dataInicio !== "" && value.dataFim !== "" && value.dataFim < value.dataInicio) {
      ctx.addIssue({ code: "custom", path: ["dataFim"], message: "A data final não pode ser anterior à inicial" });
    }
  });

export const precoHorariosSchema = z
  .object({
    horarios: z.array(horarioSchema).min(1, "Cadastre ao menos um horário"),
  })
  .superRefine((value, ctx) => {
    const seen = new Set<string>();
    value.horarios.forEach((horario, index) => {
      const key = [
        horario.diaSemana,
        horario.horaInicio,
        horario.horaFim,
        horario.dataInicio,
        horario.dataFim,
      ].join("|");
      if (seen.has(key)) {
        ctx.addIssue({
          code: "custom",
          path: ["horarios", index, "diaSemana"],
          message: "Horário repetido para este dia",
        });
      }
      seen.add(key);
    });
  });

const faixaSchema = z.object({
  minutosLimite: integerField("Informe os minutos", "Use um número inteiro de minutos").refine(
    (value) => Number(value) > 0,
    "Os minutos devem ser maiores que zero",
  ),
  valor: moneyField("Informe o valor"),
  percentualConveniada: z
    .string()
    .trim()
    .refine((value) => {
      if (value === "") {
        return true;
      }
      const percent = parseMoney(value);
      return !Number.isNaN(percent) && percent >= 0 && percent <= 100;
    }, "Informe um percentual entre 0 e 100"),
});

export const precoFaixasSchema = z
  .object({
    faixas: z.array(faixaSchema).min(1, "Cadastre ao menos uma faixa de valor"),
  })
  .superRefine((value, ctx) => {
    const seen = new Set<number>();
    value.faixas.forEach((faixa, index) => {
      const minutos = Number(faixa.minutosLimite);
      if (seen.has(minutos)) {
        ctx.addIssue({
          code: "custom",
          path: ["faixas", index, "minutosLimite"],
          message: "Já existe uma faixa com esse limite",
        });
      }
      seen.add(minutos);
    });
  });

const CATEGORIAS = TIPO_CATEGORIA_OPTIONS.map((option) => option.value as number);

export const precoCategoriasSchema = z
  .object({
    categorias: z
      .array(z.number().refine((value) => CATEGORIAS.includes(value), "Categoria inválida"))
      .min(1, "Selecione ao menos uma categoria"),
  })
  .refine(
    ({ categorias }) => !categorias.includes(TIPO_CATEGORIA.Todas) || categorias.length === 1,
    { path: ["categorias"], message: "\"Todas\" não pode ser combinada com outras categorias" },
  );

// Revalida as quatro etapas antes do envio; devolve a primeira etapa (1-4) com erro, ou null se tudo é válido.
export function findInvalidPrecoStep(values: PrecoFormValues): 1 | 2 | 3 | 4 | null {
  if (!precoInfoSchema.safeParse(values.info).success) {
    return 1;
  }
  if (!precoHorariosSchema.safeParse({ horarios: values.horarios }).success) {
    return 2;
  }
  if (!precoFaixasSchema.safeParse({ faixas: values.faixas }).success) {
    return 3;
  }
  if (!precoCategoriasSchema.safeParse({ categorias: values.categorias }).success) {
    return 4;
  }
  return null;
}
