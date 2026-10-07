import { onlyDigits } from "@/lib/digits";
import { formatCEP } from "@/lib/cep";
import {
  AdminUserData,
  BusinessHoursData,
  CompanyData,
  DIAS_SEMANA,
  TipoEmpresa,
} from "@/types/adesao";

export interface AdesaoPayload {
  empresa: {
    razaoSocial: string;
    nomeFantasia: string;
    cnpj: string;
    tipoEmpresa: TipoEmpresa;
    telefone: string;
    endereco: {
      logradouro: string;
      bairro: string;
      numero: string;
      cidade: string;
      estado: string;
      cep: string;
    };
    quantidadeVagasMoto: number;
    quantidadeVagasCarro: number;
  };
  horarios: {
    aberto: boolean;
    aberto24Horas: boolean;
    diaDaSemana: number;
    horarioAbertura: string | null;
    horarioFechamento: string | null;
  }[];
  usuario: {
    nome: string;
    cpf: string;
    email: string;
    celular: string;
    senha: string;
  };
}

export interface AdesaoInput {
  company: CompanyData;
  hours: BusinessHoursData;
  adminUser: AdminUserData;
}

// Único ponto que traduz o formulário para o contrato do backend.
// Formatos seguem o exemplo recebido: documentos/telefones só com dígitos, CEP com hífen.
export function toAdesaoPayload({ company, hours, adminUser }: AdesaoInput): AdesaoPayload {
  return {
    empresa: {
      razaoSocial: company.razaoSocial.trim(),
      nomeFantasia: company.nomeFantasia.trim(),
      cnpj: onlyDigits(company.cnpj),
      tipoEmpresa: company.tipoEmpresa as TipoEmpresa,
      telefone: onlyDigits(company.telefone),
      endereco: {
        logradouro: company.logradouro.trim(),
        bairro: company.bairro.trim(),
        numero: company.numero.trim(),
        cidade: company.cidade.trim(),
        estado: company.estado,
        cep: formatCEP(company.cep),
      },
      quantidadeVagasMoto: Number(company.quantidadeVagasMoto),
      quantidadeVagasCarro: Number(company.quantidadeVagasCarro),
    },
    horarios: hours.horarios.map((day, index) => {
      const hasHours = day.aberto && !day.aberto24Horas;
      return {
        aberto: day.aberto,
        aberto24Horas: day.aberto && day.aberto24Horas,
        diaDaSemana: DIAS_SEMANA[index].codigo,
        horarioAbertura: hasHours ? day.horarioAbertura : null,
        horarioFechamento: hasHours ? day.horarioFechamento : null,
      };
    }),
    usuario: {
      nome: adminUser.nome.trim(),
      cpf: onlyDigits(adminUser.cpf),
      email: adminUser.email.trim(),
      celular: onlyDigits(adminUser.celular),
      senha: adminUser.senha,
    },
  };
}
