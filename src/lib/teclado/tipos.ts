export type ModoNumerico = "inteiro" | "decimal" | "livre";

export type TecladoConfig =
  | { tipo: "placa" }
  | { tipo: "numerico"; modo: ModoNumerico }
  | { tipo: "alfa" };

// Configurações usadas nas telas; constantes mantêm a identidade estável entre renderizações.
export const TECLADO_PLACA: TecladoConfig = { tipo: "placa" };
export const TECLADO_ALFA: TecladoConfig = { tipo: "alfa" };
export const TECLADO_INTEIRO: TecladoConfig = { tipo: "numerico", modo: "inteiro" };
export const TECLADO_DECIMAL: TecladoConfig = { tipo: "numerico", modo: "decimal" };
