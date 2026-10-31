"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { PlateDisplay } from "@/components/ui/PlateDisplay";
import { isValidPlaca, normalizePlaca } from "@/lib/placa";
import { Mira, Video, VisuallyHidden } from "../LeitorQrSaida/LeitorQrSaida.styles";
import { Acoes, Conferencia, Content, Mensagem, Moldura, PlacaLida, Visor } from "./LeitorPlacaModal.styles";
import { useLeitorPlaca, type LeitorPlacaEstado } from "./useLeitorPlaca";
import { TECLADO_PLACA } from "@/lib/teclado/tipos";

export interface LeitorPlacaModalProps {
  open: boolean;
  onClose: () => void;
  // Placa confirmada pelo operador, já normalizada e válida.
  onConfirm: (placa: string) => void;
  // "Digitar": fecha e deixa o operador informar a placa à mão (por padrão, só fecha).
  onDigitar?: () => void;
}

const MENSAGENS: Record<Exclude<LeitorPlacaEstado, "indisponivel">, string> = {
  ocioso: "Preparando leitura…",
  abrindo: "Preparando leitura…",
  lendo: "Aponte a câmera para a placa",
  negada: "Permita o acesso à câmera nas configurações do navegador e tente novamente.",
  "sem-leitura": "Não consegui ler a placa. Tente de novo ou digite.",
};

const MSG_INDISPONIVEL = "A câmera não está disponível neste aparelho ou navegador.";
const MSG_INSEGURO = "A câmera só funciona em conexão segura (HTTPS).";

// Estado novo a cada abertura: o conteúdo só existe enquanto o modal está aberto.
export function LeitorPlacaModal({ open, ...props }: LeitorPlacaModalProps) {
  if (!open) {
    return null;
  }
  return <LeitorPlacaAberto {...props} />;
}

function LeitorPlacaAberto({ onClose, onConfirm, onDigitar = onClose }: Omit<LeitorPlacaModalProps, "open">) {
  const [etapa, setEtapa] = useState<"leitura" | "conferencia">("leitura");
  const [placa, setPlaca] = useState("");

  const { videoRef, estado, contextoSeguro, iniciar } = useLeitorPlaca({
    ativo: etapa === "leitura",
    onPlaca: (lida) => {
      setPlaca(lida);
      setEtapa("conferencia");
    },
  });

  const placaValida = isValidPlaca(placa);

  function handleConfirmar(event: FormEvent) {
    event.preventDefault();
    if (placaValida) {
      onConfirm(normalizePlaca(placa));
    }
  }

  if (etapa === "conferencia") {
    return (
      <Modal
        open
        title="Confirmar placa"
        onClose={onClose}
        closeOnBackdrop={false}
        footer={
          <Acoes>
            <Button type="button" variant="secondary" onClick={() => setEtapa("leitura")}>
              Ler de novo
            </Button>
            <Button type="submit" form="confirmar-placa" disabled={!placaValida}>
              Usar placa
            </Button>
          </Acoes>
        }
      >
        <Conferencia id="confirmar-placa" onSubmit={handleConfirmar}>
          <PlacaLida>
            <PlateDisplay value={placa} />
          </PlacaLida>
          <Input
            label="Placa lida"
            hint="Confira se a placa está correta e corrija se precisar."
            value={placa}
            onChange={(event) => setPlaca(normalizePlaca(event.target.value))}
            maxLength={7}
            autoFocus
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            teclado={TECLADO_PLACA}
          />
        </Conferencia>
      </Modal>
    );
  }

  const falhou = estado === "sem-leitura" || estado === "negada" || estado === "indisponivel";
  const mensagem = estado === "indisponivel" ? (contextoSeguro ? MSG_INDISPONIVEL : MSG_INSEGURO) : MENSAGENS[estado];
  // Sem câmera, tentar de novo não adianta; nos demais erros sim.
  const podeTentarDeNovo = estado === "sem-leitura" || estado === "negada";

  return (
    <Modal
      open
      title="Ler placa"
      onClose={onClose}
      closeOnBackdrop={false}
      footer={
        <Acoes>
          {falhou ? (
            <>
              {podeTentarDeNovo && (
                <Button type="button" onClick={iniciar}>
                  Tentar de novo
                </Button>
              )}
              <Button type="button" variant="secondary" onClick={onDigitar}>
                Digitar
              </Button>
            </>
          ) : (
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancelar
            </Button>
          )}
        </Acoes>
      }
    >
      <Content>
        <Visor>
          <Video ref={videoRef} playsInline muted />
          <Moldura aria-hidden="true">
            <Mira $canto="tl" $tom={falhou ? "invalido" : "neutro"} />
            <Mira $canto="tr" $tom={falhou ? "invalido" : "neutro"} />
            <Mira $canto="bl" $tom={falhou ? "invalido" : "neutro"} />
            <Mira $canto="br" $tom={falhou ? "invalido" : "neutro"} />
          </Moldura>
        </Visor>
        <Mensagem aria-hidden="true">{mensagem}</Mensagem>
        <VisuallyHidden role="status" aria-live="polite">
          {mensagem}
        </VisuallyHidden>
      </Content>
    </Modal>
  );
}
