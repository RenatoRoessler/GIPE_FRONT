// Campos ausentes na consulta de CEP vêm como string vazia.
export interface CepAddress {
  logradouro: string;
  bairro: string;
  cidade: string;
  estado: string;
}
