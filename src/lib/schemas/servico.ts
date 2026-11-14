import { z } from "zod";
import { parseMoney } from "@/lib/money";
import { CATEGORIA_ROTULO, CATEGORIAS_SERVICO, type ServicoPayload } from "@/types/servico";

// O que o formulário guarda de cada categoria de veículo, tudo em texto como nos campos.
export interface CategoriaFormValues {
  // Desligada: o serviço não atende a categoria e o resto da linha é ignorado.
  recebe: boolean;
  valor: string;
  // Minutos que o serviço leva e minutos de permanência grátis nesta categoria. Vazio: sem previsão e sem tempo grátis.
  duracao: string;
  gratis: string;
}

export interface ServicoFormValues {
  nome: string;
  descricao: string;
  // Por categoria (1 a 6). O back não tem preço "para todas": cada categoria que recebe o serviço leva o seu valor.
  categorias: Record<number, CategoriaFormValues>;
}

export const CATEGORIA_FORM_VAZIA: CategoriaFormValues = { recebe: true, valor: "", duracao: "", gratis: "" };

export const SERVICO_FORM_VAZIO: ServicoFormValues = {
  nome: "",
  descricao: "",
  categorias: Object.fromEntries(CATEGORIAS_SERVICO.map((categoria) => [categoria, { ...CATEGORIA_FORM_VAZIA }])),
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

const categoria = z.object({
  recebe: z.boolean(),
  valor: preco,
  duracao: minutos,
  gratis: minutos,
});

const preenchido = (valor: string) => valor.trim() !== "";

export const servicoSchema = z
  .object({
    nome: z.string().trim().min(1, "Informe o nome do serviço.").max(100, "O nome pode ter até 100 caracteres."),
    descricao: z.string().trim().max(255, "A descrição pode ter até 255 caracteres."),
    categorias: z.record(z.string(), categoria),
  })
  .superRefine((valores, contexto) => {
    const ligadas = CATEGORIAS_SERVICO.filter((id) => valores.categorias[id]?.recebe);

    // Sem categoria ligada o serviço não existe para ninguém; o aviso sai pela própria seção (caminho sem campo).
    if (ligadas.length === 0) {
      contexto.addIssue({ code: "custom", path: ["categorias"], message: "Deixe ao menos uma categoria ligada." });
      return;
    }
    for (const id of ligadas) {
      if (!preenchido(valores.categorias[id].valor)) {
        contexto.addIssue({ code: "custom", path: ["categorias", String(id), "valor"], message: `Informe o valor de ${CATEGORIA_ROTULO[id]}.` });
      }
    }
  });

function inteiroOuNulo(valor: string): number | null {
  const texto = valor.trim();
  return texto === "" ? null : Number(texto);
}

// Monta o corpo do back: só as categorias que o serviço atende, com o valor em reais e, quando preenchidos, a duração e o
// tempo grátis da categoria (zero e vazio ficam de fora: o back grava 0 como "sem tempo grátis").
export function toServicoPayload(valores: ServicoFormValues): ServicoPayload {
  const precos: ServicoPayload["precos"] = [];
  for (const id of CATEGORIAS_SERVICO) {
    const linha = valores.categorias[id];
    if (!linha?.recebe || !preenchido(linha.valor)) continue;
    const item: ServicoPayload["precos"][number] = { categoria: id, valor: parseMoney(linha.valor) };
    const duracao = inteiroOuNulo(linha.duracao);
    const gratis = inteiroOuNulo(linha.gratis);
    if (duracao) item.duracaoMinutos = duracao;
    if (gratis) item.tempoPermitidoMinutos = gratis;
    precos.push(item);
  }
  return {
    nome: valores.nome.trim(),
    descricao: valores.descricao.trim() === "" ? null : valores.descricao.trim(),
    precos,
  };
}
