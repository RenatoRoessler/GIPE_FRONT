import type { CpfConsulta } from "@/types/usuario";

export type CadastroEtapa =
  | { etapa: "dados"; modo: "novo" }
  | { etapa: "dados"; modo: "conferencia"; pessoa: CpfConsulta }
  | { etapa: "bloqueado"; usuarioId: number | null };

// Decide o próximo passo a partir da consulta de CPF.
export function proximaEtapa(consulta: CpfConsulta): CadastroEtapa {
  if (!consulta.encontrado) {
    return { etapa: "dados", modo: "novo" };
  }
  if (consulta.vinculadoNaEmpresa) {
    return { etapa: "bloqueado", usuarioId: consulta.usuarioId };
  }
  return { etapa: "dados", modo: "conferencia", pessoa: consulta };
}

export function mensagemSucesso(novoCadastro: boolean): string {
  return novoCadastro
    ? "Usuário criado. Senha temporária enviada por e-mail."
    : "Acesso concedido. A pessoa foi avisada por e-mail.";
}
