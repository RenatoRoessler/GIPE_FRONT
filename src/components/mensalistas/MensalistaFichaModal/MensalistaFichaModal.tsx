"use client";

import { formatDate } from "@/components/caixa/format";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { PlateDisplay } from "@/components/ui/PlateDisplay";
import { Skeleton } from "@/components/ui/Skeleton";
import { StageTrack } from "@/components/ui/StageTrack";
import type { ToastVariant } from "@/components/ui/Toast";
import { TIPO_PESSOA, type Mensalista, type SituacaoMensalista } from "@/types/mensalista";
import { formatCategoria, formatDocumentoMensalista, formatValor, maskCpfParcial } from "../format";
import { apresentarSituacao } from "../SituacaoMensalista";
import { derivarSituacao, precisaDoContrato } from "../situacao";
import { useContratoMensalista } from "../useContratosMensalistas";
import { useReenviarContrato } from "../useReenviarContrato";
import {
  CondutorList,
  EmptyText,
  NextStep,
  Section,
  SectionTitle,
  Summary,
  VeiculoInfo,
  VeiculoItem,
  VeiculoList,
} from "./MensalistaFichaModal.styles";

export interface MensalistaFichaModalProps {
  mensalista: Mensalista;
  onClose: () => void;
  // Troca a ficha pelo formulário de edição.
  onEditar: (mensalista: Mensalista) => void;
  onToast: (message: string, variant?: ToastVariant) => void;
}

// O que o operador deve entender sobre o contrato e o que falta para o mensalista ficar ativo.
function fraseProximoPasso(situacao: SituacaoMensalista): string {
  switch (situacao.kind) {
    case "ativo":
      return "Mensalista ativo.";
    case "aguardando-aceite":
      return situacao.expiraEm
        ? `Aguardando o aceite do mensalista. O link vence em ${formatDate(situacao.expiraEm)}.`
        : "Aguardando o aceite do mensalista.";
    case "link-vencido":
      return "O link do contrato venceu. Reenvie para o mensalista aceitar.";
    case "aguardando-pagamento":
      return `${situacao.aceitoEm ? `Contrato aceito em ${formatDate(situacao.aceitoEm)}. ` : "Contrato aceito. "}O mensalista fica ativo após o primeiro pagamento.`;
    case "sem-contrato":
      return "Este mensalista ainda não tem contrato. Envie para ele aceitar.";
    case "inativo":
      return "Mensalista inativo.";
    case "desconhecida":
      return "Não foi possível consultar o contrato agora.";
    case "carregando":
      return "";
  }
}

export function MensalistaFichaModal({ mensalista, onClose, onEditar, onToast }: MensalistaFichaModalProps) {
  const dependeDoContrato = precisaDoContrato(mensalista);
  const contrato = useContratoMensalista(mensalista.mensalistaId, dependeDoContrato);
  const situacao = derivarSituacao(mensalista, dependeDoContrato ? contrato : undefined, new Date());
  const apresentacao = apresentarSituacao(situacao);

  const { reenviar, reenviandoId } = useReenviarContrato({
    onSuccess: ({ email }) =>
      onToast(`Novo link enviado para ${email}. Vale por 7 dias; o link anterior deixa de funcionar.`),
    onError: (message) => onToast(message, "error"),
  });
  const reenviando = reenviandoId === mensalista.mensalistaId;

  const documentoLabel = mensalista.tipoPessoa === TIPO_PESSOA.Juridica ? "CNPJ" : "CPF";
  const resumo = [
    `${documentoLabel} ${formatDocumentoMensalista(mensalista)}`,
    mensalista.tipoMensal,
    formatCategoria(mensalista.categoria),
    formatValor(mensalista.valorMensalidade),
  ].join(" · ");
  const juridica = mensalista.tipoPessoa === TIPO_PESSOA.Juridica;

  return (
    <Modal
      open
      title={mensalista.nome}
      onClose={onClose}
      size="lg"
      footer={
        <>
          {apresentacao?.action && (
            <Button
              type="button"
              variant="secondary"
              disabled={reenviando}
              onClick={() => reenviar(mensalista.mensalistaId)}
            >
              {reenviando ? "Reenviando…" : apresentacao.action === "Reenviar" ? "Reenviar contrato" : "Enviar contrato"}
            </Button>
          )}
          <Button type="button" onClick={() => onEditar(mensalista)}>
            Editar
          </Button>
        </>
      }
    >
      <Summary>{resumo}</Summary>

      <Section aria-label="Contrato">
        <SectionTitle>Contrato</SectionTitle>
        {apresentacao ? (
          <>
            {apresentacao.stages && (
              <StageTrack
                stages={apresentacao.stages}
                size="md"
                tone={apresentacao.trackTone}
                label={`Situação de ${mensalista.nome}`}
              />
            )}
            <NextStep>{fraseProximoPasso(situacao)}</NextStep>
          </>
        ) : (
          <div role="status" aria-label="Carregando contrato">
            <Skeleton height="40px" />
          </div>
        )}
      </Section>

      <Section aria-label="Veículos">
        <SectionTitle>{`Veículos (${mensalista.veiculos.length})`}</SectionTitle>
        {mensalista.veiculos.length === 0 ? (
          <EmptyText>Nenhum veículo cadastrado.</EmptyText>
        ) : (
          <VeiculoList>
            {mensalista.veiculos.map((veiculo) => (
              <VeiculoItem key={veiculo.placa}>
                <PlateDisplay value={veiculo.placa} size="sm" />
                <VeiculoInfo>
                  <span>{[veiculo.modelo, veiculo.cor, formatCategoria(veiculo.categoria)].filter(Boolean).join(" · ")}</span>
                  {juridica && veiculo.condutores.length > 0 && (
                    <CondutorList aria-label={`Condutores de ${veiculo.placa}`}>
                      {veiculo.condutores.map((condutor) => (
                        <li key={condutor.cpf}>{`${condutor.nome} (${maskCpfParcial(condutor.cpf)})`}</li>
                      ))}
                    </CondutorList>
                  )}
                </VeiculoInfo>
              </VeiculoItem>
            ))}
          </VeiculoList>
        )}
      </Section>
    </Modal>
  );
}
