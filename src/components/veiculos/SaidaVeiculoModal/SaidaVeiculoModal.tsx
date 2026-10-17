"use client";

import { useEffect, useId, useState } from "react";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { Modal } from "@/components/ui/Modal";
import { formatBRL } from "@/lib/money";
import { BuscaManualSaida } from "../BuscaManualSaida";
import { LeitorQrSaida } from "../LeitorQrSaida";
import { PagamentoSaida } from "../PagamentoSaida";
import { ReciboSaidaStep } from "../ReciboSaidaStep";
import { ResumoSaida } from "../ResumoSaida";
import { Column, Layout } from "./SaidaVeiculoModal.styles";
import { useSaidaFlow } from "./useSaidaFlow";

export interface SaidaVeiculoModalProps {
  onClose: () => void;
  onSuccess: (message: string) => void;
}

export function SaidaVeiculoModal({ onClose, onSuccess }: SaidaVeiculoModalProps) {
  const flow = useSaidaFlow();
  const confirmarId = useId();
  const [confirmingClose, setConfirmingClose] = useState(false);

  const { consulta, lido, pagamento, valorAnterior } = flow;
  const podeConfirmar = consulta !== null && pagamento?.canConfirm === true && !flow.enviando;

  // Depois da leitura o próximo passo é confirmar: leva o foco ao botão quando já dá para usá-lo.
  const veiculoLido = lido && consulta !== null;
  useEffect(() => {
    if (veiculoLido) {
      document.getElementById(confirmarId)?.focus();
    }
  }, [veiculoLido, confirmarId]);

  function handleClose() {
    if (flow.isBusy) {
      return;
    }
    if (flow.hasProgress) {
      setConfirmingClose(true);
      return;
    }
    onClose();
  }

  // O aviso aparece ao concluir: com o modal aberto ele ficaria atrás do fundo do diálogo.
  function handleConcluir() {
    onSuccess("Saída realizada com sucesso.");
    onClose();
  }

  if (flow.fase === "recibo" && flow.consultaRecibo && flow.resultado) {
    return (
      <Modal open title="Saída registrada" size="lg" closeOnBackdrop={false} onClose={handleConcluir}>
        <ReciboSaidaStep consulta={flow.consultaRecibo} resultado={flow.resultado} onConcluir={handleConcluir} />
      </Modal>
    );
  }

  const rotulo = flow.enviando
    ? "Registrando…"
    : consulta
      ? `${valorAnterior !== null ? "Confirmar novo valor" : "Confirmar Saída"} · ${formatBRL(consulta.valor)}`
      : "Confirmar Saída";

  const footer = (
    <>
      <Button type="button" variant="secondary" onClick={handleClose} disabled={flow.isBusy}>
        Cancelar
      </Button>
      <Button id={confirmarId} type="button" onClick={flow.confirmar} disabled={!podeConfirmar}>
        {rotulo}
      </Button>
    </>
  );

  return (
    <Modal open title="Registrar saída" size="lg" closeOnBackdrop={false} onClose={handleClose} footer={footer}>
      <Layout>
        <Column>
          <LeitorQrSaida
            lido={lido}
            token={flow.token}
            mensagemLido={flow.mensagemLido}
            onToken={flow.handleToken}
            onInvalido={flow.handleQrInvalido}
            onLimpar={flow.limpar}
            disabled={flow.enviando}
          />
          <BuscaManualSaida
            values={flow.buscaValues}
            errors={flow.buscaErrors}
            onChange={flow.handleBuscaChange}
            onEnter={flow.handleBuscaEnter}
            aviso={flow.aviso}
            bloqueadoPorQr={lido}
            disabled={flow.enviando}
          />
        </Column>
        <Column>
          <ResumoSaida consulta={consulta} carregando={flow.buscando} valorAnterior={valorAnterior} />
          {flow.erroRegistro && <ErrorBanner role="alert">{flow.erroRegistro}</ErrorBanner>}
          <PagamentoSaida
            consulta={consulta}
            forma={flow.forma}
            recebido={flow.recebido}
            onFormaChange={flow.setForma}
            onRecebidoChange={flow.setRecebido}
            onEnter={flow.confirmar}
            disabled={flow.enviando}
          />
        </Column>
      </Layout>
      {confirmingClose && (
        <ConfirmDialog
          title="Cancelar a saída?"
          message="A saída em andamento será descartada e nada será registrado."
          confirmLabel="Descartar"
          cancelLabel="Continuar saída"
          onConfirm={onClose}
          onCancel={() => setConfirmingClose(false)}
        />
      )}
    </Modal>
  );
}
