"use client";

import { useCallback, useEffect, useRef, useState, type RefObject } from "react";

export type LeitorQrEstado = "ocioso" | "abrindo" | "lendo" | "negada" | "indisponivel";

export interface UseLeitorQrOptions {
  // Câmera ligada enquanto true; ao virar false (ou desmontar) tudo é liberado.
  ativo: boolean;
  // Texto lido em um QR; o mesmo texto repetido em sequência é ignorado por um instante.
  onTexto: (texto: string) => void;
}

export interface UseLeitorQr {
  videoRef: RefObject<HTMLVideoElement | null>;
  estado: LeitorQrEstado;
  // Para navegadores que só abrem a câmera após um toque.
  iniciar: () => void;
}

type Detector = { detect: (source: HTMLVideoElement) => Promise<{ rawValue: string }[]> };
type DetectorConstructor = new (options: { formats: string[] }) => Detector;
type JsQr = (data: Uint8ClampedArray, width: number, height: number, options?: { inversionAttempts: string }) => { data: string } | null;

const LADO_CANVAS = 480;
const REPETICAO_MS = 1500;

export function useLeitorQr({ ativo, onTexto }: UseLeitorQrOptions): UseLeitorQr {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [estado, setEstado] = useState<LeitorQrEstado>("ocioso");

  const onTextoRef = useRef(onTexto);
  const ativoRef = useRef(ativo);
  const streamRef = useRef<MediaStream | null>(null);
  const frameRef = useRef<number | null>(null);
  // Cada parada invalida as aberturas de câmera que ainda estavam em andamento.
  const sessaoRef = useRef(0);
  const abrindoRef = useRef(false);

  useEffect(() => {
    onTextoRef.current = onTexto;
    ativoRef.current = ativo;
  });

  const parar = useCallback(() => {
    sessaoRef.current += 1;
    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  const iniciar = useCallback(async () => {
    if (!ativoRef.current || streamRef.current || abrindoRef.current) {
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      setEstado("indisponivel");
      return;
    }

    const sessao = sessaoRef.current;
    abrindoRef.current = true;
    setEstado("abrindo");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });
      const video = videoRef.current;
      if (sessao !== sessaoRef.current || !video) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }
      streamRef.current = stream;
      video.srcObject = stream;
      await video.play();
      if (sessao !== sessaoRef.current) {
        return;
      }
      setEstado("lendo");
      varrer(video, sessao);
    } catch (error) {
      if (sessao === sessaoRef.current) {
        parar();
        setEstado(error instanceof DOMException && error.name === "NotAllowedError" ? "negada" : "ocioso");
      }
    } finally {
      abrindoRef.current = false;
    }

    function varrer(video: HTMLVideoElement, atual: number) {
      const Detector = (window as unknown as { BarcodeDetector?: DetectorConstructor }).BarcodeDetector;
      const detector = Detector ? new Detector({ formats: ["qr_code"] }) : null;
      let jsqr: JsQr | null = null;
      let canvas: HTMLCanvasElement | null = null;
      let ocupado = false;
      let ultimo = { texto: "", em: 0 };

      async function ler(): Promise<string | null> {
        if (detector) {
          const codigos = await detector.detect(video);
          return codigos[0]?.rawValue ?? null;
        }
        jsqr ??= (await import("jsqr")).default as unknown as JsQr;
        canvas ??= document.createElement("canvas");
        const contexto = canvas.getContext("2d", { willReadFrequently: true });
        if (!contexto || !video.videoWidth) {
          return null;
        }
        const lado = Math.min(video.videoWidth, video.videoHeight);
        canvas.width = LADO_CANVAS;
        canvas.height = LADO_CANVAS;
        contexto.drawImage(
          video,
          (video.videoWidth - lado) / 2,
          (video.videoHeight - lado) / 2,
          lado,
          lado,
          0,
          0,
          LADO_CANVAS,
          LADO_CANVAS,
        );
        const imagem = contexto.getImageData(0, 0, LADO_CANVAS, LADO_CANVAS);
        return jsqr(imagem.data, LADO_CANVAS, LADO_CANVAS, { inversionAttempts: "dontInvert" })?.data ?? null;
      }

      function passo() {
        if (atual !== sessaoRef.current) {
          return;
        }
        if (!ocupado && video.readyState >= 2) {
          ocupado = true;
          ler()
            .then((texto) => {
              const agora = Date.now();
              const repetido = texto === ultimo.texto && agora - ultimo.em < REPETICAO_MS;
              if (texto && atual === sessaoRef.current && !repetido) {
                ultimo = { texto, em: agora };
                onTextoRef.current(texto);
              }
            })
            .catch(() => {})
            .finally(() => {
              ocupado = false;
            });
        }
        frameRef.current = requestAnimationFrame(passo);
      }
      frameRef.current = requestAnimationFrame(passo);
    }
  }, [parar]);

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
    iniciar: () => void iniciar(),
  };
}
