"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useId } from "react";
import { Button } from "@/components/ui/Button";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Table, TableBody, TableCell, TableHead, TableRow } from "@/components/ui/Table";
import { fecharCaixa } from "@/lib/api/services/caixa";
import { formatBRL } from "@/lib/money";
import { toConferencias } from "@/lib/schemas/caixa";
import type { Turno } from "@/types/caixa";
import type { CaixaModalProps } from "./AbrirCaixaModal";
import { FieldStack } from "./Caixa.styles";
import { ConferenciaFields } from "./ConferenciaFields";
import { Diferenca } from "./Diferenca";
import { formaPagamentoLabel } from "./format";
import { useConferencia } from "./useConferencia";
import { CAIXA_KEY } from "./useCaixa";

// Duas fases: conferência e, depois de fechar, o resumo do turno encerrado.
export function FecharCaixaModal({ turno, onClose, onSuccess }: CaixaModalProps & { turno: Turno }) {
  const formId = useId();
  const queryClient = useQueryClient();
  const { values, errors, setConferencia, setField, validate } = useConferencia(turno.formasPagamento);

  const mutation = useMutation({
    mutationFn: (input: { conferencias: ReturnType<typeof toConferencias>; observacao?: string }) =>
      fecharCaixa(input.conferencias, input.observacao),
  });

  const resumo = mutation.data;

  // Só atualiza a tela (que passa a "Caixa fechado") quando o resumo é dispensado.
  async function handleConcluir() {
    await queryClient.invalidateQueries({ queryKey: CAIXA_KEY });
    onSuccess("Caixa fechado.");
    onClose();
  }

  function handleSubmit() {
    const valid = validate();
    if (!valid) {
      return;
    }
    mutation.mutate({
      conferencias: toConferencias(turno.formasPagamento, valid.conferencias),
      observacao: valid.observacao || undefined,
    });
  }

  if (resumo) {
    return (
      <Modal
        open
        title="Caixa fechado"
        size="lg"
        onClose={() => void handleConcluir()}
        footer={<Button type="button" onClick={() => void handleConcluir()}>Concluir</Button>}
      >
        <Table>
          <TableHead>
            <TableRow>
              <TableCell head>Forma de pagamento</TableCell>
              <TableCell head align="right">
                Esperado
              </TableCell>
              <TableCell head align="right">
                Informado
              </TableCell>
              <TableCell head align="right">
                Diferença
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {resumo.formasPagamento.map((forma) => (
              <TableRow key={forma.formaPagamento}>
                <TableCell data-label="Forma de pagamento">{formaPagamentoLabel(forma.formaPagamento)}</TableCell>
                <TableCell align="right" numeric data-label="Esperado">
                  {formatBRL(forma.valorEsperado)}
                </TableCell>
                <TableCell align="right" numeric data-label="Informado">
                  {forma.valorInformado === null ? "—" : formatBRL(forma.valorInformado)}
                </TableCell>
                <TableCell align="right" numeric data-label="Diferença">
                  <Diferenca value={forma.diferenca} />
                </TableCell>
              </TableRow>
            ))}
            <TableRow>
              <TableCell data-label="Total">
                <strong>Total</strong>
              </TableCell>
              <TableCell align="right" numeric data-label="Esperado">
                <strong>{formatBRL(resumo.totalEsperado)}</strong>
              </TableCell>
              <TableCell align="right" numeric data-label="Informado">
                <strong>{resumo.totalInformado === null ? "—" : formatBRL(resumo.totalInformado)}</strong>
              </TableCell>
              <TableCell align="right" numeric data-label="Diferença">
                <Diferenca value={resumo.totalDiferenca} />
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </Modal>
    );
  }

  return (
    <Modal
      open
      title="Fechar caixa"
      onClose={onClose}
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose} disabled={mutation.isPending}>
            Cancelar
          </Button>
          <Button type="submit" form={formId} variant="danger" disabled={mutation.isPending}>
            {mutation.isPending ? "Fechando..." : "Fechar caixa"}
          </Button>
        </>
      }
    >
      {mutation.isError && <ErrorBanner role="alert">{mutation.error.message}</ErrorBanner>}
      <form
        id={formId}
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          handleSubmit();
        }}
      >
        <FieldStack>
          <ConferenciaFields
            formas={turno.formasPagamento}
            values={values.conferencias}
            errors={errors.conferencias}
            onChange={setConferencia}
            disabled={mutation.isPending}
          />
          <Input
            label="Observação (opcional)"
            maxLength={200}
            value={values.observacao}
            onChange={(event) => setField("observacao", event.target.value)}
            disabled={mutation.isPending}
          />
        </FieldStack>
      </form>
    </Modal>
  );
}
