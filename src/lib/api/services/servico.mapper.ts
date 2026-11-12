import { CATEGORIA_ROTULO, isStatusServico, STATUS_SERVICO } from "@/types/servico";
import type { ItemFila, PrecoServico, Servico, ServicoDoVeiculo, ServicosDoVeiculo, StatusServico } from "@/types/servico";
import { toNumber, toText } from "./mapperUtils";

// O swagger não descreve o corpo das respostas: os nomes de campo vêm da descrição dos endpoints e cada leitura aceita
// também a forma mais provável de outro nome, até o back confirmar. Campo ausente ou fora do formato nunca derruba a tela.

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function primeiro(raw: Record<string, unknown>, ...chaves: string[]): unknown {
  for (const chave of chaves) {
    if (raw[chave] !== undefined && raw[chave] !== null) return raw[chave];
  }
  return undefined;
}

function centavos(valor: unknown): number {
  const reais = toNumber(valor);
  return reais === null ? 0 : Math.round(reais * 100);
}

// O back grava tempo permitido 0 como nulo; zero e ausente querem dizer a mesma coisa.
function minutosOuNulo(valor: unknown): number | null {
  const minutos = toNumber(valor);
  return minutos === null || minutos <= 0 ? null : minutos;
}

function fromPreco(raw: unknown): PrecoServico | null {
  if (!isRecord(raw)) return null;
  const categoria = toNumber(raw.categoria);
  const valor = toNumber(raw.valor);
  if (categoria === null || valor === null) return null;
  return {
    categoria,
    descricao: toText(raw.categoriaDescricao) ?? CATEGORIA_ROTULO[categoria] ?? `Categoria ${categoria}`,
    valorCentavos: Math.round(valor * 100),
  };
}

// Serviço sem id ou sem nome é descartado.
export function fromServicoResponse(raw: unknown): Servico | null {
  if (!isRecord(raw)) return null;
  const id = toNumber(primeiro(raw, "servicoId", "id"));
  const nome = toText(raw.nome);
  if (id === null || nome === null) return null;
  const precos = Array.isArray(raw.precos) ? raw.precos.map(fromPreco).filter((preco): preco is PrecoServico => preco !== null) : [];
  return {
    id,
    nome,
    descricao: toText(raw.descricao),
    duracaoMinutos: toNumber(raw.duracaoMinutos),
    tempoPermitidoMinutos: minutosOuNulo(raw.tempoPermitidoMinutos),
    ativo: raw.ativo !== false,
    precos,
  };
}

export function fromServicosResponse(raw: unknown): Servico[] {
  return Array.isArray(raw) ? raw.map(fromServicoResponse).filter((servico): servico is Servico => servico !== null) : [];
}

function fromServicoDoVeiculo(raw: unknown): ServicoDoVeiculo | null {
  if (!isRecord(raw)) return null;
  const id = toNumber(primeiro(raw, "patioServicoId", "id"));
  const status = toNumber(raw.status);
  const nome = toText(primeiro(raw, "nome", "nomeServico"));
  if (id === null || nome === null || !isStatusServico(status)) return null;
  return {
    id,
    servicoId: toNumber(raw.servicoId),
    nome,
    valorCentavos: centavos(primeiro(raw, "valor", "valorServico")),
    tempoPermitidoMinutos: minutosOuNulo(raw.tempoPermitidoMinutos),
    status,
    motivoCancelamento: toText(primeiro(raw, "motivoCancelamento", "motivo")),
  };
}

export function fromServicosDoVeiculoResponse(raw: unknown): ServicosDoVeiculo {
  const data = isRecord(raw) ? raw : {};
  const lista = Array.isArray(data.servicos) ? data.servicos : [];
  return {
    valorServicosCentavos: centavos(data.valorServicos),
    tempoPermitidoMinutos: minutosOuNulo(data.tempoPermitidoMinutos),
    livreAte: toText(data.livreAte),
    servicos: lista.map(fromServicoDoVeiculo).filter((servico): servico is ServicoDoVeiculo => servico !== null),
  };
}

function textoOuNumero(valor: unknown): string | null {
  const numero = toNumber(valor);
  return toText(valor) ?? (numero === null ? null : String(numero));
}

function fromItemFila(raw: unknown, statusDoGrupo?: StatusServico): ItemFila | null {
  if (!isRecord(raw)) return null;
  const patioServicoId = toNumber(primeiro(raw, "patioServicoId", "id"));
  const idPatio = toNumber(primeiro(raw, "idPatio", "patioId"));
  const nomeServico = toText(primeiro(raw, "nomeServico", "servico", "nome"));
  const status = toNumber(raw.status) ?? statusDoGrupo ?? null;
  const placa = toText(raw.placa);
  if (patioServicoId === null || idPatio === null || nomeServico === null || placa === null || !isStatusServico(status)) return null;
  return {
    patioServicoId,
    idPatio,
    nomeServico,
    status,
    placa,
    modelo: toText(raw.modelo),
    cor: toText(raw.cor),
    categoria: textoOuNumero(primeiro(raw, "categoriaDescricao", "categoria")),
    prisma: textoOuNumero(raw.prisma),
    entradaEm: toText(primeiro(raw, "entradaEm", "dataEntrada", "entrada")),
  };
}

const STATUS_POR_CHAVE: Record<string, StatusServico> = {
  aguardando: STATUS_SERVICO.Aguardando,
  emexecucao: STATUS_SERVICO.EmExecucao,
  pronto: STATUS_SERVICO.Pronto,
};

function statusDaChave(chave: string): StatusServico | undefined {
  return STATUS_POR_CHAVE[chave.replace(/[^a-z]/gi, "").toLowerCase()];
}

// A fila pode vir como lista única ou agrupada por status (objeto com uma lista por status); as duas formas viram a mesma lista.
export function fromFilaResponse(raw: unknown): ItemFila[] {
  if (Array.isArray(raw)) {
    return raw.map((item) => fromItemFila(item)).filter((item): item is ItemFila => item !== null);
  }
  if (!isRecord(raw)) return [];
  return Object.entries(raw).flatMap(([chave, valor]) =>
    Array.isArray(valor) ? valor.map((item) => fromItemFila(item, statusDaChave(chave))).filter((item): item is ItemFila => item !== null) : [],
  );
}
