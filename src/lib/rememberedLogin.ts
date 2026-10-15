// Login lembrado: CPF em claro e senha cifrada (AES-GCM) no localStorage; a chave é não extraível
// e fica no IndexedDB. Todas as funções engolem erros: sem armazenamento, o login só não é lembrado.

export interface RememberedLogin {
  cpf: string;
  senha: string;
}

interface StoredLogin {
  cpf: string;
  iv: string;
  senha: string;
}

const STORAGE_KEY = "gipe_remembered_login";
const DB_NAME = "gipe";
const STORE_NAME = "keys";
const KEY_ID = "remembered-login";

function toBase64(bytes: Uint8Array): string {
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
}

function fromBase64(value: string): Uint8Array<ArrayBuffer> {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE_NAME);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function withStore<T>(
  mode: IDBTransactionMode,
  run: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  const db = await openDb();
  try {
    return await new Promise<T>((resolve, reject) => {
      const request = run(db.transaction(STORE_NAME, mode).objectStore(STORE_NAME));
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  } finally {
    db.close();
  }
}

async function getKey(create: boolean): Promise<CryptoKey | null> {
  const existing = await withStore<CryptoKey | undefined>("readonly", (store) =>
    store.get(KEY_ID),
  );
  if (existing) return existing;
  if (!create) return null;

  const key = await crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, false, [
    "encrypt",
    "decrypt",
  ]);
  await withStore("readwrite", (store) => store.put(key, KEY_ID));
  return key;
}

export async function saveRememberedLogin({ cpf, senha }: RememberedLogin): Promise<void> {
  try {
    const key = await getKey(true);
    if (!key) return;
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const cipher = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      key,
      new TextEncoder().encode(senha),
    );
    const stored: StoredLogin = {
      cpf,
      iv: toBase64(iv),
      senha: toBase64(new Uint8Array(cipher)),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
  } catch {
    // Sem armazenamento/cripto disponível: o login não é lembrado, sem afetar o fluxo.
  }
}

export async function loadRememberedLogin(): Promise<RememberedLogin | null> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    try {
      const stored = JSON.parse(raw) as StoredLogin;
      const key = await getKey(false);
      if (!key) throw new Error("missing key");
      const plain = await crypto.subtle.decrypt(
        { name: "AES-GCM", iv: fromBase64(stored.iv) },
        key,
        fromBase64(stored.senha),
      );
      return { cpf: stored.cpf, senha: new TextDecoder().decode(plain) };
    } catch {
      await clearRememberedLogin();
      return null;
    }
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
  try {
    await withStore("readwrite", (store) => store.delete(KEY_ID));
  } catch {
    // ignorado
  }
}
