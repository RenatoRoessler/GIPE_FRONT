// Quais dados do veículo a empresa exige na entrada (true = obrigatório).
export interface ConfiguracaoValues {
  modelo: boolean;
  cor: boolean;
  prisma: boolean;
}

export interface Configuracao extends ConfiguracaoValues {
  // Última alteração; null se a configuração nunca foi alterada.
  alteradoPorId: number | null;
  alteradoEm: string | null;
}

// Empresa sem configuração gravada: modelo e cor obrigatórios, prisma opcional.
export const CONFIGURACAO_PADRAO: ConfiguracaoValues = { modelo: true, cor: true, prisma: false };
