"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { DESCRICAO_SAIDA_MAX } from "@/lib/schemas/conferenciaPatio";
import { MOTIVO_SAIDA, type ItemConferencia } from "@/types/conferenciaPatio";
import { useSaidaConferencia } from "../useSaidaConferencia";
import { Contador, Corpo } from "./DarSaidaConferenciaModal.styles";

export interface DarSaidaConferenciaModalProps {
  conferenciaId: number;
  item: ItemConferencia;
  onClose: () => void;
  onConcluida: (mensagem: string) => void;
}

export const MENSAGEM_SAIDA_REGISTRADA = "Saída registrada.";

const MOTIVOS = [
  { valor: MOTIVO_SAIDA.SaiuSemBaixa, rotulo: "Saiu sem baixa" },
  { valor: MOTIVO_SAIDA.TicketDuplicado, rotulo: "Ticket duplicado" },
  { valor: MOTIVO_SAIDA.EntradaPorEngano, rotulo: "Entrada registrada por engano" },
  { valor: MOTIVO_SAIDA.Outro, rotulo: "Outro" },
] as const;

export function DarSaidaConferenciaModal({ conferenciaId, item, onClose, onConcluida }: DarSaidaConferenciaModalProps) {
  const [tocouMotivo, setTocouMotivo] = useState(false);
  const [tocouDescricao, setTocouDescricao] = useState(false);
  const saida = useSaidaConferencia({
    conferenciaId,
    item,
    onConcluida: () => {
      onConcluida(MENSAGEM_SAIDA_REGISTRADA);
      onClose();
    },
  });
  const outro = saida.motivo === String(MOTIVO_SAIDA.Outro);

  return (
    <Modal
      open
      title="Dar saída"
      size="md"
      closeOnBackdrop={false}
      onClose={saida.enviando ? () => undefined : onClose}
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose} disabled={saida.enviando}>
            Cancelar
          </Button>
          <Button type="button" onClick={saida.confirmar} disabled={!saida.podeConfirmar}>
            {saida.enviando ? "Registrando…" : "Confirmar saída"}
          </Button>
        </>
      }
    >
      <Corpo>
        <Select
          label="Motivo"
          value={saida.motivo}
          onChange={(event) => saida.setMotivo(event.target.value)}
          onBlur={() => setTocouMotivo(true)}
          error={tocouMotivo ? saida.erros.motivo : undefined}
          disabled={saida.enviando}
          data-autofocus=""
        >
          <option value="">Selecione o motivo</option>
          {MOTIVOS.map((motivo) => (
            <option key={motivo.valor} value={String(motivo.valor)}>
              {motivo.rotulo}
            </option>
          ))}
        </Select>

        {outro && (
          <div>
            <Input
              label="Descrição"
              value={saida.descricao}
              onChange={(event) => saida.setDescricao(event.target.value)}
              onBlur={() => setTocouDescricao(true)}
              error={tocouDescricao ? saida.erros.descricao : undefined}
              maxLength={DESCRICAO_SAIDA_MAX + 1}
              autoComplete="off"
              disabled={saida.enviando}
            />
            <Contador $acima={saida.descricao.length > DESCRICAO_SAIDA_MAX} aria-live="polite">
              {saida.descricao.length}/{DESCRICAO_SAIDA_MAX}
            </Contador>
          </div>
        )}

        {saida.erroRegistro && <ErrorBanner role="alert">{saida.erroRegistro}</ErrorBanner>}
      </Corpo>
    </Modal>
  );
}
