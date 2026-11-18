// Trajeto do carro do logo animado, em unidades do viewBox do símbolo (240×160). Função pura, sem DOM: dado o
// tempo, diz onde o carro está e quais luzes estão acesas. Geometria e tempos vêm do protótipo
// (docs/specs/logo-animado), ajustados ao símbolo oficial; a sequência começa e termina com o carro na vaga.

export interface Pose {
  // Deslocamento do centro do carro em relação à vaga e rotação em graus (0 = apontando para cima).
  dx: number;
  dy: number;
  angulo: number;
  // false enquanto o logo fica vazio, entre a saída e a próxima entrada.
  visivel: boolean;
  freio: number;
  re: number;
  facho: number;
}

export interface Trilho {
  // x onde o carro surge à direita (fora da vista) e x onde ele termina à esquerda.
  inicioX: number;
  fimX: number;
}

export type Fase = "espera" | "re" | "troca" | "saida" | "vazio" | "entrada" | "estacionado" | "assentamento";

// Centro do carro estacionado na vaga do meio.
export const VAGA_X = 120;
export const VAGA_Y = 95;
// Rua logo abaixo das vagas: o carro deitado (36 de largura) passa colado à linha de baixo do símbolo
// (y 140, com a ponta arredondada até 149), para a faixa que o logo reserva abaixo de si ser pequena.
export const RUA_Y = 168;
const RAIO = 60;
const CURVA_CX = VAGA_X + RAIO;
const CURVA_CY = RUA_Y - RAIO;

const FACHO_MAX = 0.5;

const DURACAO: Record<Fase, number> = {
  espera: 1.2,
  re: 1.5,
  troca: 0.35,
  saida: 1.7,
  vazio: 1.2,
  entrada: 3.4,
  estacionado: 6,
  assentamento: 0.6,
};

// Dois ciclos: o carro sai e volta duas vezes; a segunda chegada assenta e o logo fica em repouso.
const SEQUENCIA: readonly Fase[] = [
  "espera",
  "re",
  "troca",
  "saida",
  "vazio",
  "entrada",
  "estacionado",
  "re",
  "troca",
  "saida",
  "vazio",
  "entrada",
  "assentamento",
];

export const FASES: readonly { nome: Fase; duracao: number }[] = SEQUENCIA.map((nome) => ({ nome, duracao: DURACAO[nome] }));

export const DURACAO_TOTAL = FASES.reduce((total, fase) => total + fase.duracao, 0);

export const POSE_REPOUSO: Pose = { dx: 0, dy: 0, angulo: 0, visivel: true, freio: 0, re: 0, facho: 0 };

const easeOutCubic = (t: number) => 1 - (1 - t) ** 3;
const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2);
const easeInQuad = (t: number) => t * t;

const COMPRIMENTO_ARCO = (Math.PI / 2) * RAIO;
const COMPRIMENTO_SUBIDA = CURVA_CY - VAGA_Y;

interface Ponto {
  x: number;
  y: number;
  angulo: number;
}

function comprimentoDaReta(trilho: Trilho) {
  return Math.max(trilho.inicioX - CURVA_CX, 0);
}

function comprimentoDaEntrada(trilho: Trilho) {
  return comprimentoDaReta(trilho) + COMPRIMENTO_ARCO + COMPRIMENTO_SUBIDA;
}

// Ponto do trajeto de entrada a `s` unidades do início (s = 0 na rua, à direita; no fim, na vaga).
function pontoDaEntrada(s: number, trilho: Trilho): Ponto {
  const reta = comprimentoDaReta(trilho);
  if (s <= reta) return { x: trilho.inicioX - s, y: RUA_Y, angulo: -90 };
  const noArco = s - reta;
  if (noArco <= COMPRIMENTO_ARCO) {
    const t = noArco / COMPRIMENTO_ARCO;
    const theta = (t * Math.PI) / 2;
    return { x: CURVA_CX - RAIO * Math.sin(theta), y: CURVA_CY + RAIO * Math.cos(theta), angulo: -90 + 90 * t };
  }
  const naSubida = Math.min(noArco - COMPRIMENTO_ARCO, COMPRIMENTO_SUBIDA);
  return { x: VAGA_X, y: CURVA_CY - naSubida, angulo: 0 };
}

function pose(ponto: Ponto, luzes: Partial<Pick<Pose, "freio" | "re" | "facho" | "visivel">> = {}): Pose {
  return {
    dx: ponto.x - VAGA_X,
    dy: ponto.y - VAGA_Y,
    angulo: ponto.angulo,
    visivel: luzes.visivel ?? true,
    freio: luzes.freio ?? 0,
    re: luzes.re ?? 0,
    facho: luzes.facho ?? 0,
  };
}

const NA_VAGA: Ponto = { x: VAGA_X, y: VAGA_Y, angulo: 0 };

// Pose dentro de uma fase, com `t` em segundos desde o início dela.
function poseNaFase(fase: Fase, t: number, trilho: Trilho): Pose {
  const duracao = DURACAO[fase];
  const p = Math.min(Math.max(t / duracao, 0), 1);

  switch (fase) {
    case "espera":
      // Parado; antes de sair acende os faróis e, por último, a ré.
      return pose(NA_VAGA, {
        facho: t > duracao - 0.5 ? (FACHO_MAX * (t - (duracao - 0.5))) / 0.5 : 0,
        re: t > duracao - 0.4 ? 1 : 0,
      });
    case "re": {
      // Refaz a entrada ao contrário, da vaga até o começo da curva.
      const inicio = comprimentoDaEntrada(trilho);
      const fim = comprimentoDaReta(trilho);
      const s = inicio + (fim - inicio) * easeInOutCubic(p);
      return pose(pontoDaEntrada(s, trilho), { re: 1, freio: p > 0.85 ? 1 : 0, facho: FACHO_MAX });
    }
    case "troca":
      return pose(pontoDaEntrada(comprimentoDaReta(trilho), trilho), { freio: 1, facho: FACHO_MAX });
    case "saida":
      return pose({ x: CURVA_CX - easeInQuad(p) * (CURVA_CX - trilho.fimX), y: RUA_Y, angulo: -90 }, { facho: FACHO_MAX });
    case "vazio":
      return pose({ x: trilho.fimX, y: RUA_Y, angulo: -90 }, { visivel: false });
    case "entrada":
      return pose(pontoDaEntrada(easeOutCubic(p) * comprimentoDaEntrada(trilho), trilho), {
        freio: p > 0.82 ? 1 : 0,
        facho: FACHO_MAX,
      });
    case "estacionado": {
      // Freio na parada, faróis se apagam; no fim, faróis de novo e a ré, para o próximo ciclo.
      let facho = 0;
      if (t < 0.6) facho = FACHO_MAX * (1 - t / 0.6);
      else if (t > duracao - 0.5) facho = (FACHO_MAX * (t - (duracao - 0.5))) / 0.5;
      return pose(NA_VAGA, { freio: t < 0.6 ? 1 : 0, facho, re: t > duracao - 0.4 ? 1 : 0 });
    }
    case "assentamento":
      // Última chegada: o freio pisca e os faróis se apagam até o repouso.
      return pose(NA_VAGA, { freio: 1, facho: FACHO_MAX * (1 - p) });
  }
}

export function terminou(t: number): boolean {
  return t >= DURACAO_TOTAL;
}

export function poseNoTempo(t: number, trilho: Trilho): Pose {
  if (t <= 0) return poseNaFase("espera", 0, trilho);
  if (terminou(t)) return POSE_REPOUSO;
  let restante = t;
  for (const fase of FASES) {
    if (restante < fase.duracao) return poseNaFase(fase.nome, restante, trilho);
    restante -= fase.duracao;
  }
  return POSE_REPOUSO;
}
