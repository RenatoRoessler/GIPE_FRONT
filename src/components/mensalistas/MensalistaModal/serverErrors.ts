import { normalizePlaca } from "@/lib/placa";

// O back recusa o cadastro citando a placa na mensagem (ex.: "A placa ABC1D23 pertence a outro mensalista").
// Se a mensagem cita a placa de um veículo da lista, o erro pertence ao campo daquele veículo; senão devolve null
// e a mensagem fica no banner do modal.
// [A CONFIRMAR] com a API real: o texto exato dessas mensagens (ver T18).
export function mapMensalistaServerError(message: string, veiculos: { placa: string }[]): { index: number } | null {
  const palavras = message.toUpperCase().match(/[A-Z0-9-]+/g) ?? [];
  const citadas = new Set(palavras.map((palavra) => normalizePlaca(palavra)));
  const index = veiculos.findIndex((veiculo) => {
    const placa = normalizePlaca(veiculo.placa);
    return placa.length === 7 && citadas.has(placa);
  });
  return index >= 0 ? { index } : null;
}
