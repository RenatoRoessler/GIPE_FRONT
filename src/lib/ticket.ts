// A API recebe o código como Int16 (máximo 32767). Cabe: minuto do dia (0-1439) x 20 + blocos de 3 s (0-19),
// no máximo 28799. A unicidade real é do backend; em colisão o modal gera outro código.
export const CODIGO_TICKET_MAX = 32767;

export function gerarCodigoTicket(now: Date = new Date()): number {
  const minutoDoDia = now.getHours() * 60 + now.getMinutes();
  return minutoDoDia * 20 + Math.floor(now.getSeconds() / 3);
}

// Próximo código diferente do atual, respeitando o limite do contrato.
export function proximoCodigoTicket(atual: number, now: Date = new Date()): number {
  const novo = gerarCodigoTicket(now);
  if (novo !== atual) {
    return novo;
  }
  return atual >= CODIGO_TICKET_MAX ? 0 : atual + 1;
}
