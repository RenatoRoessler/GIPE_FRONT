"use client";

import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import { criarConsenso, criarReconhecedorPlaca, extrairPlaca, type ReconhecedorPlaca } from "@/lib/ocrPlaca";

export type LeitorPlacaEstado = "ocioso" | "abrindo" | "lendo" | "negada" | "indisponivel" | "sem-leitura";

export interface UseLeitorPlacaOptions {
  // Câmera ligada enquanto true; ao virar false (ou desmontar) tudo é liberado.
  ativo: boolean;
  // Placa válida, lida de forma consistente em quadros seguidos.
  onPlaca: (placa: string) => void;
  // Tempo sem placa válida até desistir.
  tempoLimiteMs?: number;
  // Intervalo mínimo entre leituras, para não saturar a CPU.
  intervaloMs?: number;
}

export interface UseLeitorPlaca {
  videoRef: RefObject<HTMLVideoElement | null>;
  estado: LeitorPlacaEstado;
  // false quando a câmera não pode abrir por falta de HTTPS (o navegador remove a API).
  contextoSeguro: boolean;
  iniciar: () => void;
}

// A moldura de enquadramento ocupa 80% da largura do vídeo, em proporção de placa (≈ 3:1).
export const MOLDURA_LARGURA = 0.8;
export const MOLDURA_PROPORCAO = 3;
const ALTURA_OCR = 96;
const TEMPO_LIMITE_MS = 15000;
const INTERVALO_MS = 400;

// Recorta a moldura, passa para tons de cinza e estica o contraste para o OCR.
function prepararQuadro(video: HTMLVideoElement, canvas: HTMLCanvasElement): boolean {
  const contexto = canvas.getContext("2d", { willReadFrequently: true });
  if (!contexto || !video.videoWidth || !video.videoHeight) {
    return false;
  }

  const largura = video.videoWidth * MOLDURA_LARGURA;
  const altura = Math.min(largura / MOLDURA_PROPORCAO, video.videoHeight);
  canvas.height = ALTURA_OCR;
  canvas.width = Math.round(ALTURA_OCR * (largura / altura));
  contexto.drawImage(
    video,
    (video.videoWidth - largura) / 2,
    (video.videoHeight - altura) / 2,
    largura,
    altura,
    0,
    0,
    canvas.width,
    canvas.height,
  );

  const imagem = contexto.getImageData(0, 0, canvas.width, canvas.height);
  const { data } = imagem;
  let minimo = 255;
  let maximo = 0;
  for (let i = 0; i < data.length; i += 4) {
    const cinza = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
    data[i] = data[i + 1] = data[i + 2] = cinza;
    minimo = Math.min(minimo, cinza);
    maximo = Math.max(maximo, cinza);
  }
  const faixa = Math.max(maximo - minimo, 1);
  for (let i = 0; i < data.length; i += 4) {
    const valor = Math.round(((data[i] - minimo) / faixa) * 255);
    data[i] = data[i + 1] = data[i + 2] = valor;
  }
  contexto.putImageData(imagem, 0, 0);
  return true;
}

export function useLeitorPlaca({
  ativo,
  onPlaca,
  tempoLimiteMs = TEMPO_LIMITE_MS,
  intervaloMs = INTERVALO_MS,
}: UseLeitorPlacaOptions): UseLeitorPlaca {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [estado, setEstado] = useState<LeitorPlacaEstado>("ocioso");
  const [contextoSeguro, setContextoSeguro] = useState(true);

  const onPlacaRef = useRef(onPlaca);
  const ativoRef = useRef(ativo);
  const streamRef = useRef<MediaStream | null>(null);
  const reconhecedorRef = useRef<ReconhecedorPlaca | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const limiteRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Cada parada invalida as aberturas e leituras que ainda estavam em andamento.
  const sessaoRef = useRef(0);
  const abrindoRef = useRef(false);

  useEffect(() => {
    onPlacaRef.current = onPlaca;
    ativoRef.current = ativo;
  });

  const parar = useCallback(() => {
    sessaoRef.current += 1;
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (limiteRef.current) {
      clearTimeout(limiteRef.current);
      limiteRef.current = null;
    }
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    void reconhecedorRef.current?.encerrar();
    reconhecedorRef.current = null;
  }, []);

  const iniciar = useCallback(async () => {
    if (!ativoRef.current || streamRef.current || abrindoRef.current) {
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      setContextoSeguro(window.isSecureContext !== false);
      setEstado("indisponivel");
      return;
    }

    const sessao = sessaoRef.current;
    abrindoRef.current = true;
    setEstado("abrindo");
    try {
      // A câmera e o OCR carregam juntos; o OCR é baixado só na primeira vez.
      const [stream, reconhecedor] = await Promise.all([
        navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } },
          audio: false,
        }),
        criarReconhecedorPlaca().catch(() => null),
      ]);
      const video = videoRef.current;
      if (sessao !== sessaoRef.current || !video) {
        stream.getTracks().forEach((track) => track.stop());
        void reconhecedor?.encerrar();
        return;
      }
      if (!reconhecedor) {
        stream.getTracks().forEach((track) => track.stop());
        setEstado("indisponivel");
        return;
      }
      streamRef.current = stream;
      reconhecedorRef.current = reconhecedor;
      video.srcObject = stream;
      await video.play();
      if (sessao !== sessaoRef.current) {
        return;
      }
      setEstado("lendo");
      varrer(video, reconhecedor, sessao);
    } catch (error) {
      if (sessao === sessaoRef.current) {
        parar();
        // Câmera ocupada, sem câmera ou outra falha: não há o que o operador possa liberar no navegador.
        setEstado(error instanceof DOMException && error.name === "NotAllowedError" ? "negada" : "indisponivel");
      }
    } finally {
      abrindoRef.current = false;
    }

    function varrer(video: HTMLVideoElement, reconhecedor: ReconhecedorPlaca, atual: number) {
      const canvas = document.createElement("canvas");
      const consenso = criarConsenso();

      limiteRef.current = setTimeout(() => {
        if (atual !== sessaoRef.current) {
          return;
        }
        parar();
        setEstado("sem-leitura");
      }, tempoLimiteMs);

      async function passo() {
        if (atual !== sessaoRef.current) {
          return;
        }
        const inicio = Date.now();
        try {
          if (video.readyState >= 2 && prepararQuadro(video, canvas)) {
            const texto = await reconhecedor.reconhecer(canvas);
            if (atual !== sessaoRef.current) {
              return;
            }
            const placa = consenso.registrar(extrairPlaca(texto));
            if (placa) {
              if (navigator.vibrate) {
                navigator.vibrate(80);
              }
              parar();
              onPlacaRef.current(placa);
              return;
            }
          }
        } catch {
          // Uma leitura que falha é só uma leitura perdida; o tempo limite cobre o caso de falhar sempre.
        }
        if (atual === sessaoRef.current) {
          timerRef.current = setTimeout(() => void passo(), Math.max(0, intervaloMs - (Date.now() - inicio)));
        }
      }
      void passo();
    }
  }, [parar, tempoLimiteMs, intervaloMs]);

  useEffect(() => {
    if (!ativo) {
      return;
    }
    // Adiado um tick: o início atualiza o estado e o StrictMode monta e desmonta o efeito em seguida.
    const timer = setTimeout(() => void iniciar(), 0);
    return () => {
      clearTimeout(timer);
      parar();
      abrindoRef.current = false;
    };
  }, [ativo, iniciar, parar]);

  return {
    videoRef,
    // Fora de uso a câmera está liberada, qualquer que tenha sido o último estado.
    estado: ativo ? estado : "ocioso",
    contextoSeguro,
    iniciar: () => void iniciar(),
  };
}
