import { CATEGORIA_ROTULO, isStatusServico, STATUS_SERVICO } from "@/types/servico";
import type { ItemFila, PrecoServico, Servico, ServicoDoComprovante, ServicoDoVeiculo, ServicosDoVeiculo, StatusServico } from "@/types/servico";
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
    duracaoMinutos: minutosOuNulo(raw.duracaoMinutos),
    tempoPermitidoMinutos: minutosOuNulo(raw.tempoPermitidoMinutos),
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
    ...momentosDoServico(raw),
    adicionadoEm: toText(primeiro(raw, "adicionadoEm", "dataCriacao", "dataInclusao")),
    adicionadoPor: toText(primeiro(raw, "adicionadoPor", "usuario", "usuarioNome")),
  };
}

const dois = (numero: number) => String(numero).padStart(2, "0");

// "2026-11-13T07:42:47" + 30 min = "2026-11-13T08:12:47". As datas do back vêm sem fuso, no horário local, e a soma devolve o
// mesmo formato. Data inválida ou duração ausente: nulo.
function somarMinutos(inicio: string | null, minutos: number | null): string | null {
  if (inicio === null || minutos === null || minutos <= 0) return null;
  const data = new Date(inicio);
  if (Number.isNaN(data.getTime())) return null;
  data.setMinutes(data.getMinutes() + minutos);
  return `${data.getFullYear()}-${dois(data.getMonth() + 1)}-${dois(data.getDate())}T${dois(data.getHours())}:${dois(data.getMinutes())}:${dois(data.getSeconds())}`;
}

// Previsão de término e hora em que ficou pronto. O back manda o início (`dataHoraInicio`), a duração e `dataHoraPronto`; a
// previsão é o início somado à duração (um `previsaoEm` explícito, se vier, vale mais).
function momentosDoServico(raw: Record<string, unknown>): { previsaoEm: string | null; prontoEm: string | null } {
  return {
    previsaoEm: toText(primeiro(raw, "previsaoEm", "previsaoConclusao")) ?? somarMinutos(toText(raw.dataHoraInicio), minutosOuNulo(raw.duracaoMinutos)),
    prontoEm: toText(primeiro(raw, "dataHoraPronto", "prontoEm", "dataPronto", "concluidoEm")),
  };
}

// Serviços do comprovante público: o cancelado não aparece e item sem nome ou sem status válido é descartado.
export function fromServicosDoComprovante(raw: unknown): ServicoDoComprovante[] {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((item): ServicoDoComprovante[] => {
    if (!isRecord(item)) return [];
    const nome = toText(primeiro(item, "nome", "nomeServico"));
    const status = toNumber(item.status);
    if (nome === null || !isStatusServico(status) || status === STATUS_SERVICO.Cancelado) return [];
    return [{ nome, valorCentavos: centavos(primeiro(item, "valor", "valorServico")), status, ...momentosDoServico(item) }];
  });
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

// A fila manda a categoria do veículo como número (`"categoria": 3`); a tela mostra o nome ("Carro médio"). Texto ou número
// desconhecido ficam como vieram.
function categoriaDaFila(raw: Record<string, unknown>): string | null {
  const descricao = toText(raw.categoriaDescricao);
  if (descricao !== null) return descricao;
  const numero = toNumber(raw.categoria);
  return numero !== null && CATEGORIA_ROTULO[numero] ? CATEGORIA_ROTULO[numero] : textoOuNumero(raw.categoria);
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
    categoria: categoriaDaFila(raw),
    prisma: textoOuNumero(raw.prisma),
    entradaEm: toText(primeiro(raw, "entradaEm", "dataEntrada", "entrada", "dataHoraEntrada")),
    // Tempos do serviço: o back ainda não confirmou os nomes, então aceita mais de um. Ausente é nulo.
    criadoEm: toText(primeiro(raw, "dataCriacao", "criadoEm", "adicionadoEm")),
    iniciadoEm: toText(primeiro(raw, "dataHoraInicio", "inicioEm", "iniciadoEm")),
    prontoEm: toText(primeiro(raw, "dataHoraPronto", "prontoEm")),
    duracaoMinutos: minutosOuNulo(raw.duracaoMinutos),
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
