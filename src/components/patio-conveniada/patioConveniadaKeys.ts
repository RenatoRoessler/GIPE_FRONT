// Chave da lista do pátio da conveniada. Fica num arquivo sem dependências para o carimbo poder invalidá-la sem ciclo de importação.
export const PATIO_CONVENIADA_KEY = ["patio-conveniada"] as const;

// `placa` é a placa completa e válida enviada ao servidor, ou "" para a lista inteira.
export const patioConveniadaKey = (placa: string) => [...PATIO_CONVENIADA_KEY, placa] as const;
