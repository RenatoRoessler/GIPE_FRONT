import { z } from "zod";
import { isValidDocumento } from "@/lib/documento";
import { isValidCPF } from "@/lib/cpf";
import { isValidEmail } from "@/lib/email";
import { parseMoney } from "@/lib/money";
import { isValidCelular } from "@/lib/phone";
import { isValidPlaca, normalizePlaca, PLACA_INVALIDA_MESSAGE } from "@/lib/placa";
import { TIPO_CATEGORIA, TIPO_CATEGORIA_OPTIONS, type TipoCategoria } from "@/types/preco";
import { CATEGORIA_VEICULO_OPTIONS } from "@/types/veiculo";
import { TIPO_PESSOA, type TipoPessoa } from "@/types/mensalista";

const CATEGORIAS = TIPO_CATEGORIA_OPTIONS.map((option) => String(option.value));
const HORARIO = /^([01]\d|2[0-3]):[0-5]\d$/;

// [A CONFIRMAR] O contrato não informa o tamanho máximo do nome/e-mail; limites de tela.
const NOME_MAX = 150;
const EMAIL_MAX = 150;
const TIPO_NOME_MAX = 100;
// Limites documentados pelo back para veículo e condutor.
const MODELO_MAX = 80;
const COR_MAX = 50;
const CONDUTOR_NOME_MAX = 100;

const CATEGORIAS_VEICULO = CATEGORIA_VEICULO_OPTIONS.map((option) => String(option.value));

const condutorSchema = z.object({
  uid: z.string(),
  nome: z
    .string()
    .trim()
    .min(1, "Informe o nome do condutor")
    .max(CONDUTOR_NOME_MAX, `Use no máximo ${CONDUTOR_NOME_MAX} caracteres`),
  cpf: z
    .string()
    .trim()
    .min(1, "Informe o CPF do condutor")
    .refine((value) => value === "" || isValidCPF(value), "CPF inválido"),
});

const veiculoSchema = z.object({
  uid: z.string(),
  placa: z.string().trim().min(1, "Informe a placa").refine((value) => value === "" || isValidPlaca(value), PLACA_INVALIDA_MESSAGE),
  modelo: z.string().trim().max(MODELO_MAX, `Use no máximo ${MODELO_MAX} caracteres`),
  cor: z.string().trim().max(COR_MAX, `Use no máximo ${COR_MAX} caracteres`),
  categoria: z.string().refine((value) => CATEGORIAS_VEICULO.includes(value), "Selecione a categoria"),
  condutores: z.array(condutorSchema),
});

export type MensalistaSchemaOptions = {
  // Categoria do tipo de mensalidade escolhido (99 = todas); null enquanto nenhum tipo foi escolhido.
  categoriaTipo: TipoCategoria | null;
};

// A regra de categoria do veículo depende do tipo escolhido: por isso o schema é montado pelo modal.
export function createMensalistaSchema({ categoriaTipo }: MensalistaSchemaOptions) {
  return z
    .object({
      mensalistaTipoId: z.string().min(1, "Selecione o tipo de mensalidade"),
      tipoPessoa: z.enum([String(TIPO_PESSOA.Fisica), String(TIPO_PESSOA.Juridica)]),
      documento: z.string().trim().min(1, "Informe o documento"),
      nome: z.string().trim().min(1, "Informe o nome").max(NOME_MAX, `Use no máximo ${NOME_MAX} caracteres`),
      email: z
        .string()
        .trim()
        .min(1, "Informe o e-mail")
        .max(EMAIL_MAX, `Use no máximo ${EMAIL_MAX} caracteres`)
        .refine(isValidEmail, "E-mail inválido"),
      celular: z
        .string()
        .trim()
        .min(1, "Informe o celular")
        .refine(isValidCelular, "Celular inválido. Use DDD + 9 dígitos"),
      diaVencimento: z
        .string()
        .trim()
        .min(1, "Informe o dia de vencimento")
        .refine((value) => /^\d+$/.test(value) && Number(value) >= 1 && Number(value) <= 31, "Informe um dia de 1 a 31"),
      ativo: z.boolean(),
      veiculos: z.array(veiculoSchema),
    })
    .superRefine((values, ctx) => {
      const pessoa = Number(values.tipoPessoa) as TipoPessoa;
      if (values.documento.trim() !== "" && !isValidDocumento(values.documento, pessoa)) {
        ctx.addIssue({
          code: "custom",
          path: ["documento"],
          message: pessoa === TIPO_PESSOA.Fisica ? "CPF inválido" : "CNPJ inválido",
        });
      }

      // Placa repetida: todas as ocorrências são marcadas.
      const ocorrencias = new Map<string, number>();
      for (const veiculo of values.veiculos) {
        const placa = normalizePlaca(veiculo.placa);
        if (placa !== "") {
          ocorrencias.set(placa, (ocorrencias.get(placa) ?? 0) + 1);
        }
      }

      values.veiculos.forEach((veiculo, index) => {
        const placa = normalizePlaca(veiculo.placa);
        if ((ocorrencias.get(placa) ?? 0) > 1) {
          ctx.addIssue({ code: "custom", path: ["veiculos", index, "placa"], message: "Placa já informada neste cadastro" });
        }

        // Tipo com categoria específica: o veículo tem a mesma; tipo "todas": qualquer uma (a lista já exclui o 99).
        const categoriaEspecifica = categoriaTipo !== null && categoriaTipo !== TIPO_CATEGORIA.Todas;
        if (categoriaEspecifica && veiculo.categoria !== "" && veiculo.categoria !== String(categoriaTipo)) {
          ctx.addIssue({
            code: "custom",
            path: ["veiculos", index, "categoria"],
            message: "A categoria deve ser a do tipo de mensalidade",
          });
        }

        // Condutores só valem para pessoa jurídica; na física a lista é ignorada.
        if (pessoa !== TIPO_PESSOA.Juridica) {
          return;
        }
        if (veiculo.condutores.length === 0) {
          ctx.addIssue({
            code: "custom",
            path: ["veiculos", index, "condutores"],
            message: "Informe pelo menos um condutor",
          });
        }
        const cpfs = new Map<string, number>();
        for (const condutor of veiculo.condutores) {
          const cpf = condutor.cpf.replace(/\D/g, "");
          if (cpf !== "") {
            cpfs.set(cpf, (cpfs.get(cpf) ?? 0) + 1);
          }
        }
        veiculo.condutores.forEach((condutor, condutorIndex) => {
          if ((cpfs.get(condutor.cpf.replace(/\D/g, "")) ?? 0) > 1) {
            ctx.addIssue({
              code: "custom",
              path: ["veiculos", index, "condutores", condutorIndex, "cpf"],
              message: "Este CPF já está neste veículo",
            });
          }
        });
      });
    });
}

// Sem tipo escolhido ainda: nenhuma exigência de categoria além de ser uma categoria de veículo.
export const mensalistaSchema = createMensalistaSchema({ categoriaTipo: null });

export const tipoSchema = z
  .object({
    tipoMensal: z
      .string()
      .trim()
      .min(1, "Informe o nome do tipo")
      .max(TIPO_NOME_MAX, `Use no máximo ${TIPO_NOME_MAX} caracteres`),
    categoria: z.string().refine((value) => CATEGORIAS.includes(value), "Selecione a categoria"),
    valorMensalidade: z
      .string()
      .trim()
      .min(1, "Informe o valor da mensalidade")
      .refine((value) => !Number.isNaN(parseMoney(value)), "Informe um valor válido, ex.: 280,00")
      .refine((value) => Number.isNaN(parseMoney(value)) || parseMoney(value) > 0, "O valor deve ser maior que zero"),
    horarioEntrada: z.string().trim().refine((value) => value === "" || HORARIO.test(value), "Horário inválido"),
    horarioSaida: z.string().trim().refine((value) => value === "" || HORARIO.test(value), "Horário inválido"),
    ativo: z.boolean(),
  })
  .superRefine((values, ctx) => {
    const entrada = values.horarioEntrada.trim();
    const saida = values.horarioSaida.trim();
    // Saída menor que a entrada é permitido (turno que vira a noite); só exige os dois juntos.
    if (entrada !== "" && saida === "") {
      ctx.addIssue({ code: "custom", path: ["horarioSaida"], message: "Informe o horário de saída" });
    }
    if (saida !== "" && entrada === "") {
      ctx.addIssue({ code: "custom", path: ["horarioEntrada"], message: "Informe o horário de entrada" });
    }
  });
