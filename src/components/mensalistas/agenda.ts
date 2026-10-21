import { normalizeDocumento } from "@/lib/documento";
import { podeRegistrarPagamento } from "./pagamento";
import {
  SITUACAO_AGUARDANDO_PRIMEIRO_PAGAMENTO,
  type Agenda,
  type AgendaGrupoData,
  type AgendaGrupoId,
  type AgendaItemData,
  type Mensalista,
  type SituacaoMensalista,
} from "@/types/mensalista";

export const AGENDA_GRUPO_TITULOS: Record<AgendaGrupoId, string> = {
  atrasados: "Atrasados",
  hoje: "Vencem hoje",
  semana: "Esta semana",
  "sem-pagamento": "Ainda sem pagamento",
  "em-dia": "Em dia",
  inativos: "Inativos",
};

const ORDEM_DOS_GRUPOS: AgendaGrupoId[] = ["atrasados", "hoje", "semana", "sem-pagamento", "em-dia", "inativos"];
const GRUPOS_VISIVEIS: AgendaGrupoId[] = ["atrasados", "hoje", "semana", "sem-pagamento"];

// Quem já pode receber vem primeiro; depois o que depende de reenviar o contrato.
const ORDEM_DA_SITUACAO: Record<SituacaoMensalista["kind"], number> = {
  "aguardando-pagamento": 0,
  "link-vencido": 1,
  "sem-contrato": 2,
  "aguardando-aceite": 3,
  desconhecida: 4,
  carregando: 5,
  ativo: 6,
  inativo: 7,
};

const MS_POR_DIA = 86_400_000;

// A data de vencimento é um dia de calendário: lê AAAA-MM-DD sem passar por new Date("AAAA-MM-DD"), que é UTC e
// mostraria o dia anterior no Brasil.
export function parseDiaLocal(valor: string | null | undefined): Date | null {
  const match = valor?.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) {
    return null;
  }
  const [ano, mes, dia] = [Number(match[1]), Number(match[2]), Number(match[3])];
  const data = new Date(ano, mes - 1, dia);
  return data.getFullYear() === ano && data.getMonth() === mes - 1 && data.getDate() === dia ? data : null;
}

function inicioDoDia(data: Date): Date {
  return new Date(data.getFullYear(), data.getMonth(), data.getDate());
}

// Dias de calendário entre duas datas, sem horas (e sem o erro de uma hora do horário de verão).
export function diasEntre(de: Date, ate: Date): number {
  const inicio = Date.UTC(de.getFullYear(), de.getMonth(), de.getDate());
  const fim = Date.UTC(ate.getFullYear(), ate.getMonth(), ate.getDate());
  return Math.round((fim - inicio) / MS_POR_DIA);
}

// Domingo da semana de `hoje`; se hoje é domingo, é o próprio dia.
export function fimDaSemana(hoje: Date): Date {
  const dia = inicioDoDia(hoje);
  dia.setDate(dia.getDate() + ((7 - dia.getDay()) % 7));
  return dia;
}

function classificar(
  mensalista: Mensalista,
  vence: Date | null,
  hoje: Date,
  fim: Date,
): { grupo: AgendaGrupoId; diasAtraso: number } {
  if (!mensalista.ativo) {
    return {
      grupo: mensalista.situacao === SITUACAO_AGUARDANDO_PRIMEIRO_PAGAMENTO ? "sem-pagamento" : "inativos",
      diasAtraso: 0,
    };
  }
  if (!vence) {
    return { grupo: "em-dia", diasAtraso: 0 };
  }
  const diferenca = diasEntre(hoje, vence);
  if (diferenca < 0) {
    return { grupo: "atrasados", diasAtraso: -diferenca };
  }
  if (diferenca === 0) {
    return { grupo: "hoje", diasAtraso: 0 };
  }
  return { grupo: diferenca <= diasEntre(hoje, fim) ? "semana" : "em-dia", diasAtraso: 0 };
}

function comparar(a: AgendaItemData, b: AgendaItemData): number {
  const porNome = () => a.mensalista.nome.localeCompare(b.mensalista.nome, "pt-BR");
  switch (a.grupo) {
    case "atrasados":
      return b.diasAtraso - a.diasAtraso || porNome();
    case "sem-pagamento":
      return ORDEM_DA_SITUACAO[a.situacao.kind] - ORDEM_DA_SITUACAO[b.situacao.kind] || porNome();
    default:
      return (a.vence?.getTime() ?? Infinity) - (b.vence?.getTime() ?? Infinity) || porNome();
  }
}

function resumir(grupos: AgendaGrupoData[], ate: Date): Agenda["resumo"] {
  const itens = grupos.filter((grupo) => grupo.id === "hoje" || grupo.id === "semana").flatMap((grupo) => grupo.itens);
  return {
    quantidade: itens.length,
    total: itens.reduce((soma, item) => soma + item.mensalista.valorMensalidade, 0),
    ate,
  };
}

export function montarAgenda(
  mensalistas: Mensalista[],
  situacaoDe: (mensalista: Mensalista) => SituacaoMensalista,
  hoje: Date,
): Agenda {
  const dia = inicioDoDia(hoje);
  const fim = fimDaSemana(dia);
  const porGrupo = new Map<AgendaGrupoId, AgendaItemData[]>(ORDEM_DOS_GRUPOS.map((id) => [id, []]));

  for (const mensalista of mensalistas) {
    const vence = parseDiaLocal(mensalista.dataProximoVencimento);
    const { grupo, diasAtraso } = classificar(mensalista, vence, dia, fim);
    porGrupo.get(grupo)?.push({ mensalista, grupo, situacao: situacaoDe(mensalista), vence, diasAtraso });
  }

  const grupos = GRUPOS_VISIVEIS.map((id) => ({
    id,
    titulo: AGENDA_GRUPO_TITULOS[id],
    itens: (porGrupo.get(id) ?? []).sort(comparar),
  })).filter((grupo) => grupo.itens.length > 0);
  const emDia = (porGrupo.get("em-dia") ?? []).sort(comparar);
  const inativos = (porGrupo.get("inativos") ?? []).sort(comparar);

  return {
    grupos,
    ocultos: [...emDia, ...inativos],
    emDia: emDia.length,
    resumo: resumir(grupos, fim),
  };
}

function semAcento(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

// Casa nome (sem acento), placa (sem hífen) ou documento (por prefixo). `termo` já vem sem acento e em minúsculas.
function combina(mensalista: Mensalista, termo: string): boolean {
  // Todas as palavras digitadas precisam estar no nome, em qualquer ordem ("jose conceicao" acha "José da Conceição").
  const nome = semAcento(mensalista.nome);
  if (termo.split(/\s+/).every((palavra) => nome.includes(palavra))) {
    return true;
  }
  const placa = termo.replace(/[^a-z0-9]/g, "").toUpperCase();
  if (placa.length >= 2 && mensalista.veiculos.some((veiculo) => veiculo.placa.toUpperCase().includes(placa))) {
    return true;
  }
  const prefixo = normalizeDocumento(termo);
  return prefixo.length > 0 && !/\s/.test(termo) && normalizeDocumento(mensalista.documento).startsWith(prefixo);
}

// Só dígitos e pontuação de documento (CPF, CNPJ): a busca é no servidor. Qualquer letra é busca por texto.
export function buscaEhTexto(busca: string): boolean {
  return /[^\d.\-/\s]/.test(busca.trim());
}

export function filtrarMensalistas(mensalistas: Mensalista[], busca: string): Mensalista[] {
  const termo = semAcento(busca);
  return termo === "" ? mensalistas : mensalistas.filter((mensalista) => combina(mensalista, termo));
}

// Com busca, os mensalistas fora dos grupos (em dia e inativos) também aparecem: é assim que se acha quem chegou pelo carro.
export function filtrarAgenda(agenda: Agenda, busca: string): Agenda {
  const termo = semAcento(busca);
  if (termo === "") {
    return agenda;
  }

  const grupos = agenda.grupos
    .map((grupo) => ({ ...grupo, itens: grupo.itens.filter((item) => combina(item.mensalista, termo)) }))
    .filter((grupo) => grupo.itens.length > 0);
  const ocultos = agenda.ocultos.filter((item) => combina(item.mensalista, termo));
  const extras: AgendaGrupoData[] = (["em-dia", "inativos"] as const)
    .map((id) => ({ id, titulo: AGENDA_GRUPO_TITULOS[id], itens: ocultos.filter((item) => item.grupo === id) }))
    .filter((grupo) => grupo.itens.length > 0);

  return {
    grupos: [...grupos, ...extras],
    ocultos,
    emDia: agenda.emDia,
    resumo: resumir(grupos, agenda.resumo.ate),
  };
}

export function totalDeItens(agenda: Agenda): number {
  return agenda.grupos.reduce((soma, grupo) => soma + grupo.itens.length, 0);
}

export type AgendaAcao = "receber" | "reenviar" | "enviar-contrato";

// A ação principal do item: receber quando o pagamento está liberado; reenviar ou enviar o contrato quando ele
// trava o primeiro pagamento; nenhuma enquanto o contrato ainda está sendo consultado.
export function acaoDoItem(item: Pick<AgendaItemData, "situacao">): AgendaAcao | null {
  switch (item.situacao.kind) {
    case "aguardando-aceite":
    case "link-vencido":
      return "reenviar";
    case "sem-contrato":
      return "enviar-contrato";
    case "carregando":
      return null;
    default:
      return podeRegistrarPagamento(item.situacao).pode ? "receber" : null;
  }
}

// "Receber" pesa mais quanto mais urgente: é a ação principal de quem está atrasado, vence hoje ou espera o primeiro pagamento.
export function acaoEhPrincipal(item: Pick<AgendaItemData, "grupo">, acao: AgendaAcao): boolean {
  return acao === "receber" && ["atrasados", "hoje", "sem-pagamento"].includes(item.grupo);
}

const DOIS_DIGITOS = (valor: number) => String(valor).padStart(2, "0");

// "21/10"
export function formatDiaMes(data: Date): string {
  return `${DOIS_DIGITOS(data.getDate())}/${DOIS_DIGITOS(data.getMonth() + 1)}`;
}

const SEMANA = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"];

export function nomeDoDia(data: Date): string {
  return SEMANA[data.getDay()];
}
