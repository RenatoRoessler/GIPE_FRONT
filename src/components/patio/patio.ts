import { parseApiDate } from "@/lib/date";
import type { PatioChegadas, PatioEstatisticas, PatioFiltros, PatioOcupacao, PatioResumo, PatioVagas, PatioVeiculo } from "@/types/patio";
import { CATEGORIA_VEICULO, CATEGORIA_VEICULO_OPTIONS, CORES_VEICULO, matchCor } from "@/types/veiculo";

function semAcento(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

// O que está há mais tempo no pátio vem primeiro; no empate, a placa. Não altera a lista recebida.
export function ordenarPatio(itens: PatioVeiculo[]): PatioVeiculo[] {
  return [...itens].sort(
    (a, b) => b.minutosPermanencia - a.minutosPermanencia || a.placa.localeCompare(b.placa, "pt-BR"),
  );
}

// `termo` já vem sem acento e em minúsculas. Placa: letras e números do termo aparecem na placa (a partir de 2).
// Modelo: todas as palavras aparecem, em qualquer ordem. Ticket e sequencial: termo só com dígitos, por prefixo.
function combinaBusca(veiculo: PatioVeiculo, termo: string): boolean {
  const placa = termo.replace(/[^a-z0-9]/g, "").toUpperCase();
  if (placa.length >= 2 && veiculo.placa.includes(placa)) {
    return true;
  }
  const modelo = semAcento(veiculo.modelo ?? "");
  if (modelo !== "" && termo.split(/\s+/).every((palavra) => modelo.includes(palavra))) {
    return true;
  }
  if (/^\d+$/.test(termo)) {
    return String(veiculo.sequencial).startsWith(termo) || String(veiculo.codigoTicket ?? "").startsWith(termo);
  }
  return false;
}

export function filtrarPatio(itens: PatioVeiculo[], filtros: PatioFiltros): PatioVeiculo[] {
  const termo = semAcento(filtros.busca);
  return itens.filter((veiculo) => {
    if (filtros.tipo === "mensalistas" && !veiculo.mensalista) return false;
    if (filtros.tipo === "avulsos" && veiculo.mensalista) return false;
    if (filtros.categoria !== "todas" && veiculo.categoria !== filtros.categoria) return false;
    if (filtros.chave === "fora" && veiculo.posicaoChave) return false;
    if (filtros.chave === "dentro" && !veiculo.posicaoChave) return false;
    return termo === "" || combinaBusca(veiculo, termo);
  });
}

// Veículos cuja chave não está em nenhum gancho do quadro. Recebe o pátio inteiro: o número não muda com busca e filtros.
export function contarForaDoQuadro(veiculos: PatioVeiculo[]): number {
  return veiculos.filter((veiculo) => !veiculo.posicaoChave).length;
}

// Veículos com a chave em algum gancho do quadro.
export function contarNoQuadro(veiculos: PatioVeiculo[]): number {
  return veiculos.length - contarForaDoQuadro(veiculos);
}

export function resumirPatio(todos: PatioVeiculo[], visiveis: PatioVeiculo[]): PatioResumo {
  return { total: todos.length, mostrados: visiveis.length };
}

export function categoriaConhecida(categoria: number): boolean {
  return CATEGORIA_VEICULO_OPTIONS.some((opcao) => opcao.value === categoria);
}

// A categoria vem como número; um valor novo do back aparece como "Categoria N", sem quebrar a tela.
export function rotuloCategoria(categoria: number): string {
  return CATEGORIA_VEICULO_OPTIONS.find((opcao) => opcao.value === categoria)?.label ?? `Categoria ${categoria}`;
}

// Amostra só para as cores que o sistema conhece; o texto livre ("teste") aparece sem amostra.
export function corDoVeiculo(cor: string | null): { texto: string; amostra: string | null } {
  if (!cor || cor.trim() === "") {
    return { texto: "—", amostra: null };
  }
  const conhecida = matchCor(cor);
  const amostra = conhecida ? (CORES_VEICULO.find((item) => item.value === conhecida)?.color ?? null) : null;
  return { texto: cor.trim(), amostra };
}

// Três dias, em minutos: a partir daí o veículo conta como permanência longa.
export const PERMANENCIA_LONGA_MINUTOS = 3 * 24 * 60;

const FAIXAS_PERMANENCIA = [
  { rotulo: "Até 1h", de: 0, ate: 60 },
  { rotulo: "1 a 3h", de: 60, ate: 180 },
  { rotulo: "3 a 8h", de: 180, ate: 480 },
  { rotulo: "8 a 24h", de: 480, ate: 1440 },
  { rotulo: "1 a 3 dias", de: 1440, ate: PERMANENCIA_LONGA_MINUTOS },
  { rotulo: "Mais de 3 dias", de: PERMANENCIA_LONGA_MINUTOS, ate: Infinity },
];

export const SEM_OPERADOR = "Sem operador";

// Contagens do pátio inteiro. Categorias e operadores vêm do maior para o menor; as faixas de permanência, na ordem do tempo.
export function estatisticasPatio(itens: PatioVeiculo[]): PatioEstatisticas {
  const total = itens.length;
  const mensalistas = itens.filter((item) => item.mensalista).length;
  const categorias = new Map<number, number>();
  const operadores = new Map<string, number>();
  for (const item of itens) {
    categorias.set(item.categoria, (categorias.get(item.categoria) ?? 0) + 1);
    const operador = item.usuarioEntrada?.trim() || SEM_OPERADOR;
    operadores.set(operador, (operadores.get(operador) ?? 0) + 1);
  }
  const porMaior = <T extends { valor: number; rotulo: string }>(a: T, b: T) =>
    b.valor - a.valor || a.rotulo.localeCompare(b.rotulo, "pt-BR");

  return {
    total,
    mensalistas,
    avulsos: total - mensalistas,
    percentualMensalistas: total === 0 ? 0 : Math.round((mensalistas / total) * 100),
    mediaMinutos: total === 0 ? 0 : Math.round(itens.reduce((soma, item) => soma + item.minutosPermanencia, 0) / total),
    permanenciaLonga: itens.filter((item) => item.minutosPermanencia >= PERMANENCIA_LONGA_MINUTOS).length,
    maisAntigo: ordenarPatio(itens)[0] ?? null,
    porCategoria: [...categorias]
      .map(([categoria, valor]) => ({ categoria, rotulo: rotuloCategoria(categoria), valor }))
      .sort(porMaior),
    porPermanencia: FAIXAS_PERMANENCIA.map((faixa) => ({
      rotulo: faixa.rotulo,
      valor: itens.filter((item) => item.minutosPermanencia >= faixa.de && item.minutosPermanencia < faixa.ate).length,
      longa: faixa.ate === Infinity,
    })),
    porOperador: [...operadores].map(([rotulo, valor]) => ({ rotulo, valor })).sort(porMaior),
  };
}

// "1d 2h", "3h 5min" ou "12min": só para a média, que o servidor não devolve pronta.
export function formatarMinutos(minutos: number): string {
  const dias = Math.floor(minutos / 1440);
  const horas = Math.floor((minutos % 1440) / 60);
  const resto = minutos % 60;
  if (dias > 0) return `${dias}d ${horas}h`;
  if (horas > 0) return `${horas}h ${resto}min`;
  return `${resto}min`;
}

// Moto ocupa vaga de moto; qualquer outra categoria (carro, SUV, caminhonete, caminhão) ocupa vaga de carro.
// Sem vagas cadastradas não há o que dividir: devolve null.
export function ocupacaoPatio(itens: PatioVeiculo[], vagas: PatioVagas): PatioOcupacao | null {
  const totalVagas = vagas.moto + vagas.carro;
  if (totalVagas <= 0) return null;
  const motos = itens.filter((item) => item.categoria === CATEGORIA_VEICULO.Moto).length;
  return {
    percentual: Math.round((itens.length / totalVagas) * 100),
    motos: { ocupadas: motos, vagas: vagas.moto },
    carros: { ocupadas: itens.length - motos, vagas: vagas.carro },
  };
}

const PRIMEIRA_HORA = 6;
const ULTIMA_HORA = 20;

// Quem chegou hoje e ainda está no pátio, por hora de entrada. O eixo vai das 6h às 20h e cresce se houver
// chegada fora desse intervalo. Não é o movimento do dia: quem já saiu não entra na conta.
export function chegadasPorHora(itens: PatioVeiculo[], agora: Date = new Date()): PatioChegadas {
  const porHora = new Map<number, number>();
  for (const item of itens) {
    const entrada = parseApiDate(item.dataHoraEntrada);
    if (!entrada || entrada.toDateString() !== agora.toDateString()) continue;
    porHora.set(entrada.getHours(), (porHora.get(entrada.getHours()) ?? 0) + 1);
  }
  const usadas = [...porHora.keys()];
  const inicio = Math.min(PRIMEIRA_HORA, ...usadas);
  const fim = Math.max(ULTIMA_HORA, ...usadas);
  const horas = Array.from({ length: fim - inicio + 1 }, (_, indice) => ({ hora: inicio + indice, valor: porHora.get(inicio + indice) ?? 0 }));
  const total = horas.reduce((soma, item) => soma + item.valor, 0);
  // No empate, o pico é a hora mais cedo.
  const pico = total === 0 ? null : horas.reduce((maior, item) => (item.valor > maior.valor ? item : maior));
  return { horas, total, pico };
}
