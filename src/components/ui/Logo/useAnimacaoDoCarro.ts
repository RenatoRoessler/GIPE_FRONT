"use client";

import { type RefObject, useCallback, useEffect, useMemo, useRef } from "react";
import { POSE_REPOUSO, type Pose, poseNoTempo, terminou, type Trilho, VAGA_X, VAGA_Y } from "./carroTrajeto";
import type { CarroRefs } from "./MurelSymbol";

// Altura do viewBox do símbolo: converte pixels da área do logo em unidades do trajeto.
const ALTURA_VIEWBOX = 160;
// Meio comprimento do carro mais folga: ele surge e some fora da área do logo.
const FOLGA_FORA_DA_VISTA = 40;
// Teto do intervalo entre quadros: com a aba em segundo plano o navegador suspende os quadros, e a volta não
// pode "pular" fases (a animação pausa e continua de onde estava).
const DELTA_MAXIMO_MS = 50;
// Parar some com o carro, põe na vaga e mostra de novo (a transição de opacidade fica no CSS do Logo).
export const FADE_PARADA_MS = 150;

const MOVIMENTO_REDUZIDO = "(prefers-reduced-motion: reduce)";

export interface AnimacaoDoCarroOpcoes {
  ativo: boolean;
  // Caixa do logo (símbolo + palavra): a largura define de onde o carro entra.
  area: RefObject<HTMLElement | null>;
  // Altura do símbolo em pixels.
  alturaSimbolo: number;
}

export interface AnimacaoDoCarro {
  refs: CarroRefs;
  // Para a animação e põe o carro na vaga. Devolve true se estava animando.
  parar: () => boolean;
}

interface ElementosDoCarro {
  carro: SVGGElement | null;
  freio: SVGGElement | null;
  re: SVGGElement | null;
  facho: SVGPathElement | null;
}

interface Controle {
  parar: () => boolean;
  destruir: () => void;
}

function aplicar(elementos: ElementosDoCarro, pose: Pose) {
  const { carro, freio, re, facho } = elementos;
  if (carro) {
    carro.setAttribute("transform", `translate(${pose.dx.toFixed(2)} ${pose.dy.toFixed(2)}) rotate(${pose.angulo.toFixed(2)} ${VAGA_X} ${VAGA_Y})`);
    carro.style.visibility = pose.visivel ? "" : "hidden";
  }
  freio?.setAttribute("opacity", String(pose.freio));
  re?.setAttribute("opacity", String(pose.re));
  facho?.setAttribute("opacity", pose.facho.toFixed(3));
}

function podeAnimar() {
  return typeof window !== "undefined" && typeof window.matchMedia === "function" && !window.matchMedia(MOVIMENTO_REDUZIDO).matches;
}

// A animação em si, fora do React: laço de quadros, medida do trilho, preferência de movimento e a parada.
// Escreve direto nos atributos do SVG, sem render por quadro.
function criarAnimacao(elementos: ElementosDoCarro, area: HTMLElement | null, escala: number, aoEncerrar: () => void): Controle {
  const trilho: Trilho = { inicioX: 0, fimX: -FOLGA_FORA_DA_VISTA };
  const medir = () => {
    trilho.inicioX = (area?.offsetWidth ?? 0) / escala + FOLGA_FORA_DA_VISTA;
  };
  medir();
  const observador = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(medir);
  if (area) observador?.observe(area);

  const preferencia = window.matchMedia(MOVIMENTO_REDUZIDO);
  let ativa = true;
  let quadro: number | null = null;
  let fade: ReturnType<typeof setTimeout> | null = null;
  let tempo = 0;
  let ultimo: number | null = null;

  function soltar() {
    ativa = false;
    if (quadro !== null) cancelAnimationFrame(quadro);
    quadro = null;
    observador?.disconnect();
    preferencia.removeEventListener?.("change", aoMudarPreferencia);
  }

  function parar() {
    if (!ativa) return false;
    soltar();
    aoEncerrar();
    const grupo = elementos.carro;
    if (grupo) grupo.style.opacity = "0";
    fade = setTimeout(() => {
      aplicar(elementos, POSE_REPOUSO);
      if (grupo) grupo.style.opacity = "";
      fade = null;
    }, FADE_PARADA_MS);
    return true;
  }

  function aoMudarPreferencia(evento: MediaQueryListEvent) {
    if (evento.matches) parar();
  }
  preferencia.addEventListener?.("change", aoMudarPreferencia);

  function passo(agora: number) {
    // Um quadro já agendado que chega depois de parar não faz nada.
    if (!ativa) return;
    const delta = ultimo === null ? 0 : Math.min(agora - ultimo, DELTA_MAXIMO_MS);
    ultimo = agora;
    tempo += delta / 1000;
    if (terminou(tempo)) {
      aplicar(elementos, POSE_REPOUSO);
      soltar();
      aoEncerrar();
      return;
    }
    aplicar(elementos, poseNoTempo(tempo, trilho));
    quadro = requestAnimationFrame(passo);
  }
  quadro = requestAnimationFrame(passo);

  return {
    parar,
    destruir() {
      if (ativa) soltar();
      if (fade !== null) clearTimeout(fade);
    },
  };
}

// Roda o trajeto do carro (carroTrajeto) no cliente, com `ativo` e sem preferência por movimento reduzido;
// termina sozinha com o carro na vaga, ou antes, por `parar()`. Depois de parada ou terminada, não recomeça
// enquanto o logo estiver montado.
export function useAnimacaoDoCarro({ ativo, area, alturaSimbolo }: AnimacaoDoCarroOpcoes): AnimacaoDoCarro {
  const carro = useRef<SVGGElement>(null);
  const freio = useRef<SVGGElement>(null);
  const re = useRef<SVGGElement>(null);
  const facho = useRef<SVGPathElement>(null);
  const refs = useMemo<CarroRefs>(() => ({ carro, freio, re, facho }), []);

  const controle = useRef<Controle | null>(null);
  const encerrada = useRef(false);

  useEffect(() => {
    if (!ativo || encerrada.current || !podeAnimar()) return;
    const escala = Math.max(alturaSimbolo, 1) / ALTURA_VIEWBOX;
    const elementos = { carro: carro.current, freio: freio.current, re: re.current, facho: facho.current };
    const atual = criarAnimacao(elementos, area.current, escala, () => {
      encerrada.current = true;
    });
    controle.current = atual;
    return () => {
      atual.destruir();
      controle.current = null;
    };
  }, [ativo, area, alturaSimbolo]);

  const parar = useCallback(() => controle.current?.parar() ?? false, []);

  return { refs, parar };
}
