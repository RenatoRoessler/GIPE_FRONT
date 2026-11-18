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
// Terminada sozinha (carro estacionado), a animação recomeça depois deste intervalo. Parada pelo usuário, não.
export const INTERVALO_REINICIO_MS = 2 * 60 * 1000;

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
  // false depois que o usuário para (ou liga o movimento reduzido): aí não há mais reinício.
  let viva = true;
  let quadro: number | null = null;
  let fade: ReturnType<typeof setTimeout> | null = null;
  let reinicio: ReturnType<typeof setTimeout> | null = null;
  let tempo = 0;
  let ultimo: number | null = null;

  function soltar() {
    ativa = false;
    viva = false;
    if (quadro !== null) cancelAnimationFrame(quadro);
    quadro = null;
    if (reinicio !== null) clearTimeout(reinicio);
    reinicio = null;
    observador?.disconnect();
    preferencia.removeEventListener?.("change", aoMudarPreferencia);
  }

  function iniciar() {
    reinicio = null;
    tempo = 0;
    ultimo = null;
    ativa = true;
    quadro = requestAnimationFrame(passo);
  }

  // Parar durante a animação devolve true (quem é link deixa de navegar). Em repouso, entre um ciclo e outro,
  // devolve false, mas cancela o próximo reinício: o usuário já interagiu com o logo.
  function parar() {
    if (!viva) return false;
    const estavaAnimando = ativa;
    soltar();
    aoEncerrar();
    if (!estavaAnimando) return false;
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
      // Terminou sozinha: carro na vaga, e daqui a 2 minutos começa de novo.
      aplicar(elementos, POSE_REPOUSO);
      ativa = false;
      quadro = null;
      reinicio = setTimeout(iniciar, INTERVALO_REINICIO_MS);
      return;
    }
    aplicar(elementos, poseNoTempo(tempo, trilho));
    quadro = requestAnimationFrame(passo);
  }
  iniciar();

  return {
    parar,
    destruir() {
      if (viva) soltar();
      if (fade !== null) clearTimeout(fade);
    },
  };
}

// Roda o trajeto do carro (carroTrajeto) no cliente, com `ativo` e sem preferência por movimento reduzido.
// Termina sozinha com o carro na vaga e recomeça a cada 2 minutos; `parar()` encerra de vez (não recomeça
// enquanto o logo estiver montado).
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
