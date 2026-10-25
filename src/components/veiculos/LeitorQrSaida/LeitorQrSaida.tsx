"use client";

import { useEffect, useRef, useState } from "react";
import { extrairTokenComprovante } from "@/lib/qr";
import {
  Mensagem,
  Mira,
  Varredura,
  Video,
  Visor,
  VisuallyHidden,
  Wrapper,
  type VisorTom,
} from "./LeitorQrSaida.styles";
import { useLeitorQr, type LeitorQrEstado } from "./useLeitorQr";

export const QR_INVALIDO_MESSAGE = "QR Code não é um ticket Murel";
export const BUSCANDO_MESSAGE = "Buscando veículo…";
const INVALIDO_MS = 1200;

const MENSAGENS: Record<LeitorQrEstado, string> = {
  ocioso: "Toque para ativar a câmera",
  abrindo: "Abrindo câmera…",
  lendo: "",
  negada: "Permita o acesso à câmera e toque aqui",
  indisponivel: "Câmera indisponível neste navegador",
};

export interface LeitorQrSaidaProps {
  // Token já extraído de um QR de ticket Murel.
  onToken: (token: string) => void;
  // QR lido que não é de um ticket Murel; a leitura continua.
  onInvalido: () => void;
  // Busca em andamento: a câmera pausa, o visor mostra a mira de sucesso e o estado é anunciado.
  buscando?: boolean;
}

export function LeitorQrSaida({ onToken, onInvalido, buscando = false }: LeitorQrSaidaProps) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [invalido, setInvalido] = useState(false);

  const { videoRef, estado, iniciar } = useLeitorQr({
    ativo: !buscando,
    onTexto: (texto) => {
      const tokenLido = extrairTokenComprovante(texto);
      if (tokenLido) {
        if (navigator.vibrate) {
          navigator.vibrate(80);
        }
        onToken(tokenLido);
        return;
      }
      setInvalido(true);
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      timerRef.current = setTimeout(() => setInvalido(false), INVALIDO_MS);
      onInvalido();
    },
  });

  useEffect(
    () => () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    },
    [],
  );

  const tom: VisorTom = buscando ? "buscando" : invalido ? "invalido" : "neutro";
  const mensagem = buscando ? "" : MENSAGENS[estado];
  const anuncio = buscando ? BUSCANDO_MESSAGE : invalido ? QR_INVALIDO_MESSAGE : mensagem;

  return (
    <Wrapper>
      <Visor
        type="button"
        $tom={tom}
        onClick={iniciar}
        aria-label="Área de leitura do QR Code. Toque para ativar a câmera"
      >
        <Video ref={videoRef} playsInline muted />
        <Mira $canto="tl" $tom={tom} aria-hidden="true" />
        <Mira $canto="tr" $tom={tom} aria-hidden="true" />
        <Mira $canto="bl" $tom={tom} aria-hidden="true" />
        <Mira $canto="br" $tom={tom} aria-hidden="true" />
        {estado === "lendo" && !buscando && <Varredura aria-hidden="true" />}
        {mensagem && <Mensagem aria-hidden="true">{mensagem}</Mensagem>}
      </Visor>
      <VisuallyHidden role="status" aria-live="polite">
        {anuncio}
      </VisuallyHidden>
    </Wrapper>
  );
}
