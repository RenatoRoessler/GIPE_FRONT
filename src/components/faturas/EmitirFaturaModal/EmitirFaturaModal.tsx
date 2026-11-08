"use client";

import { useStore } from "@tanstack/react-form";
import { useEffect, useId, useMemo, useState } from "react";
import { nomeExibido } from "@/components/conveniadas/format";
import { useConveniadas } from "@/components/conveniadas/useConveniadas";
import { useAppForm, zodFieldErrors } from "@/components/form";
import { Button } from "@/components/ui/Button";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { InfoCard } from "@/components/ui/InfoCard";
import { Modal } from "@/components/ui/Modal";
import { OptionGroup } from "@/components/ui/OptionGroup";
import { useIsMobile } from "@/hooks/useMediaQuery";
import { formatDataInput } from "@/lib/periodo";
import { createEmitirFaturaSchema, OBSERVACAO_FATURA_MAX } from "@/lib/schemas/fatura";
import type { EmitirFaturaValues, FaturaDetalhe } from "@/types/fatura";
import { Form } from "../Faturas.styles";
import { useFaturaMutations } from "../useFaturaMutations";
import { useRolarAteAviso } from "../useRolarAteAviso";
import { ATALHOS_VENCIMENTO_DIAS, atalhoSelecionado, vencimentoEm } from "../vencimento";

// Prazo sugerido para o vencimento; o usuário pode mudar.
const PRAZO_PADRAO_DIAS = 30;

export interface EmitirFaturaModalProps {
  onClose: () => void;
  onEmitida: (detalhe: FaturaDetalhe) => void;
}

function vencimentoSugerido(hoje: Date): string {
  const data = new Date(hoje);
  data.setDate(data.getDate() + PRAZO_PADRAO_DIAS);
  return formatDataInput(data);
}

export function EmitirFaturaModal({ onClose, onEmitida }: EmitirFaturaModalProps) {
  const formId = useId();
  const [{ hoje, vencimentoInicial }] = useState(() => {
    const agora = new Date();
    return { hoje: formatDataInput(agora), vencimentoInicial: vencimentoSugerido(agora) };
  });
  const conveniadas = useConveniadas("todos");
  const celular = useIsMobile();
  const { emitir } = useFaturaMutations();
  // O erro fica no topo do corpo rolável do modal: ao aparecer, vem para a vista.
  const erroRef = useRolarAteAviso(emitir.isError);
  const schema = createEmitirFaturaSchema({ hoje });

  const initialValues: EmitirFaturaValues = { empresaConveniadaId: "", vencimento: vencimentoInicial, observacao: "" };

  const form = useAppForm({
    defaultValues: initialValues,
    validators: {
      onChange: ({ value }) => {
        const result = schema.safeParse(value);
        return result.success ? undefined : zodFieldErrors(result);
      },
    },
    onSubmit: ({ value }) => {
      emitir.mutate(value, { onSuccess: (detalhe) => onEmitida(detalhe) });
    },
  });

  const values = useStore(form.store, (state) => state.values);
  const isSending = emitir.isPending;
  const excedeObservacao = values.observacao.trim().length > OBSERVACAO_FATURA_MAX;
  const lista = useMemo(() => conveniadas.data ?? [], [conveniadas.data]);

  // Com uma única conveniada não há o que escolher.
  useEffect(() => {
    if (lista.length === 1 && form.getFieldValue("empresaConveniadaId") === "") {
      form.setFieldValue("empresaConveniadaId", String(lista[0].empresaConveniadaId));
    }
  }, [lista, form]);

  return (
    <Modal
      open
      size="sm"
      title="Emitir fatura"
      onClose={isSending ? () => undefined : onClose}
      closeOnBackdrop={false}
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose} disabled={isSending}>
            Cancelar
          </Button>
          <Button type="submit" form={formId} disabled={isSending || excedeObservacao}>
            {isSending ? "Emitindo…" : "Emitir fatura"}
          </Button>
        </>
      }
    >
      {emitir.isError && (
        <div ref={erroRef}>
          <ErrorBanner role="alert">{emitir.error.message}</ErrorBanner>
        </div>
      )}
      {conveniadas.isError && <ErrorBanner role="alert">Não foi possível carregar as conveniadas. {conveniadas.error.message}</ErrorBanner>}
      <Form
        id={formId}
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          void form.handleSubmit();
        }}
      >
        <form.AppField name="empresaConveniadaId" listeners={{ onChange: () => emitir.reset() }}>
          {(field) => (
            <field.SelectField label="Conveniada" disabled={isSending || conveniadas.isPending}>
              <option value="">{conveniadas.isPending ? "Carregando…" : "Selecione"}</option>
              {lista.map((conveniada) => (
                <option key={conveniada.empresaConveniadaId} value={conveniada.empresaConveniadaId}>
                  {nomeExibido(conveniada)}
                  {conveniada.ativo ? "" : " (encerrado)"}
                </option>
              ))}
            </field.SelectField>
          )}
        </form.AppField>
        <form.AppField name="vencimento" listeners={{ onChange: () => emitir.reset() }}>
          {(field) => <field.TextField label="Vencimento" type="date" min={hoje} disabled={isSending} />}
        </form.AppField>
        {celular && (
          // Atalhos só preenchem o campo acima; a marcação vem do valor dele, então digitar outra data a desmarca.
          <OptionGroup
            legend="Prazo"
            columns={ATALHOS_VENCIMENTO_DIAS.length}
            options={ATALHOS_VENCIMENTO_DIAS.map((dias) => ({ value: String(dias), label: `${dias} dias` }))}
            value={atalhoSelecionado(values.vencimento, hoje)}
            disabled={isSending}
            onChange={(dias) => {
              form.setFieldValue("vencimento", vencimentoEm(hoje, Number(dias)));
              emitir.reset();
            }}
          />
        )}
        <form.AppField name="observacao" listeners={{ onChange: () => emitir.reset() }}>
          {(field) => <field.TextareaField label="Observação (opcional)" limite={OBSERVACAO_FATURA_MAX} disabled={isSending} />}
        </form.AppField>
        <InfoCard title="Todas as saídas em aberto">
          A fatura reúne todas as saídas em aberto desta conveniada. Não dá para escolher só algumas.
        </InfoCard>
      </Form>
    </Modal>
  );
}
