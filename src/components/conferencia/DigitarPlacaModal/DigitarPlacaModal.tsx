"use client";

import { useId, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { PlateDisplay } from "@/components/ui/PlateDisplay";
import { normalizePlaca } from "@/lib/placa";
import { placaDigitadaSchema } from "@/lib/schemas/conferenciaPatio";
import { TECLADO_PLACA } from "@/lib/teclado/tipos";
import { Form, Placa } from "./DigitarPlacaModal.styles";

export interface DigitarPlacaModalProps {
  // Confere a placa (já normalizada e válida); a folha fecha quando o resultado volta.
  onConferir: (placa: string) => Promise<unknown>;
  onClose: () => void;
}

const MENSAGEM_ERRO = "Não foi possível conferir a placa. Tente de novo.";

// Estado novo a cada abertura: o conteúdo só existe enquanto a folha está aberta.
export function DigitarPlacaModal({ onConferir, onClose }: DigitarPlacaModalProps) {
  const formId = useId();
  const [placa, setPlaca] = useState("");
  const [erro, setErro] = useState<string | undefined>();
  const [enviando, setEnviando] = useState(false);

  async function enviar(event: FormEvent) {
    event.preventDefault();
    if (enviando) {
      return;
    }
    const resultado = placaDigitadaSchema.safeParse({ placa });
    if (!resultado.success) {
      setErro(resultado.error.issues[0]?.message);
      return;
    }
    setErro(undefined);
    setEnviando(true);
    try {
      await onConferir(normalizePlaca(resultado.data.placa));
      onClose();
    } catch (error) {
      setErro(error instanceof Error && error.message ? error.message : MENSAGEM_ERRO);
      setEnviando(false);
    }
  }

  return (
    <Modal
      open
      title="Digitar placa"
      onClose={enviando ? () => undefined : onClose}
      closeOnBackdrop={false}
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose} disabled={enviando}>
            Cancelar
          </Button>
          <Button type="submit" form={formId} disabled={enviando}>
            {enviando ? "Conferindo…" : "Conferir"}
          </Button>
        </>
      }
    >
      <Form id={formId} noValidate onSubmit={(event) => void enviar(event)}>
        <Placa>
          <PlateDisplay value={placa} />
        </Placa>
        {erro && !placa && <ErrorBanner role="alert">{erro}</ErrorBanner>}
        <Input
          label="Placa"
          value={placa}
          onChange={(event) => {
            setPlaca(normalizePlaca(event.target.value));
            setErro(undefined);
          }}
          error={erro && placa ? erro : undefined}
          maxLength={7}
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          teclado={TECLADO_PLACA}
          disabled={enviando}
          data-autofocus=""
        />
      </Form>
    </Modal>
  );
}
