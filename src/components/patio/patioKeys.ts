// Chave da consulta do pátio. Fica fora das telas de veículos para a saída e a entrada poderem invalidá-la sem ciclo de importação.
export const PATIO_QUERY_KEY = ["patio"] as const;

// Valor e dados do estabelecimento do ticket aberto. Começa pela chave do pátio: entrada, saída e troca de chave também o invalidam.
export const patioComprovanteKey = (token: string) => [...PATIO_QUERY_KEY, "comprovante", token] as const;
