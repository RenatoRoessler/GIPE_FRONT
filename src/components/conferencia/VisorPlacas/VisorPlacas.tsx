"use client";

import { useSyncExternalStore } from "react";
import { ExplicacaoCamera, PassosLiberarCamera } from "@/components/camera/PermissaoCamera";
import { Button } from "@/components/ui/Button";
import { PlateDisplay } from "@/components/ui/PlateDisplay";
import { Mira, Video } from "@/components/veiculos/LeitorQrSaida/LeitorQrSaida.styles";
import { useLeitorPlaca, type LeitorPlacaEstado } from "@/components/veiculos/LeitorPlacaModal/useLeitorPlaca";
import { RESULTADO_LEITURA } from "@/types/conferenciaPatio";
import { descricaoLeitura } from "../conferencia";
import type { UltimaLeitura } from "../useConferenciaAcoes";
import { Acoes, Conteudo, Mensagem, Moldura, PlacaLida, Resultado, Visor, VisuallyHidden } from "./VisorPlacas.styles";

// Sem leitura por este tempo, a câmera desliga sozinha (economiza bateria); "Ler placas" a liga de novo.
export const TEMPO_LIMITE_CONFERENCIA_MS = 120_000;

const MENSAGENS: Record<Exclude<LeitorPlacaEstado, "indisponivel">, string> = {
  ocioso: "Preparando a câmera…",
  abrindo: "Preparando a câmera…",
  pedindo: "Aguardando a permissão da câmera…",
  lendo: "Aponte a câmera para a placa",
  negada: "Permita o acesso à câmera nas configurações do navegador, ou digite a placa.",
  "sem-leitura": "A câmera parou por falta de leitura. Toque em Ler placas para continuar.",
};
const MSG_INDISPONIVEL = "A câmera não está disponível neste aparelho ou navegador. Digite a placa.";
const MSG_INSEGURO = "A câmera só funciona em conexão segura (HTTPS). Digite a placa.";

// A câmera só liga com a aba visível: em segundo plano o navegador não entrega imagem e gasta bateria à toa.
function assinarVisibilidade(avisar: () => void) {
  document.addEventListener("visibilitychange", avisar);
  return () => document.removeEventListener("visibilitychange", avisar);
}
const abaVisivel = () => document.visibilityState !== "hidden";

export interface VisorPlacasProps {
  // Liga a câmera enquanto a etapa de conferência está aberta.
  ativo: boolean;
  // Placa vista com consistência pela câmera; quem chama decide o que fazer com ela.
  onPlaca: (placa: string) => void;
  ultimaLeitura: UltimaLeitura | null;
  onRegistrarEntrada: (placa: string) => void;
  onDigitar: () => void;
}

// Placa dita letra a letra, para o leitor de tela não tentar ler "BRA2E19" como uma palavra.
function soletrar(placa: string): string {
  return placa.split("").join(" ");
}

export function VisorPlacas({ ativo, onPlaca, ultimaLeitura, onRegistrarEntrada, onDigitar }: VisorPlacasProps) {
  const visivel = useSyncExternalStore(assinarVisibilidade, abaVisivel, () => true);
  const { videoRef, estado, contextoSeguro, iniciar } = useLeitorPlaca({
    ativo: ativo && visivel,
    onPlaca,
    continuo: true,
    tempoLimiteMs: TEMPO_LIMITE_CONFERENCIA_MS,
  });

  const falhou = estado === "sem-leitura" || estado === "negada" || estado === "indisponivel";
  const podeReligar = estado === "sem-leitura" || estado === "negada";
  const mensagem = estado === "indisponivel" ? (contextoSeguro ? MSG_INDISPONIVEL : MSG_INSEGURO) : MENSAGENS[estado];
  const tomMira = falhou ? "invalido" : "neutro";

  const leitura = ultimaLeitura ? descricaoLeitura(ultimaLeitura.leitura) : null;
  const semEntrada = ultimaLeitura?.leitura.resultado === RESULTADO_LEITURA.SemEntrada;

  return (
    <Visor aria-label="Câmera">
      <Video ref={videoRef} playsInline muted />
      <Moldura aria-hidden="true">
        <Mira $canto="tl" $tom={tomMira} />
        <Mira $canto="tr" $tom={tomMira} />
        <Mira $canto="bl" $tom={tomMira} />
        <Mira $canto="br" $tom={tomMira} />
      </Moldura>

      <Conteudo>
        {ultimaLeitura && leitura && (
          <>
            <PlacaLida>
              <PlateDisplay value={ultimaLeitura.placa} />
            </PlacaLida>
            {semEntrada ? (
              <Button type="button" variant="danger" size="sm" onClick={() => onRegistrarEntrada(ultimaLeitura.placa)}>
                {leitura.texto}
              </Button>
            ) : (
              <Resultado $tom={leitura.tom}>{leitura.texto}</Resultado>
            )}
          </>
        )}

        {estado === "pedindo" && <ExplicacaoCamera motivo="conferir as placas dos veículos" />}
        {estado === "negada" && <PassosLiberarCamera />}
        <Mensagem>{mensagem}</Mensagem>

        {falhou && (
          <Acoes>
            {podeReligar && (
              <Button type="button" size="sm" onClick={iniciar}>
                Ler placas
              </Button>
            )}
            <Button type="button" variant="secondary" size="sm" onClick={onDigitar}>
              Digitar placa
            </Button>
          </Acoes>
        )}
      </Conteudo>

      {/* Anúncio do resultado da última leitura; a placa soletrada vem antes do resultado. */}
      <VisuallyHidden role="status" aria-live="polite">
        {ultimaLeitura && leitura ? `Placa ${soletrar(ultimaLeitura.placa)}. ${leitura.texto}` : ""}
      </VisuallyHidden>
    </Visor>
  );
}
