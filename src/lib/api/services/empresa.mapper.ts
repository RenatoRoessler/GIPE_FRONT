import { formatCEP } from "@/lib/cep";
import { formatCNPJ } from "@/lib/cnpj";
import { onlyDigits } from "@/lib/digits";
import { formatPhone } from "@/lib/phone";
import {
  BusinessHoursData,
  CompanyData,
  DayHours,
  DIAS_SEMANA,
  TipoEmpresa,
} from "@/types/adesao";
import type { EmpresaFormValues } from "@/types/empresa";
import { EnderecoPayload, HorarioPayload, toEnderecoPayload, toHorariosPayload } from "./adesao.mapper";

// Corpo plano (sem o wrapper "empresa" da adesão). O GET é assumido com o mesmo formato do PUT.
export interface EmpresaDto {
  razaoSocial: string;
  nomeFantasia: string;
  cnpj: string;
  tipoEmpresa: TipoEmpresa;
  telefone: string;
  endereco: EnderecoPayload;
  quantidadeVagasMoto: number;
  quantidadeVagasCarro: number;
  horarios: HorarioPayload[];
}

const CLOSED_DAY: DayHours = {
  aberto: false,
  aberto24Horas: false,
  horarioAbertura: "",
  horarioFechamento: "",
};

// "09:00:00" -> "09:00"; ausente -> "".
function toInputTime(time: string | null | undefined): string {
  return time ? time.slice(0, 5) : "";
}

// "09:00" -> "09:00:00"
function toApiTime(time: string): string {
  return time.length === 5 ? `${time}:00` : time;
}

function toNumberString(value: number | null | undefined): string {
  return value === null || value === undefined ? "" : String(value);
}

// Tolerante a campos ausentes: valores faltantes viram "" / fechado em vez de quebrar a tela.
export function fromEmpresaResponse(dto: Partial<EmpresaDto>): EmpresaFormValues {
  const endereco: Partial<EnderecoPayload> = dto.endereco ?? {};

  const company: CompanyData = {
    cnpj: formatCNPJ(dto.cnpj ?? ""),
    razaoSocial: dto.razaoSocial ?? "",
    nomeFantasia: dto.nomeFantasia ?? "",
    tipoEmpresa: dto.tipoEmpresa ?? "",
    telefone: formatPhone(dto.telefone ?? ""),
    cep: formatCEP(endereco.cep ?? ""),
    logradouro: endereco.logradouro ?? "",
    numero: endereco.numero ?? "",
    bairro: endereco.bairro ?? "",
    cidade: endereco.cidade ?? "",
    estado: endereco.estado ?? "",
    quantidadeVagasMoto: toNumberString(dto.quantidadeVagasMoto),
    quantidadeVagasCarro: toNumberString(dto.quantidadeVagasCarro),
  };

  // Localiza cada dia pelo código (não pela posição) e completa os ausentes como fechados.
  const hours: BusinessHoursData = {
    horarios: DIAS_SEMANA.map((dia) => {
      const found = dto.horarios?.find((horario) => horario.diaDaSemana === dia.codigo);
      if (!found) return { ...CLOSED_DAY };
      return {
        aberto: found.aberto,
        aberto24Horas: found.aberto && found.aberto24Horas,
        horarioAbertura: toInputTime(found.horarioAbertura),
        horarioFechamento: toInputTime(found.horarioFechamento),
      };
    }),
  };

  return { company, hours };
}

export function toEmpresaPayload({ company, hours }: EmpresaFormValues): EmpresaDto {
  return {
    razaoSocial: company.razaoSocial.trim(),
    nomeFantasia: company.nomeFantasia.trim(),
    cnpj: onlyDigits(company.cnpj),
    tipoEmpresa: company.tipoEmpresa as TipoEmpresa,
    telefone: onlyDigits(company.telefone),
    endereco: toEnderecoPayload(company),
    quantidadeVagasMoto: Number(company.quantidadeVagasMoto),
    quantidadeVagasCarro: Number(company.quantidadeVagasCarro),
    horarios: toHorariosPayload(hours, toApiTime),
  };
}
