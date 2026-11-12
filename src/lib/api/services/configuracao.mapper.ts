import { CONFIGURACAO_PADRAO, OPCOES_PADRAO, type Configuracao, type ConfiguracaoCompleta } from "@/types/configuracao";

export interface ConfiguracaoDto {
  configuracaoId: number | null;
  modelo: boolean;
  cor: boolean;
  prisma: boolean;
  entradaDiretoCamera: boolean;
  servicos: boolean;
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
    servicos: booleano(dto?.servicos, OPCOES_PADRAO.servicos),
    entradaDiretoCamera: booleano(dto?.entradaDiretoCamera, OPCOES_PADRAO.entradaDiretoCamera),
    alteradoPorId: alteradoEm ? alteradoPorId : null,
    alteradoEm,
  };
}

// Sempre os cinco campos: o PUT substitui a configuração inteira.
export function toConfiguracaoPayload({ modelo, cor, prisma, servicos, entradaDiretoCamera }: ConfiguracaoCompleta): ConfiguracaoCompleta {
  return { modelo, cor, prisma, servicos, entradaDiretoCamera };
}
