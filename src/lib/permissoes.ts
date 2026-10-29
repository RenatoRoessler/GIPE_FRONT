import { PERFIL_USUARIO, type PerfilUsuario } from "@/types/usuario";

export const AREA = {
  Inicio: "inicio",
  // Entrada e saída de veículos fazem parte do pátio.
  Patio: "patio",
  // Abrir e fechar caixa, caixa atual, turnos, passagem de turno e movimentos.
  Caixa: "caixa",
  CaixaSangria: "caixa.sangria",
  CaixaHistorico: "caixa.historico",
  Precos: "precos",
  Mensalistas: "mensalistas",
  // Empresas com convênio com o estacionamento: consulta e cadastro de conveniadas.
  Conveniadas: "conveniadas",
  NotasFiscais: "notas-fiscais",
  Empresa: "empresa",
  Usuarios: "usuarios",
  // Cadastro dos quadros de chaves do pátio; escolher o gancho na entrada de veículos faz parte do pátio.
  QuadroChaves: "quadros-chaves",
  // Carimbo do ticket de entrada pela empresa conveniada, lendo o QR Code do cliente.
  Carimbo: "carimbo",
} as const;
export type Area = (typeof AREA)[keyof typeof AREA];

// Permissão por módulo (tela de permissões): quando existir, substitui a regra padrão da área.
export type PermissoesPorModulo = Partial<Record<Area, readonly PerfilUsuario[]>>;

const { Administrador, Gerente, Caixa, Manobrista, Financeiro, AdministradorConveniada, GerenteConveniada, UsuarioConveniada } =
  PERFIL_USUARIO;

const TODOS: readonly PerfilUsuario[] = Object.values(PERFIL_USUARIO);

// Regra padrão por perfil, igual à do back-end. Perfis fora da lista não acessam a área.
// Provisório (não consta no levantamento do back): A consulta de Mensalistas segue Administrador e Gerente.
export const PERMISSOES_PADRAO: Record<Area, readonly PerfilUsuario[]> = {
  [AREA.Inicio]: TODOS,
  [AREA.Patio]: [Administrador, Gerente, Caixa, Manobrista],
  [AREA.Caixa]: [Administrador, Gerente, Caixa, Manobrista],
  [AREA.CaixaSangria]: [Administrador, Gerente, Caixa],
  [AREA.CaixaHistorico]: [Administrador, Gerente],
  [AREA.Precos]: [Administrador, Gerente],
  [AREA.Mensalistas]: [Administrador, Gerente],
  [AREA.Conveniadas]: [Administrador],
  [AREA.NotasFiscais]: [Administrador, Gerente, Financeiro],
  [AREA.Empresa]: [Administrador],
  [AREA.Usuarios]: [Administrador, AdministradorConveniada],
  [AREA.QuadroChaves]: [Administrador, Gerente],
  [AREA.Carimbo]: [AdministradorConveniada, GerenteConveniada, UsuarioConveniada],
};

// Sem perfil conhecido, só o acesso mínimo: o Início (e, fora das áreas, a troca da própria senha e o sair).
export function podeAcessar(perfil: PerfilUsuario | null | undefined, area: Area, overrides?: PermissoesPorModulo): boolean {
  if (perfil === null || perfil === undefined) {
    return area === AREA.Inicio;
  }
  const perfis = overrides?.[area] ?? PERMISSOES_PADRAO[area];
  return perfis.includes(perfil);
}

// Prefixos de rota que pertencem a uma área. Rota fora da lista não é restrita por área.
const AREA_POR_ROTA: readonly (readonly [string, Area])[] = [
  ["/dashboard", AREA.Inicio],
  ["/patio", AREA.Patio],
  ["/caixa", AREA.Caixa],
  // Histórico de caixas fechados e extrato: só Administrador e Gerente, ao contrário do restante do caixa.
  ["/caixa/historico", AREA.CaixaHistorico],
  ["/precos", AREA.Precos],
  ["/mensalistas", AREA.Mensalistas],
  ["/empresas-conveniadas", AREA.Conveniadas],
  ["/notas-fiscais", AREA.NotasFiscais],
  ["/minha-empresa", AREA.Empresa],
  ["/usuarios", AREA.Usuarios],
  ["/quadros-chaves", AREA.QuadroChaves],
  ["/carimbo", AREA.Carimbo],
];

// Rotas da área logada abertas a qualquer usuário autenticado.
export const ROTAS_SEM_AREA = ["/acesso-negado", "/atualizacoes", "/usuario"] as const;

// O prefixo mais longo vence: /caixa/historico é do histórico, não do caixa.
const ROTAS_POR_ESPECIFICIDADE = [...AREA_POR_ROTA].sort((a, b) => b[0].length - a[0].length);

export function areaDaRota(pathname: string): Area | null {
  const encontrada = ROTAS_POR_ESPECIFICIDADE.find(([prefixo]) => pathname === prefixo || pathname.startsWith(`${prefixo}/`));
  return encontrada ? encontrada[1] : null;
}
