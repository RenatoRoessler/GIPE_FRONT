export type PermissaoCamera = "granted" | "prompt" | "denied" | "desconhecida";

export type NavegadorCamera = "ios-safari" | "ios-chrome" | "chrome" | "firefox" | "outro";

const CHAVE_EXPLICACAO = "murel:camera-explicacao-vista";

// Pergunta ao navegador, sem abrir a câmera, se a permissão já foi dada, bloqueada ou ainda será pedida.
// Navegadores sem essa consulta (ex.: Safari) devolvem "desconhecida".
export async function consultarPermissaoCamera(): Promise<PermissaoCamera> {
  try {
    if (typeof navigator === "undefined" || !navigator.permissions?.query) {
      return "desconhecida";
    }
    const status = await navigator.permissions.query({ name: "camera" as PermissionName });
    return status.state;
  } catch {
    return "desconhecida";
  }
}

// A explicação antes do pedido do navegador aparece uma vez por aparelho.
export function explicacaoCameraVista(): boolean {
  try {
    return window.localStorage.getItem(CHAVE_EXPLICACAO) === "1";
  } catch {
    return false;
  }
}

export function marcarExplicacaoCameraVista(): void {
  try {
    window.localStorage.setItem(CHAVE_EXPLICACAO, "1");
  } catch {
    // Sem armazenamento, a explicação só volta a aparecer na próxima abertura.
  }
}

export function detectarNavegador(userAgent: string): NavegadorCamera {
  if (/iPhone|iPad|iPod/i.test(userAgent)) {
    return /CriOS|FxiOS|EdgiOS/i.test(userAgent) ? "ios-chrome" : "ios-safari";
  }
  if (/Firefox/i.test(userAgent)) {
    return "firefox";
  }
  return /Chrome|Chromium|Edg|SamsungBrowser/i.test(userAgent) ? "chrome" : "outro";
}

const PASSOS: Record<NavegadorCamera, string[]> = {
  "ios-safari": ["Toque em “aA” na barra de endereço.", "Escolha Ajustes do Site e, em Câmera, toque em Permitir."],
  "ios-chrome": ["Abra os Ajustes do aparelho e toque no navegador.", "Ative a opção Câmera."],
  chrome: ["Toque no cadeado ao lado do endereço.", "Abra Permissões, depois Câmera, e escolha Permitir."],
  firefox: ["Toque no cadeado ao lado do endereço.", "Em Permissões, tire o bloqueio da Câmera."],
  outro: ["Abra as configurações do site no navegador.", "Permita o uso da câmera."],
};

// Passos para liberar uma câmera bloqueada, no caminho de cada navegador.
export function passosParaLiberarCamera(userAgent: string): string[] {
  return PASSOS[detectarNavegador(userAgent)];
}
