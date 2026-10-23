"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useId, useState } from "react";
import { Button } from "@/components/ui/Button";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { useCurrentUser } from "@/contexts/CurrentUserContext";
import { listTurnos, passarTurno } from "@/lib/api/services/caixa";
import { parseMoney } from "@/lib/money";
import { toConferencias } from "@/lib/schemas/caixa";
import { FORMA_PAGAMENTO } from "@/types/caixa";
import type { Turno } from "@/types/caixa";
import type { CaixaModalProps } from "./AbrirCaixaModal";
import { FieldStack } from "./Caixa.styles";
import { ConferenciaFields } from "./ConferenciaFields";
import { ResumoFechamento } from "./ResumoFechamento";
import { useConferencia } from "./useConferencia";
import { CAIXA_KEY } from "./useCaixa";
import { formatMoeda } from "./format";

export function PassarTurnoModal({ turno, onClose, onSuccess }: CaixaModalProps & { turno: Turno }) {
  const formId = useId();
  const queryClient = useQueryClient();
  const { user } = useCurrentUser();
  const { values, errors, setConferencia, setField, validate } = useConferencia(turno.formasPagamento);

  // Turno que acabou de ser encerrado, como a API o devolve na lista (com informado e diferença por forma).
  const [encerrado, setEncerrado] = useState<Turno | null>(null);

  const mutation = useMutation({
    mutationFn: passarTurno,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: CAIXA_KEY });
      onSuccess("Turno passado.");
      // A passagem não devolve o resumo: busca o turno encerrado na lista. Se não achar, fecha como antes.
      try {
        const turnos = await listTurnos();
        const fechado = turnos.find((item) => item.turnoId === turno.turnoId && item.dataHoraFim !== null);
        if (fechado) {
          setEncerrado(fechado);
          return;
        }
      } catch {
        // O resumo é um complemento: a passagem já foi feita.
      }
      onClose();
    },
  });

  // Sem fundo informado, a API assume o fundo do turno que sai mais o dinheiro conferido (sem o fundo).
  const indiceDinheiro = turno.formasPagamento.findIndex((forma) => forma.formaPagamento === FORMA_PAGAMENTO.Dinheiro);
  const dinheiroConferido = indiceDinheiro < 0 ? Number.NaN : parseMoney(values.conferencias[indiceDinheiro] ?? "");
  const fundoAssumido = turno.valorFundoCaixa + (Number.isNaN(dinheiroConferido) ? 0 : dinheiroConferido);

  function handleSubmit() {
    const valid = validate();
    if (!valid) {
      return;
    }
    mutation.mutate({
      conferencias: toConferencias(turno.formasPagamento, valid.conferencias),
      valorFundoCaixa: valid.fundoCaixa === "" ? null : parseMoney(valid.fundoCaixa),
      observacao: valid.observacao || undefined,
    });
  }

  if (encerrado) {
    return <ResumoFechamento tipo="passagem" turno={encerrado} novoResponsavel={user?.name ?? null} onConcluir={onClose} />;
  }

  return (
    <Modal
      open
      title="Passar turno"
      onClose={onClose}
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose} disabled={mutation.isPending}>
            Cancelar
          </Button>
          <Button type="submit" form={formId} disabled={mutation.isPending}>
            {mutation.isPending ? "Passando..." : "Assumir turno"}
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
            label="Fundo de caixa do novo turno (opcional)"
            inputMode="decimal"
            placeholder="0,00"
            hint={`Dinheiro que fica na gaveta. Se vazio, fica o fundo do turno atual mais o dinheiro conferido: ${formatMoeda(fundoAssumido)}.`}
            value={values.fundoCaixa}
            onChange={(event) => setField("fundoCaixa", event.target.value)}
            error={errors.fundoCaixa}
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
