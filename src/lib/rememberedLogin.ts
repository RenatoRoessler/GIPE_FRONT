// Login lembrado: só o CPF fica no localStorage. A senha nunca é guardada (um XSS leria até uma senha cifrada);
// quem quiser preenchê-la automaticamente usa o gerenciador de senhas do navegador.
// Todas as funções engolem erros: sem armazenamento, o login só não é lembrado.

export interface RememberedLogin {
  cpf: string;
}

const STORAGE_KEY = "gipe_remembered_login";
const DB_NAME = "gipe";
const STORE_NAME = "keys";
const KEY_ID = "remembered-login";

// Versões antigas guardavam também a senha cifrada e a chave no IndexedDB: removidas assim que encontradas.
async function removerChaveLegada(): Promise<void> {
  try {
    await new Promise<void>((resolve, reject) => {
      const open = indexedDB.open(DB_NAME, 1);
      open.onupgradeneeded = () => open.result.createObjectStore(STORE_NAME);
      open.onerror = () => reject(open.error);
      open.onsuccess = () => {
        const db = open.result;
        const request = db.transaction(STORE_NAME, "readwrite").objectStore(STORE_NAME).delete(KEY_ID);
        request.onsuccess = () => {
          db.close();
          resolve();
        };
        request.onerror = () => {
          db.close();
          reject(request.error);
        };
      };
    });
  } catch {
    // ignorado
  }
}

export async function saveRememberedLogin({ cpf }: RememberedLogin): Promise<void> {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ cpf }));
  } catch {
    // Sem armazenamento disponível: o login não é lembrado, sem afetar o fluxo.
  }
}

export async function loadRememberedLogin(): Promise<RememberedLogin | null> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const stored = JSON.parse(raw) as { cpf?: unknown; senha?: unknown };
    if ("senha" in stored) {
      // Formato antigo: descarta a senha cifrada e a chave, mantendo só o CPF.
      await removerChaveLegada();
      if (typeof stored.cpf === "string") await saveRememberedLogin({ cpf: stored.cpf });
    }
    return typeof stored.cpf === "string" ? { cpf: stored.cpf } : null;
  } catch {
    return null;
  }
}

export async function clearRememberedLogin(): Promise<void> {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignorado
  }
  await removerChaveLegada();
}
