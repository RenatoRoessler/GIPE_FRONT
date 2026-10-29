import { formatCEP } from "@/lib/cep";
import { onlyDigits } from "@/lib/digits";
import type { Conveniada, ConveniadaFormValues, ConveniadaPayload, ConveniadaResultado } from "@/types/conveniada";

type Registro = Record<string, unknown>;

function isRegistro(value: unknown): value is Registro {
  return typeof value === "object" && value !== null;
}

function text(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function num(value: unknown): number {
  return typeof value === "number" ? value : 0;
}

// [A CONFIRMAR] O contrato não diz se o endereço vem aninhado em `endereco` ou plano; aceita os dois.
export function fromConveniadaResponse(raw: unknown): Conveniada {
  const dto: Registro = isRegistro(raw) ? raw : {};
  const endereco: Registro = isRegistro(dto.endereco) ? dto.endereco : dto;

  return {
    empresaConvenioId: num(dto.empresaConvenioId),
    empresaConveniadaId: num(dto.empresaConveniadaId),
    empresaGuid: text(dto.empresaGuid),
    razaoSocial: text(dto.razaoSocial).trim(),
    nomeFantasia: text(dto.nomeFantasia).trim(),
    cnpj: onlyDigits(text(dto.cnpj)),
    telefone: onlyDigits(text(dto.telefone)),
    endereco: {
      logradouro: text(endereco.logradouro).trim(),
      numero: text(endereco.numero).trim(),
      bairro: text(endereco.bairro).trim(),
      cidade: text(endereco.cidade).trim(),
      estado: text(endereco.estado).trim(),
      cep: text(endereco.cep).trim(),
    },
    ativo: dto.ativo === true,
    dataCriacao: text(dto.dataCriacao),
  };
}

export function fromConveniadasResponse(raw: unknown): Conveniada[] {
  return Array.isArray(raw) ? raw.map(fromConveniadaResponse) : [];
}

export function fromResultadoResponse(raw: unknown): ConveniadaResultado {
  const dto: Registro = isRegistro(raw) ? raw : {};
  return {
    empresaConveniadaId: num(dto.empresaConveniadaId),
    empresaGuid: text(dto.empresaGuid),
    novaEmpresa: dto.novaEmpresa === true,
    usuarioId: num(dto.usuarioId),
    novoUsuario: dto.novoUsuario === true,
  };
}

// Único ponto que traduz o formulário para o contrato do backend. O endereço sai dos campos do formulário.
export function toConveniadaPayload(values: ConveniadaFormValues): ConveniadaPayload {
  return {
    empresa: {
      razaoSocial: values.razaoSocial.trim(),
      nomeFantasia: values.nomeFantasia.trim(),
      cnpj: onlyDigits(values.cnpj),
      telefone: onlyDigits(values.telefone),
      endereco: {
        logradouro: values.logradouro.trim(),
        bairro: values.bairro.trim(),
        numero: values.numero.trim(),
        cidade: values.cidade.trim(),
        estado: values.estado,
        cep: formatCEP(values.cep),
      },
    },
    usuario: {
      nome: values.usuarioNome.trim(),
      cpf: onlyDigits(values.usuarioCpf),
      email: values.usuarioEmail.trim(),
      celular: onlyDigits(values.usuarioCelular),
    },
  };
}
