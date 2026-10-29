import { z } from "zod";
import { parseMoney } from "@/lib/money";
import {
  TIPO_CATEGORIA,
  TIPO_CATEGORIA_OPTIONS,
  TIPO_REGRA,
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
    empresaConveniadaId: z.string().regex(/^\d*$/, "Selecione uma empresa conveniada válida"),
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

    // Conveniada e tipo Convênio andam juntos: um não existe sem o outro.
    const ehConvenio = value.tipoRegra === String(TIPO_REGRA.Convenio);
    if (ehConvenio && value.empresaConveniadaId === "") {
      ctx.addIssue({
        code: "custom",
        path: ["empresaConveniadaId"],
        message: "Selecione a empresa conveniada",
      });
    }
    if (!ehConvenio && value.empresaConveniadaId !== "") {
      ctx.addIssue({
        code: "custom",
        path: ["tipoRegra"],
        message: "Com empresa conveniada, selecione o tipo Convênio",
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

const CAMPOS_BASICO = new Set(["descricao", "tipoRegra", "empresaConveniadaId", "inicioVigencia", "fimVigencia"]);

export interface EtapasPreco {
  basico: string[];
  horarios: string[];
  cobranca: string[];
}

function mensagens(result: { success: boolean; error?: z.ZodError }, aceita: (campo: string) => boolean = () => true) {
  if (result.success || !result.error) {
    return [];
  }
  return result.error.issues.filter((issue) => aceita(String(issue.path[0] ?? ""))).map((issue) => issue.message);
}

// Mensagens de erro por etapa do cadastro (vazio = etapa completa). Reaproveita os schemas por formulário:
// "O básico" = campos de identificação e vigência + categorias; "Quanto cobra" = diária, tolerâncias e faixas.
export function validarEtapasPreco(values: PrecoFormValues): EtapasPreco {
  const info = precoInfoSchema.safeParse(values.info);
  return {
    basico: [
      ...mensagens(info, (campo) => CAMPOS_BASICO.has(campo)),
      ...mensagens(precoCategoriasSchema.safeParse({ categorias: values.categorias })),
    ],
    horarios: mensagens(precoHorariosSchema.safeParse({ horarios: values.horarios })),
    cobranca: [
      ...mensagens(info, (campo) => !CAMPOS_BASICO.has(campo)),
      ...mensagens(precoFaixasSchema.safeParse({ faixas: values.faixas })),
    ],
  };
}

// Revalida as três etapas antes do envio; devolve a primeira etapa (1-3) com erro, ou null se tudo é válido.
export function findInvalidPrecoStep(values: PrecoFormValues): 1 | 2 | 3 | null {
  const etapas = validarEtapasPreco(values);
  if (etapas.basico.length > 0) {
    return 1;
  }
  if (etapas.horarios.length > 0) {
    return 2;
  }
  return etapas.cobranca.length > 0 ? 3 : null;
}
