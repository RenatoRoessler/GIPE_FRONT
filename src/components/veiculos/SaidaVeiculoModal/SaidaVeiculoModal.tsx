"use client";

import { useEffect, useRef, useState } from "react";
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
import { Column, FaseConteudo, FaseTitulo, Layout } from "./SaidaVeiculoModal.styles";
import { useSaidaFlow, type SaidaFase } from "./useSaidaFlow";

export interface SaidaVeiculoModalProps {
  onClose: () => void;
  onSuccess: (message: string) => void;
}

const TITULOS: Record<SaidaFase, string> = {
  pesquisa: "Localizar veículo",
  pagamento: "Confirmar saída",
  recibo: "Saída registrada",
};

// Lido pelo leitor de tela quando o foco chega ao título da fase.
const ANUNCIOS: Record<SaidaFase, string> = {
  pesquisa: "Pesquisa de veículo.",
  pagamento: "Veículo encontrado. Confirme os dados e o pagamento.",
  recibo: "",
};

export function SaidaVeiculoModal({ onClose, onSuccess }: SaidaVeiculoModalProps) {
  const flow = useSaidaFlow();
  const [confirmingClose, setConfirmingClose] = useState(false);
  const tituloRef = useRef<HTMLHeadingElement>(null);
  const faseAnterior = useRef(flow.fase);

  const { consulta, fase, pagamento, valorAnterior } = flow;
  const podeConfirmar = consulta !== null && pagamento?.canConfirm === true && !flow.enviando;

  // Na troca de fase o foco vai ao título da nova fase; na abertura vale o foco padrão do diálogo.
  useEffect(() => {
    if (faseAnterior.current !== fase) {
      faseAnterior.current = fase;
      tituloRef.current?.focus();
    }
  }, [fase]);

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

  if (fase === "recibo" && flow.consultaRecibo && flow.resultado) {
    return (
      <Modal open title={TITULOS.recibo} size="lg" closeOnBackdrop={false} onClose={handleConcluir}>
        <ReciboSaidaStep consulta={flow.consultaRecibo} resultado={flow.resultado} onConcluir={handleConcluir} />
      </Modal>
    );
  }

  const rotulo = flow.enviando
    ? "Registrando…"
    : consulta
      ? `${valorAnterior !== null ? "Confirmar novo valor" : "Confirmar Saída"} · ${formatBRL(consulta.valor)}`
      : "Confirmar Saída";

  const footer =
    fase === "pagamento" ? (
      <>
        <Button type="button" variant="secondary" onClick={flow.voltar} disabled={flow.enviando}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Voltar para a pesquisa
        </Button>
        <Button type="button" onClick={flow.confirmar} disabled={!podeConfirmar}>
          {rotulo}
        </Button>
      </>
    ) : (
      <Button type="button" variant="secondary" onClick={handleClose} disabled={flow.isBusy}>
        Cancelar
      </Button>
    );

  return (
    <Modal open title={TITULOS[fase]} size="lg" closeOnBackdrop={false} onClose={handleClose} footer={footer}>
      <FaseConteudo key={fase}>
        <FaseTitulo ref={tituloRef} tabIndex={-1}>
          {ANUNCIOS[fase]}
        </FaseTitulo>
        {fase === "pesquisa" ? (
          <Layout>
            <Column>
              <LeitorQrSaida
                buscando={flow.buscando}
                onToken={flow.handleToken}
                onInvalido={flow.handleQrInvalido}
              />
            </Column>
            <Column>
              <BuscaManualSaida
                values={flow.buscaValues}
                errors={flow.buscaErrors}
                onChange={flow.handleBuscaChange}
                onEnter={flow.handleBuscaEnter}
                aviso={flow.aviso}
              />
            </Column>
          </Layout>
        ) : (
          <Layout>
            <Column>
              <ResumoSaida consulta={consulta} valorAnterior={valorAnterior} />
              {flow.aviso && <ErrorBanner role="status">{flow.aviso}</ErrorBanner>}
            </Column>
            <Column>
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
        )}
      </FaseConteudo>
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
