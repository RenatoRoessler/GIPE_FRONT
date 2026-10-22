// Dados da troca de senha do primeiro acesso, guardados só em memória: nunca em URL, cookie ou storage.
// O token autoriza a troca e a senha temporária (a que o usuário acabou de digitar no login) é a "senha atual" que a
// API pede. Sobrevivem à navegação dentro do app (login -> primeiro acesso) e se perdem ao recarregar a página, que é
// o esperado. Só o navegador escreve aqui; no servidor o valor fica sempre nulo.
export type PasswordChange = { token: string; senhaAtual: string };

let current: PasswordChange | null = null;
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((listener) => listener());
}

export function setPasswordChange(value: PasswordChange): void {
  current = value;
  notify();
}

// Mesma referência até mudar, como o useSyncExternalStore exige.
export function getPasswordChange(): PasswordChange | null {
  return current;
}

export function clearPasswordChange(): void {
  if (current === null) return;
  current = null;
  notify();
}

// Compatível com o `subscribe` do useSyncExternalStore.
export function subscribePasswordChange(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
