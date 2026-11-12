// Quais dados do veículo a empresa exige na entrada (true = obrigatório).
export interface ConfiguracaoValues {
  modelo: boolean;
  cor: boolean;
  prisma: boolean;
}

// Opções da empresa que a tela de entrada não edita, mas que o PUT precisa devolver como estão: o back trata campo
// ausente como o padrão (serviços desligados, câmera direta ligada) e apagaria o que a empresa escolheu.
export interface ConfiguracaoOpcoes {
  // Serviços (lava-rápido) no pátio: com true o veículo pode receber serviços.
  servicos: boolean;
  // A entrada do pátio abre direto a câmera.
  entradaDiretoCamera: boolean;
}

export type ConfiguracaoCompleta = ConfiguracaoValues & ConfiguracaoOpcoes;

export interface Configuracao extends ConfiguracaoCompleta {
  // Última alteração; null se a configuração nunca foi alterada.
  alteradoPorId: number | null;
  alteradoEm: string | null;
}

// Empresa sem configuração gravada: modelo e cor obrigatórios, prisma opcional.
export const CONFIGURACAO_PADRAO: ConfiguracaoValues = { modelo: true, cor: true, prisma: false };

export const OPCOES_PADRAO: ConfiguracaoOpcoes = { servicos: false, entradaDiretoCamera: true };
