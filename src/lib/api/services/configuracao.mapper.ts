import { CONFIGURACAO_PADRAO, type Configuracao, type ConfiguracaoValues } from "@/types/configuracao";

export interface ConfiguracaoDto {
  configuracaoId: number | null;
  modelo: boolean;
  cor: boolean;
  prisma: boolean;
  usuarioId: number | null;
  dataCriacao: string | null;
  usuarioIdAlteracao: number | null;
  dataAlteracao: string | null;
}

function booleano(valor: unknown, padrao: boolean): boolean {
  return typeof valor === "boolean" ? valor : padrao;
}

function dataValida(valor: unknown): string | null {
  return typeof valor === "string" && !Number.isNaN(Date.parse(valor)) ? valor : null;
}

// Campo ausente cai no padrão da empresa; autor e data da alteração só valem se vierem completos.
export function fromConfiguracaoResponse(dto: Partial<ConfiguracaoDto> | null | undefined): Configuracao {
  const alteradoEm = dataValida(dto?.dataAlteracao);
  const alteradoPorId = typeof dto?.usuarioIdAlteracao === "number" ? dto.usuarioIdAlteracao : null;
  return {
    modelo: booleano(dto?.modelo, CONFIGURACAO_PADRAO.modelo),
    cor: booleano(dto?.cor, CONFIGURACAO_PADRAO.cor),
    prisma: booleano(dto?.prisma, CONFIGURACAO_PADRAO.prisma),
    alteradoPorId: alteradoEm ? alteradoPorId : null,
    alteradoEm,
  };
}

export function toConfiguracaoPayload({ modelo, cor, prisma }: ConfiguracaoValues): ConfiguracaoValues {
  return { modelo, cor, prisma };
}
