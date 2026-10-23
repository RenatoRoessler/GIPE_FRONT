// ETipoUsuario do back. Os perfis da conveniada (5 a 7) existem no enum, mas o cadastro de uma empresa de
// estacionamento só atribui os do tipo Administrador (1, 2, 3, 4 e 8).
export const PERFIL_USUARIO = {
  Administrador: 1,
  Gerente: 2,
  Manobrista: 3,
  Caixa: 4,
  AdministradorConveniada: 5,
  GerenteConveniada: 6,
  UsuarioConveniada: 7,
  Financeiro: 8,
} as const;
export type PerfilUsuario = (typeof PERFIL_USUARIO)[keyof typeof PERFIL_USUARIO];

export function isPerfilUsuario(valor: unknown): valor is PerfilUsuario {
  return (Object.values(PERFIL_USUARIO) as unknown[]).includes(valor);
}

export const PERFIS_ESTACIONAMENTO = [
  PERFIL_USUARIO.Administrador,
  PERFIL_USUARIO.Gerente,
  PERFIL_USUARIO.Caixa,
  PERFIL_USUARIO.Manobrista,
  PERFIL_USUARIO.Financeiro,
] as const;
export type PerfilEstacionamento = (typeof PERFIS_ESTACIONAMENTO)[number];

export type Usuario = {
  usuarioId: number;
  // Só dígitos.
  cpf: string;
  nome: string;
  email: string;
  // Só dígitos.
  celular: string;
  // Pode vir fora do enum conhecido (perfil novo no back).
  perfil: number;
  perfilDescricao: string;
  ativo: boolean;
  trocarSenha: boolean;
  dataCriacao: string;
};

// Resultado de GET /Usuario/cpf/{cpf}. Os dados pessoais são da pessoa e só servem para conferência.
export type CpfConsulta = {
  encontrado: boolean;
  cpf: string;
  usuarioId: number | null;
  nome: string;
  email: string;
  celular: string;
  vinculadoNaEmpresa: boolean;
};

export type NovoUsuarioValues = {
  cpf: string;
  nome: string;
  email: string;
  celular: string;
  perfil: string;
};

export type NovoUsuarioPayload = {
  cpf: string;
  nome: string;
  email: string;
  celular: string;
  perfil: PerfilEstacionamento;
};

// `novoCadastro` false = a pessoa já existia e só ganhou acesso à empresa.
export type NovoUsuarioResultado = { usuarioId: number; novoCadastro: boolean };

export type AlterarSenhaPayload = { senhaAtual: string; novaSenha: string };
