// Confirmação física das leituras pela câmera: o manobrista aponta o celular para o carro, não para a tela, então a
// vibração (e o bip) dizem se a leitura valeu sem ele precisar olhar. Tudo é opcional: sem vibração ou sem áudio
// no aparelho, ou se o navegador recusar, a leitura segue normalmente em silêncio.

const VIBRACAO_CERTA_MS = 80;
const VIBRACAO_DUVIDOSA_MS = [80, 80, 80];
const BIP_FREQUENCIA_HZ = 880;
const BIP_DURACAO_S = 0.08;
const BIP_VOLUME = 0.15;

type ContextoDeAudio = typeof AudioContext;

let audio: AudioContext | null = null;

function vibrar(padrao: number | number[]) {
  try {
    if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
      navigator.vibrate(padrao);
    }
  } catch {
    // Vibrar é só reforço.
  }
}

function contextoDeAudio(): AudioContext | null {
  if (typeof window === "undefined") {
    return null;
  }
  const Construtor: ContextoDeAudio | undefined =
    window.AudioContext ?? (window as unknown as { webkitAudioContext?: ContextoDeAudio }).webkitAudioContext;
  if (!Construtor) {
    return null;
  }
  audio ??= new Construtor();
  return audio;
}

function bipar() {
  try {
    const contexto = contextoDeAudio();
    if (!contexto) {
      return;
    }
    // Navegadores deixam o áudio suspenso até um gesto do usuário; depois disso ele retoma.
    if (contexto.state === "suspended") {
      void contexto.resume().catch(() => undefined);
    }
    const oscilador = contexto.createOscillator();
    const ganho = contexto.createGain();
    oscilador.frequency.value = BIP_FREQUENCIA_HZ;
    ganho.gain.value = BIP_VOLUME;
    oscilador.connect(ganho);
    ganho.connect(contexto.destination);
    oscilador.start();
    oscilador.stop(contexto.currentTime + BIP_DURACAO_S);
  } catch {
    // Sem áudio: a vibração e a borda verde já avisaram.
  }
}

// Leitura certa: uma vibração curta e um bip.
export function confirmarLeitura(): void {
  vibrar(VIBRACAO_CERTA_MS);
  bipar();
}

// Leitura em dúvida: duas vibrações e nenhum som, para o operador saber que precisa olhar a tela.
export function leituraDuvidosa(): void {
  vibrar(VIBRACAO_DUVIDOSA_MS);
}
