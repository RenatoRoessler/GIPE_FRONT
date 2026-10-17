import { TIPO_CATEGORIA, TIPO_REGRA, type PrecoView, type TipoCategoria } from "@/types/preco";
import { formatMinutos } from "../format";

// ATENÇÃO: isto é só uma ESTIMATIVA para a tela de Gestão de Preços. O valor cobrado de verdade é calculado
// pelo back-end no momento da saída; esta função nunca deve ser usada para cobrar. Ela segue os degraus,
// as tolerâncias, a diária e o adicional da tabela e NÃO considera dia da semana nem horário.

export type Estimativa =
  | { tipo: "nao_aplica" }
  | { tipo: "sem_regra" }
  | {
      tipo: "valor";
      // Já com o desconto da conveniada, quando houver.
      valor: number;
      bruto: number;
      descontoPercentual: number | null;
      explicacao: string;
    };

const emCentavos = (valor: number) => Math.round(valor * 100);
const emReais = (centavos: number) => centavos / 100;

function resultado(centavos: number, brutoCentavos: number, descontoPercentual: number | null, explicacao: string): Estimativa {
  return { tipo: "valor", valor: emReais(centavos), bruto: emReais(brutoCentavos), descontoPercentual, explicacao };
}

function atendeCategoria(preco: PrecoView, categoria: TipoCategoria): boolean {
  return preco.categorias.includes(TIPO_CATEGORIA.Todas) || preco.categorias.includes(categoria);
}

// Dentro da tolerância de entrada não se cobra nada.
function dentroDaTolerancia(preco: PrecoView, permanencia: number): Estimativa | null {
  if (permanencia > preco.toleranciaEntradaMinutos && permanencia !== 0) {
    return null;
  }
  const explicacao =
    permanencia === 0 || preco.toleranciaEntradaMinutos === 0
      ? "Sem permanência"
      : `Dentro da tolerância de entrada (${preco.toleranciaEntradaMinutos} min)`;
  return resultado(0, 0, null, explicacao);
}

// Degraus em ordem de tempo; a tolerância de alteração de faixa estende o limite de cada degrau.
function estimarPorFaixa(preco: PrecoView, permanencia: number): Estimativa | null {
  const faixas = [...preco.faixas].sort((a, b) => a.minutosLimite - b.minutosLimite);
  const faixa = faixas.find((item) => permanencia <= item.minutosLimite + preco.toleranciaAlteracaoFaixaMinutos);
  if (!faixa) {
    return null;
  }

  const bruto = emCentavos(faixa.valor);
  const percentual = preco.tipoRegra === TIPO_REGRA.Convenio && faixa.percentualConveniada ? faixa.percentualConveniada : null;
  const liquido = percentual === null ? bruto : Math.round((bruto * (100 - percentual)) / 100);
  const base = `Degrau até ${formatMinutos(faixa.minutosLimite)}`;
  return resultado(liquido, bruto, percentual, percentual === null ? base : `${base}, com desconto de ${percentual}% da conveniada`);
}

// Passou do último degrau: diária e, depois do período dela, o adicional por hora iniciada (sem desconto).
function estimarPorDiaria(preco: PrecoView, permanencia: number): Estimativa | null {
  if (preco.valorDiaria <= 0 || preco.periodoDiaria <= 0) {
    return null;
  }

  const diaria = emCentavos(preco.valorDiaria);
  const periodo = formatMinutos(preco.periodoDiaria);
  if (permanencia <= preco.periodoDiaria) {
    return resultado(diaria, diaria, null, `Diária de ${periodo}`);
  }

  const adicional = emCentavos(preco.valorAdicionalDiaria);
  if (adicional === 0) {
    return resultado(diaria, diaria, null, `Diária de ${periodo}, sem adicional cadastrado`);
  }
  const horasExtras = Math.ceil((permanencia - preco.periodoDiaria) / 60);
  const total = diaria + horasExtras * adicional;
  return resultado(total, total, null, `Diária mais ${horasExtras} h de adicional`);
}

export function estimarCobranca(preco: PrecoView, categoria: TipoCategoria, minutos: number): Estimativa {
  if (!atendeCategoria(preco, categoria)) {
    return { tipo: "nao_aplica" };
  }

  const permanencia = Number.isFinite(minutos) && minutos > 0 ? minutos : 0;
  return (
    dentroDaTolerancia(preco, permanencia) ??
    estimarPorFaixa(preco, permanencia) ??
    estimarPorDiaria(preco, permanencia) ?? { tipo: "sem_regra" }
  );
}
