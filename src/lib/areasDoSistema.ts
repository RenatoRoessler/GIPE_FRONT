import type { AreaDoSistema } from "@/types/plano";

// Mesma lista da seção de planos do site (murel-site), válida para os quatro planos.
// Fica de fora o que o sistema ainda não tem: relatórios, tela de permissões por módulo e emissão de NFS-e.
export const AREAS_DO_SISTEMA: readonly AreaDoSistema[] = [
  {
    titulo: "Entrada e saída de veículos",
    descricao: "Placa lida pela câmera, ticket digital com QR Code, saída por placa ou QR e recibo público.",
  },
  {
    titulo: "Pátio",
    descricao: "Quem está no pátio agora, com busca e filtros, e a saída direto pela lista.",
  },
  {
    titulo: "Quadro de chaves",
    descricao: "Cada chave no seu gancho, com o gancho livre sugerido na entrada.",
  },
  {
    titulo: "Preços",
    descricao: "Tabelas por categoria, dia e horário, com simulador de cobrança.",
  },
  {
    titulo: "Caixa",
    descricao: "Abertura, sangria, passagem de turno e fechamento com a diferença apurada.",
  },
  {
    titulo: "Meios de pagamento",
    descricao: "A saída oferece só os meios que a sua empresa aceita.",
  },
  {
    titulo: "Mensalistas",
    descricao: "Cadastro, contrato por e-mail, registro de pagamento e agenda de vencimentos.",
  },
  {
    titulo: "Empresas conveniadas",
    descricao: "Convênio com tabela própria e carimbo do ticket pelo QR Code.",
  },
  {
    titulo: "Financeiro",
    descricao: "Receitas, despesas e fluxo de caixa do período.",
  },
  {
    titulo: "Notas fiscais",
    descricao: "Pedido de nota pelo recibo da saída e lista das notas lançadas.",
  },
  {
    titulo: "Equipe e permissões",
    descricao: "Perfis de administrador, gerente, caixa, manobrista e financeiro, cada um com o seu menu.",
  },
  {
    titulo: "Acesso e empresa",
    descricao: "Login por CPF, várias empresas na mesma conta e recuperação de senha por e-mail.",
  },
  {
    titulo: "Celular, tablet e computador",
    descricao: "Instalável como aplicativo, com tema claro e escuro.",
  },
];
