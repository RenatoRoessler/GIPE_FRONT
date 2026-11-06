import { descricaoDoTeste, formatarReais, PLANO_MENSAL, valorPorMes } from "@/lib/planos";
import { TipoPlanoAdesao } from "@/types/plano";
import { BusinessHoursData, CompanyData, DIAS_SEMANA, MEIOS_PAGAMENTO, PaymentsData, TIPO_EMPRESA_LABEL } from "@/types/adesao";

export type EstadoDia = "aberto" | "24h" | "fechado";

export interface DiaCredencial {
  sigla: string;
  nome: string;
  estado: EstadoDia;
}

// Campo vazio é `undefined`: a credencial desenha um traço apagado, nunca um valor falso.
export interface DadosCredencial {
  nome?: string;
  cnpj?: string;
  tipo?: string;
  vagasCarro?: number;
  vagasMoto?: number;
  dias: DiaCredencial[];
  pagamentos: string[];
  plano?: string;
}

function textoOuUndefined(valor: string): string | undefined {
  const texto = valor.trim();
  return texto ? texto : undefined;
}

function numeroOuUndefined(valor: string): number | undefined {
  return /^\d+$/.test(valor.trim()) ? Number(valor) : undefined;
}

function descricaoDoPlano(tipo: TipoPlanoAdesao): string {
  if (tipo === TipoPlanoAdesao.Trial) return descricaoDoTeste();

  const plano = PLANO_MENSAL;
  return `${plano.nome} · ${formatarReais(valorPorMes(plano))}/mês`;
}

export function buildCredencial(input: {
  company: CompanyData;
  hours: BusinessHoursData;
  payments: PaymentsData;
  plano?: TipoPlanoAdesao;
}):DadosCredencial {
  const { company, hours, payments, plano } = input;

  return {
    nome: textoOuUndefined(company.nomeFantasia),
    cnpj: textoOuUndefined(company.cnpj),
    tipo: company.tipoEmpresa === "" ? undefined : TIPO_EMPRESA_LABEL[company.tipoEmpresa],
    vagasCarro: numeroOuUndefined(company.quantidadeVagasCarro),
    vagasMoto: numeroOuUndefined(company.quantidadeVagasMoto),
    dias: DIAS_SEMANA.map((dia, index) => {
      const horario = hours.horarios[index];
      const estado: EstadoDia = !horario?.aberto ? "fechado" : horario.aberto24Horas ? "24h" : "aberto";
      return { sigla: dia.label.charAt(0), nome: dia.label, estado };
    }),
    pagamentos: MEIOS_PAGAMENTO.filter(({ key }) => payments[key]).map(({ curto }) => curto),
    plano: plano === undefined ? undefined : descricaoDoPlano(plano),
  };
}
