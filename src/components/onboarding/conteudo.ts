import { PERFIL_USUARIO, type PerfilUsuario } from "@/types/usuario";

export type ConteudoModulo = { texto: string };

// Explicação de cada item do menu, indexada por `navItemKey` (o endereço ou a ação). Um item novo em NAV_ITEMS sem texto aqui
// derruba o teste de passos.
export const CONTEUDO_MODULOS: Record<string, ConteudoModulo> = {
  "/dashboard": {
    texto:
      "É a tela inicial. Mostra o resumo do pátio agora, como quantos veículos estão dentro e há quanto tempo, e traz os atalhos para registrar entrada, saída e gerar o cartaz do ticket digital.",
  },
  "/patio": {
    texto:
      "Lista os veículos que estão no pátio neste momento, do que chegou há menos tempo ao mais antigo. Dá para buscar por placa, abrir o ticket, corrigir o prisma e ver onde a chave foi guardada.",
  },
  entrada: {
    texto:
      "Registra a chegada de um veículo: placa, categoria e, conforme a configuração da empresa, modelo, cor e prisma. Ao final o sistema gera o ticket com QR Code, que o cliente pode abrir no celular.",
  },
  saida: {
    texto:
      "Registra a saída: localize o veículo pela placa ou pelo QR Code do ticket, confira o valor calculado pelo tempo de permanência, escolha a forma de pagamento e finalize.",
  },
  "/conferencia-patio": {
    texto:
      "Serve para conferir, placa a placa, se os veículos que o sistema diz estar no pátio estão mesmo lá. Você resolve as diferenças na hora e o resultado fica registrado.",
  },
  "/financeiro": {
    texto:
      "Reúne o fluxo de caixa do período: estacionamento rotativo, mensalidades e lançamentos. Também é onde você cadastra categorias de receita e despesa e lança o que foi pago.",
  },
  "/caixa": {
    texto:
      "Controla o caixa do turno: abrir e fechar o caixa, acompanhar os movimentos, fazer sangria, passar o turno e consultar o histórico. Os recebimentos das saídas entram aqui.",
  },
  "/faturas": {
    texto:
      "Cuida da cobrança das empresas conveniadas. Junta as saídas ainda não cobradas em uma fatura com vencimento, acompanha as emitidas e registra o pagamento ou o cancelamento.",
  },
  "/notas-fiscais": {
    texto: "Mostra as notas fiscais emitidas pelas saídas, para você consultar e acompanhar a situação de cada uma.",
  },
  "/minha-empresa": {
    texto:
      "Guarda os dados cadastrais do estacionamento, como razão social, CNPJ, endereço e contatos. Daqui também sai o cartaz com o QR Code para o cliente consultar o ticket pela placa.",
  },
  "/configuracoes": {
    texto:
      "Define as regras do dia a dia da empresa, como quais dados são obrigatórios na entrada de veículos: modelo, cor e prisma. A mudança vale para toda a equipe.",
  },
  "/precos": {
    texto:
      "É onde as tabelas de preço são criadas e editadas: vigência, tolerância, faixas por dia e horário, valor da diária e degraus por tempo. É a base do valor calculado na saída.",
  },
  "/quadros-chaves": {
    texto:
      "Cadastra os quadros de chaves físicos do pátio, com linhas, colunas e posições fora de uso. Na entrada, o operador escolhe o gancho da chave, que é liberado sozinho na saída.",
  },
  "/mensalistas": {
    texto:
      "Cuida dos clientes com mensalidade: cadastro, veículos, contrato com aceite pelo link enviado por e-mail, agenda de vencimentos e registro dos pagamentos.",
  },
  "/usuarios": {
    texto:
      "Gerencia quem acessa o sistema: cadastro de usuários, perfis (como Gerente, Caixa e Manobrista), ativação e desativação, e as permissões de cada módulo.",
  },
  "/empresas-conveniadas": {
    texto:
      "Consulta e cadastra as empresas com convênio com o estacionamento. Os veículos carimbados por elas passam a ser cobrados pela tabela de convênio.",
  },
  "/carimbo": {
    texto:
      "Aponte a câmera para o QR Code do ticket de entrada do cliente e carimbe. A partir daí o veículo passa a ser cobrado pela tabela de convênio da sua empresa, e você vê a confirmação.",
  },
  "/patio-conveniada": {
    texto:
      "Mostra os veículos que a sua empresa carimbou e que ainda estão no pátio, em todos os estacionamentos com que tem convênio, com os dados do carimbo e o tempo de permanência.",
  },
};

export type ConteudoFixo = { titulo: string; texto: string };

export const BOAS_VINDAS_EQUIPE: ConteudoFixo = {
  titulo: "Bem-vindo ao Murel",
  texto:
    "Vamos passar rapidamente por cada módulo que você pode usar, para você saber onde fica cada coisa. Leva cerca de 2 minutos. Você pode sair a qualquer momento e rever o tour depois pela tela inicial.",
};

export const BOAS_VINDAS_CONVENIADA: ConteudoFixo = {
  titulo: "Bem-vindo ao Murel",
  texto:
    "Vamos mostrar as duas telas que você usa para acompanhar os veículos da sua empresa nos estacionamentos conveniados. Leva menos de 1 minuto. Você pode sair a qualquer momento e rever o tour depois.",
};

export const PRONTO_EQUIPE: ConteudoFixo = {
  titulo: "Tudo certo",
  texto: 'Agora é só começar. Se precisar rever alguma explicação, use o botão "Repetir tour" na tela inicial.',
};

export const PRONTO_CONVENIADA: ConteudoFixo = {
  titulo: "Tudo certo",
  texto: 'Agora é só começar. Se precisar rever alguma explicação, use o botão "Repetir tour" na tela de Carimbar ticket.',
};

const { AdministradorConveniada, GerenteConveniada, UsuarioConveniada } = PERFIL_USUARIO;

export function ehConveniada(perfil: PerfilUsuario | null | undefined): boolean {
  return perfil === AdministradorConveniada || perfil === GerenteConveniada || perfil === UsuarioConveniada;
}
