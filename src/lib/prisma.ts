// Prisma: número inteiro de 1 a 999, usado só quando a empresa o exige na configuração.
export const PRISMA_MIN = 1;
export const PRISMA_MAX = 999;
export const PRISMA_DIGITOS = String(PRISMA_MAX).length;

export const PRISMA_OBRIGATORIO_MESSAGE = `Informe o prisma (de ${PRISMA_MIN} a ${PRISMA_MAX})`;
export const PRISMA_INTERVALO_MESSAGE = `Use um número de ${PRISMA_MIN} a ${PRISMA_MAX}`;

// Só os dígitos, até o limite do campo: o que não é número some ao digitar ou colar.
export function somenteDigitosDoPrisma(texto: string): string {
  return texto.replace(/\D/g, "").slice(0, PRISMA_DIGITOS);
}

// Texto do campo -> número. Vazio, zero ou fora de 1 a 999 não são prisma: `null`.
export function prismaDoTexto(texto: string): number | null {
  const digitos = texto.trim();
  if (!/^\d+$/.test(digitos)) {
    return null;
  }
  const numero = Number(digitos);
  return numero >= PRISMA_MIN && numero <= PRISMA_MAX ? numero : null;
}
