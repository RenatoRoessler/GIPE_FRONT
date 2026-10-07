// Mocks temporários (sem chamada de rede real) para ações que ainda não têm
// backend. Cada função aqui é candidata a virar uma chamada de API de verdade
// quando o backend existir — mantidas centralizadas para facilitar essa troca.

export function mockRecoverPassword(cpf: string): Promise<void> {
  void cpf;
  return new Promise((resolve) => {
    setTimeout(resolve, 900);
  });
}

export function mockResetPassword(senha: string): Promise<void> {
  void senha;
  return new Promise((resolve) => {
    setTimeout(resolve, 900);
  });
}
