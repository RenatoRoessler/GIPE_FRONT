import { z } from "zod";
import { parseMoney } from "@/lib/money";
import { CATEGORIA_TODAS, CATEGORIAS_SERVICO, type ServicoPayload } from "@/types/servico";

// Valores do formulário, todos em texto como nos campos. Preço vazio quer dizer "não atende".
export interface ServicoFormValues {
  nome: string;
  descricao: string;
  duracaoMinutos: string;
  tempoPermitidoMinutos: string;
  // Categoria 99: vale para as categorias sem preço próprio.
  precoTodas: string;
  // Preços específicos, por categoria (1 a 6).
  precos: Record<number, string>;
}

export const SERVICO_FORM_VAZIO: ServicoFormValues = {
  nome: "",
  descricao: "",
  duracaoMinutos: "",
  tempoPermitidoMinutos: "",
  precoTodas: "",
  precos: Object.fromEntries(CATEGORIAS_SERVICO.map((categoria) => [categoria, ""])),
};

const minutos = z
  .string()
  .trim()
  .refine((valor) => valor === "" || /^\d+$/.test(valor), "Use só números inteiros.");

function valorValido(valor: string): boolean {
  if (valor.trim() === "") return true;
  const numero = parseMoney(valor);
  return Number.isFinite(numero) && numero > 0 && Math.round(numero * 100) / 100 === numero;
}

const preco = z.string().trim().refine(valorValido, "Informe um valor maior que zero, com até duas casas.");

export const servicoSchema = z
  .object({
    nome: z.string().trim().min(1, "Informe o nome do serviço."),
    descricao: z.string().trim(),
    duracaoMinutos: minutos,
    tempoPermitidoMinutos: minutos,
    precoTodas: preco,
    precos: z.record(z.string(), preco),
  })
  .superRefine((valores, contexto) => {
    const algumPreco = [valores.precoTodas, ...Object.values(valores.precos)].some((valor) => valor.trim() !== "");
    if (!algumPreco) {
      contexto.addIssue({ code: "custom", path: ["precoTodas"], message: "Informe ao menos um preço." });
    }
  });

function inteiroOuNulo(valor: string): number | null {
  const texto = valor.trim();
  return texto === "" ? null : Number(texto);
}

// Monta o corpo do back: descarta os preços vazios, manda os valores em reais e converte tempo permitido 0 em nulo.
export function toServicoPayload(valores: ServicoFormValues): ServicoPayload {
  const precos: ServicoPayload["precos"] = [];
  for (const categoria of CATEGORIAS_SERVICO) {
    const texto = valores.precos[categoria]?.trim() ?? "";
    if (texto !== "") precos.push({ categoria, valor: parseMoney(texto) });
  }
  if (valores.precoTodas.trim() !== "") {
    precos.push({ categoria: CATEGORIA_TODAS, valor: parseMoney(valores.precoTodas) });
  }
  const tempoPermitido = inteiroOuNulo(valores.tempoPermitidoMinutos);
  return {
    nome: valores.nome.trim(),
    descricao: valores.descricao.trim() === "" ? null : valores.descricao.trim(),
    duracaoMinutos: inteiroOuNulo(valores.duracaoMinutos),
    tempoPermitidoMinutos: tempoPermitido === 0 ? null : tempoPermitido,
    precos,
  };
}
