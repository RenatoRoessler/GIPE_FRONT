import { PERFIL_USUARIO, PERFIS_ESTACIONAMENTO, type PerfilEstacionamento, type PerfilUsuario } from "@/types/usuario";

export const PERFIL_LABEL: Record<PerfilUsuario, string> = {
  [PERFIL_USUARIO.Administrador]: "Administrador",
  [PERFIL_USUARIO.Gerente]: "Gerente",
  [PERFIL_USUARIO.Manobrista]: "Manobrista",
  [PERFIL_USUARIO.Caixa]: "Caixa",
  [PERFIL_USUARIO.AdministradorConveniada]: "Administrador Conveniada",
  [PERFIL_USUARIO.GerenteConveniada]: "Gerente Conveniada",
  [PERFIL_USUARIO.UsuarioConveniada]: "Usuário Conveniada",
  [PERFIL_USUARIO.Financeiro]: "Financeiro",
};

// Perfis que esta tela atribui, na ordem de exibição no Select.
export const PERFIL_OPTIONS: { value: PerfilEstacionamento; label: string }[] = PERFIS_ESTACIONAMENTO.map((value) => ({
  value,
  label: PERFIL_LABEL[value],
}));

export function isPerfilConhecido(perfil: number): perfil is PerfilUsuario {
  return perfil in PERFIL_LABEL;
}

export function isPerfilAtribuivel(perfil: number): perfil is PerfilEstacionamento {
  return (PERFIS_ESTACIONAMENTO as readonly number[]).includes(perfil);
}

// Perfil fora do enum cai na descrição do back e, sem ela, no número.
export function formatPerfil(perfil: number, descricao = ""): string {
  if (isPerfilConhecido(perfil)) {
    return PERFIL_LABEL[perfil];
  }
  return descricao || `Perfil ${perfil}`;
}
