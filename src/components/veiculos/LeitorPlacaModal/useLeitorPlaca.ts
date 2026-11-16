"use client";

import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import { confirmarLeitura, leituraDuvidosa } from "@/lib/feedbackLeitura";
import { criarConsenso, extrairPlaca } from "@/lib/ocrPlaca";
import { consultarPermissaoCamera } from "@/lib/permissaoCamera";
import { criarReconhecedorPlaca, type ReconhecedorPlaca } from "@/lib/reconhecedorPlaca";

// "pre-leitura": a imagem da câmera já aparece, mas o leitor de placas ainda está carregando (o operador já pode enquadrar).
export type LeitorPlacaEstado =
  | "ocioso"
  | "abrindo"
  | "pedindo"
  | "pre-leitura"
  | "lendo"
  | "negada"
  | "indisponivel"
  | "sem-leitura";

export interface LeituraDePlaca {
  duvida: number | null;
}

export interface UseLeitorPlacaOptions {
  // Câmera ligada enquanto true; ao virar false (ou desmontar) tudo é liberado.
  ativo: boolean;
  // Placa válida, lida de forma consistente em quadros seguidos. `duvida` é a posição do caractere que variou entre os
  // quadros (null quando as leituras sempre concordaram).
  onPlaca: (placa: string, leitura?: LeituraDePlaca) => void;
  // Tempo sem placa válida até desistir. No modo contínuo, conta a partir da última placa lida.
  tempoLimiteMs?: number;
  // Segue lendo depois de cada placa (a câmera só para ao desistir, ao desativar ou ao desmontar), para conferir vários carros em sequência.
  continuo?: boolean;
  // Intervalo mínimo entre leituras, para não saturar a CPU.
  intervaloMs?: number;
}

export interface UseLeitorPlaca {
  videoRef: RefObject<HTMLVideoElement | null>;
  estado: LeitorPlacaEstado;
  // false quando a câmera não pode abrir por falta de HTTPS (o navegador remove a API).
  contextoSeguro: boolean;
  // Abre a câmera (ou tenta de novo); com "pedindo" o navegador está perguntando se pode usá-la.
  iniciar: () => void;
}

// Leitor que terminou de carregar depois de a abertura ser cancelada (ou de a câmera falhar): ninguém vai usá-lo.
function descartarReconhecedor(pendente: Promise<ReconhecedorPlaca | null> | null) {
  void pendente?.then((reconhecedor) => reconhecedor?.encerrar());
}

const TEMPO_LIMITE_MS = 15000;
const INTERVALO_MS = 400;

export function useLeitorPlaca({
  ativo,
  onPlaca,
  tempoLimiteMs = TEMPO_LIMITE_MS,
  intervaloMs = INTERVALO_MS,
  continuo = false,
}: UseLeitorPlacaOptions): UseLeitorPlaca {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [estado, setEstado] = useState<LeitorPlacaEstado>("ocioso");
  const [contextoSeguro, setContextoSeguro] = useState(true);

  const onPlacaRef = useRef(onPlaca);
  const ativoRef = useRef(ativo);
  const continuoRef = useRef(continuo);
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
    continuoRef.current = continuo;
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
    // O leitor (OCR) carrega em paralelo com a câmera e sem segurá-la: a imagem aparece assim que o aparelho a libera.
    let reconhecedorPendente: Promise<ReconhecedorPlaca | null> | null = null;
    try {
      const permissao = await consultarPermissaoCamera();
      if (sessao !== sessaoRef.current) {
        return;
      }
      // Com "denied" ainda se tenta abrir: a consulta pode estar desatualizada (ex.: app instalado) e, se estiver
      // mesmo bloqueada, o navegador recusa na hora, sem mostrar nada, e cai em "negada".
      // Quando o navegador vai perguntar, a tela explica para que serve a câmera enquanto o pedido está aberto.
      if (permissao === "prompt" || permissao === "desconhecida") {
        setEstado("pedindo");
      }
      // O OCR é baixado só na primeira vez.
      reconhecedorPendente = criarReconhecedorPlaca().catch(() => null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });
      const video = videoRef.current;
      if (sessao !== sessaoRef.current || !video) {
        stream.getTracks().forEach((track) => track.stop());
        descartarReconhecedor(reconhecedorPendente);
        return;
      }
      streamRef.current = stream;
      video.srcObject = stream;
      await video.play();
      if (sessao !== sessaoRef.current) {
        descartarReconhecedor(reconhecedorPendente);
        return;
      }
      // Imagem na tela: o leitor ainda pode estar carregando.
      setEstado("pre-leitura");
      const reconhecedor = await reconhecedorPendente;
      if (sessao !== sessaoRef.current) {
        void reconhecedor?.encerrar();
        return;
      }
      if (!reconhecedor) {
        parar();
        setEstado("indisponivel");
        return;
      }
      reconhecedorRef.current = reconhecedor;
      setEstado("lendo");
      varrer(video, reconhecedor, sessao);
    } catch (error) {
      descartarReconhecedor(reconhecedorPendente);
      if (sessao === sessaoRef.current) {
        parar();
        // Câmera ocupada, sem câmera ou outra falha: não há o que o operador possa liberar no navegador.
        setEstado(error instanceof DOMException && error.name === "NotAllowedError" ? "negada" : "indisponivel");
      }
    } finally {
      abrindoRef.current = false;
    }

    function varrer(video: HTMLVideoElement, reconhecedor: ReconhecedorPlaca, atual: number) {
      let consenso = criarConsenso();

      function armarLimite() {
        if (limiteRef.current) {
          clearTimeout(limiteRef.current);
        }
        limiteRef.current = setTimeout(() => {
          if (atual !== sessaoRef.current) {
            return;
          }
          parar();
          setEstado("sem-leitura");
        }, tempoLimiteMs);
      }

      armarLimite();

      async function passo() {
        if (atual !== sessaoRef.current) {
          return;
        }
        const inicio = Date.now();
        try {
          if (video.readyState >= 2) {
            const texto = await reconhecedor.reconhecer(video);
            if (atual !== sessaoRef.current) {
              return;
            }
            const placa = consenso.registrar(extrairPlaca(texto));
            if (placa) {
              // Uma vibração (e um bip) para leitura certa; duas vibrações, sem som, quando um caractere variou entre os quadros.
              const duvida = consenso.duvida();
              if (duvida === null) {
                confirmarLeitura();
              } else {
                leituraDuvidosa();
              }
              if (!continuoRef.current) {
                parar();
                onPlacaRef.current(placa, { duvida });
                return;
              }
              // Contínuo: a câmera segue ligada, a próxima placa começa um consenso novo e o limite recomeça.
              consenso = criarConsenso();
              armarLimite();
              onPlacaRef.current(placa, { duvida });
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
