import { parseMoney } from "@/lib/money";
import type { EstadoSecao } from "@/components/ui/PainelCadastro/PainelCadastro";
import type { PrecoSecaoId } from "@/lib/schemas/preco";
import { TIPO_REGRA_OPTIONS, type PrecoFormValues, type PrecoInfoValues } from "@/types/preco";
import type { PrecoDiff } from "./diff";
import { formatBRL, formatDataIso, getCategoriaLabel } from "./format";
import { resumoHorarios } from "./resumoHorarios";

export type { PrecoSecaoId };

export const SECOES: readonly { id: PrecoSecaoId; titulo: string }[] = [
  { id: "basico", titulo: "O básico" },
  { id: "categorias", titulo: "Categorias" },
  { id: "horarios", titulo: "Quando vale" },
  { id: "cobranca", titulo: "Quanto cobra" },
];

// Id do elemento da seção na página: alvo da rolagem do PainelCadastro.
export function idDaSecao(id: PrecoSecaoId): string {
  return `preco-secao-${id}`;
}

export function secaoDoElemento(elementoId: string): PrecoSecaoId | null {
  return SECOES.find((secao) => idDaSecao(secao.id) === elementoId)?.id ?? null;
}

// Seção completa é "pronta". Incompleta vira "erro" depois de uma tentativa de salvar que falhou nela, ou quando já foi
// visitada e deixada para trás; antes disso é só "pendente" (ainda não chegou a vez dela).
export function estadoDaSecao({
  mensagens,
  visitada,
  aberta,
  falhou,
}: {
  mensagens: readonly string[];
  visitada: boolean;
  aberta: boolean;
  falhou: boolean;
}): EstadoSecao {
  if (mensagens.length === 0) {
    return "pronta";
  }
  return falhou || (visitada && !aberta) ? "erro" : "pendente";
}

interface Opcoes {
  // Falso enquanto os degraus e a diária ainda são o modelo padrão do cadastro novo.
  faixasEditadas?: boolean;
}

// Texto de uma linha com o que a seção guarda, mostrado no cabeçalho dela quando fechada.
export function resumoDaSecao(secao: PrecoSecaoId, values: PrecoFormValues, { faixasEditadas = true }: Opcoes = {}): string {
  const { info } = values;
  switch (secao) {
    case "basico": {
      const tipo = TIPO_REGRA_OPTIONS.find((option) => String(option.value) === info.tipoRegra)?.label ?? "—";
      const fim = info.fimVigencia ? formatDataIso(info.fimVigencia) : "sem fim";
      return `${tipo}${info.ativo ? "" : " · inativa"} · ${formatDataIso(info.inicioVigencia || null)} → ${fim}`;
    }
    case "categorias":
      return values.categorias.length > 0 ? values.categorias.map(getCategoriaLabel).join(", ") : "nenhuma ainda";
    case "horarios":
      return resumoHorarios(values.horarios);
    case "cobranca": {
      if (!faixasEditadas) {
        return "ainda sem valores definidos";
      }
      const degraus = values.faixas.filter(
        (faixa) => Number(faixa.minutosLimite) > 0 && Number.isFinite(parseMoney(faixa.valor)),
      ).length;
      const diaria = parseMoney(info.valorDiaria);
      return `${degraus} ${degraus === 1 ? "degrau" : "degraus"} · diária ${Number.isFinite(diaria) ? formatBRL(diaria) : "—"}`;
    }
  }
}

export interface MudancaSecao {
  rotulo: string;
  // Ausente quando o item é novo (só "depois") ou foi removido (só "antes").
  antes?: string;
  depois?: string;
}

const CAMPOS_DA_SECAO: Record<"basico" | "cobranca", readonly (keyof PrecoInfoValues)[]> = {
  basico: ["descricao", "tipoRegra", "empresaConveniadaId", "inicioVigencia", "fimVigencia", "ativo"],
  cobranca: [
    "periodoDiaria",
    "valorDiaria",
    "valorAdicionalDiaria",
    "toleranciaEntradaMinutos",
    "toleranciaAlteracaoFaixaMinutos",
  ],
};

function mudancasDeLista(rotulo: string, lista: PrecoDiff["horarios"]): MudancaSecao[] {
  return [
    ...lista.removidas.map((antes) => ({ rotulo, antes })),
    ...lista.adicionadas.map((depois) => ({ rotulo, depois })),
  ];
}

function mudancasDeInfo(diff: PrecoDiff, campos: readonly (keyof PrecoInfoValues)[]): MudancaSecao[] {
  return diff.info
    .filter((mudanca) => campos.includes(mudanca.campo))
    .map(({ rotulo, antes, depois }) => ({ rotulo, antes, depois }));
}

// O que mudou na seção em relação à tabela salva, em pares antes → depois (vazio quando nada mudou).
export function mudancasDaSecao(secao: PrecoSecaoId, diff: PrecoDiff): MudancaSecao[] {
  switch (secao) {
    case "basico":
      return mudancasDeInfo(diff, CAMPOS_DA_SECAO.basico);
    case "categorias":
      return mudancasDeLista("Categoria", diff.categorias);
    case "horarios":
      return mudancasDeLista("Horário", diff.horarios);
    case "cobranca":
      return [...mudancasDeLista("Degrau", diff.faixas), ...mudancasDeInfo(diff, CAMPOS_DA_SECAO.cobranca)];
  }
}
