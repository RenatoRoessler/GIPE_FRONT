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

// No app instalado (PWA) não há barra de endereço nem cadeado: a permissão se muda pelo sistema.
const PASSOS_APP_INSTALADO = {
  ios: [
    "Abra os Ajustes do iPhone e toque em Safari.",
    "Em Câmera, escolha Perguntar ou Permitir.",
  ],
  android: [
    "Segure o ícone do app na tela inicial e toque em Informações do app.",
    "Abra Permissões, depois Câmera, e escolha Permitir.",
    "Se continuar sem abrir, confira nos Ajustes do Android, em Apps e Chrome, se a Câmera está permitida.",
  ],
  computador: ["Abra o menu ⋮ do app e escolha Configurações do site.", "Em Câmera, escolha Permitir."],
};

// App aberto pelo ícone da tela inicial, sem a interface do navegador.
export function appInstalado(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  const standaloneIos = (navigator as Navigator & { standalone?: boolean }).standalone === true;
  return standaloneIos || window.matchMedia?.("(display-mode: standalone)").matches === true;
}

// Passos para liberar uma câmera bloqueada, no caminho de cada navegador (ou do app instalado).
export function passosParaLiberarCamera(userAgent: string, instalado = false): string[] {
  if (instalado) {
    if (/iPhone|iPad|iPod/i.test(userAgent)) {
      return PASSOS_APP_INSTALADO.ios;
    }
    return /Android/i.test(userAgent) ? PASSOS_APP_INSTALADO.android : PASSOS_APP_INSTALADO.computador;
  }
  return PASSOS[detectarNavegador(userAgent)];
}
