// Chaves da conferência de pátio. Ficam fora do prefixo do pátio: só as ações que mexem no pátio invalidam `PATIO_QUERY_KEY`.
export const CONFERENCIA_KEY = ["conferencia-patio"] as const;
export const conferenciaResumoKey = [...CONFERENCIA_KEY, "resumo"] as const;
export const conferenciaAbertaKey = [...CONFERENCIA_KEY, "aberta"] as const;
