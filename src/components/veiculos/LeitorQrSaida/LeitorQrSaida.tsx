"use client";

import { useEffect, useId, useRef, useState } from "react";
import { extrairTokenComprovante } from "@/lib/qr";
import {
  Check,
  Lido,
  LimparButton,
  Mensagem,
  Mira,
  TokenField,
  TokenLabel,
  TokenRow,
  Varredura,
  Video,
  Visor,
  VisuallyHidden,
  Wrapper,
  type VisorTom,
} from "./LeitorQrSaida.styles";
import { useLeitorQr, type LeitorQrEstado } from "./useLeitorQr";

export const QR_INVALIDO_MESSAGE = "QR Code não é um ticket GIPE";
const INVALIDO_MS = 1200;

const MENSAGENS: Record<LeitorQrEstado, string> = {
  ocioso: "Toque para ativar a câmera",
  abrindo: "Abrindo câmera…",
  lendo: "",
  negada: "Permita o acesso à câmera e toque aqui",
  indisponivel: "Câmera indisponível neste navegador",
};

export interface LeitorQrSaidaProps {
  // Token já extraído de um QR de ticket GIPE.
  onToken: (token: string) => void;
  // QR lido que não é de um ticket GIPE; a leitura continua.
  onInvalido: () => void;
  // Trava o botão de limpar (ex.: consulta ou envio em andamento).
  disabled?: boolean;
  // Leitura concluída: a câmera é desligada e o visor mostra o resultado.
  lido: boolean;
  mensagemLido?: string;
  token: string;
  onLimpar: () => void;
}

export function LeitorQrSaida({
  onToken,
  onInvalido,
  disabled = false,
  lido,
  mensagemLido = "Ticket encontrado",
  token,
  onLimpar,
}: LeitorQrSaidaProps) {
  const tokenId = useId();
  const visorRef = useRef<HTMLButtonElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [invalido, setInvalido] = useState(false);

  const { videoRef, estado, iniciar } = useLeitorQr({
    ativo: !lido,
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

  const tom: VisorTom = lido ? "lido" : invalido ? "invalido" : "neutro";
  const mensagem = MENSAGENS[estado];
  const anuncio = lido ? mensagemLido : invalido ? QR_INVALIDO_MESSAGE : mensagem;

  function handleLimpar() {
    onLimpar();
    visorRef.current?.focus();
  }

  return (
    <Wrapper>
      <Visor
        ref={visorRef}
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
        {estado === "lendo" && !lido && <Varredura aria-hidden="true" />}
        {!lido && mensagem && <Mensagem aria-hidden="true">{mensagem}</Mensagem>}
        {lido && (
          <Lido aria-hidden="true">
            <Check>
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6L9 17l-5-5" />
              </svg>
            </Check>
            {mensagemLido}
          </Lido>
        )}
      </Visor>
      <VisuallyHidden role="status" aria-live="polite">
        {anuncio}
      </VisuallyHidden>

      <TokenRow>
        <TokenLabel htmlFor={tokenId}>Token</TokenLabel>
        <TokenField id={tokenId} readOnly tabIndex={-1} value={token} placeholder="aguardando leitura" />
        {lido && (
          <LimparButton type="button" onClick={handleLimpar} disabled={disabled} aria-label="Limpar e ler novamente">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </LimparButton>
        )}
      </TokenRow>
    </Wrapper>
  );
}
