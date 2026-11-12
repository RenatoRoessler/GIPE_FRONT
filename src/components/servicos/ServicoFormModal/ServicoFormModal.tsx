"use client";

import { useId } from "react";
import { useAppForm, zodFieldErrors } from "@/components/form";
import { Button } from "@/components/ui/Button";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { Modal } from "@/components/ui/Modal";
import { servicoSchema, toServicoPayload } from "@/lib/schemas/servico";
import { TECLADO_DECIMAL, TECLADO_INTEIRO } from "@/lib/teclado/tipos";
import { CATEGORIA_ROTULO, CATEGORIAS_SERVICO, type Servico } from "@/types/servico";
import { useServicoMutations } from "../useServicos";
import { Apoio, Categorias, Formulario, Grupo, Legenda, Par, SubTitulo } from "./ServicoFormModal.styles";
import { valoresIniciais } from "./valores";

export interface ServicoFormModalProps {
  // Sem serviço, cadastra; com serviço, edita.
  servico?: Servico;
  onClose: () => void;
  // Recebe o aviso de sucesso e o serviço gravado (pode vir sem corpo na resposta).
  onSaved: (message: string, servico: Servico | null) => void;
}

export const AVISOS = { criado: "Serviço criado.", atualizado: "Serviço atualizado." } as const;

// Cadastro e edição de serviço. `Modal` ocupa a tela toda no celular. O erro do back (nome repetido entre os ativos,
// preço duplicado) aparece no topo, com a mensagem dele, e o que foi digitado é mantido.
export function ServicoFormModal({ servico, onClose, onSaved }: ServicoFormModalProps) {
  const formId = useId();
  const { criar, atualizar } = useServicoMutations();
  const mutacao = servico ? atualizar : criar;
  const salvando = mutacao.isPending;

  const form = useAppForm({
    defaultValues: valoresIniciais(servico),
    validators: {
      onChange: ({ value }) => {
        const resultado = servicoSchema.safeParse(value);
        return resultado.success ? undefined : zodFieldErrors(resultado);
      },
    },
    onSubmit: async ({ value }) => {
      const payload = toServicoPayload(value);
      try {
        const gravado = servico ? await atualizar.mutateAsync({ id: servico.id, payload }) : await criar.mutateAsync(payload);
        onSaved(servico ? AVISOS.atualizado : AVISOS.criado, gravado);
      } catch {
        // O erro fica em `mutacao.error`, mostrado no banner.
      }
    },
  });

  return (
    <Modal
      open
      size="md"
      title={servico ? "Editar serviço" : "Novo serviço"}
      onClose={onClose}
      closeOnBackdrop={false}
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose} disabled={salvando}>
            Cancelar
          </Button>
          <Button type="submit" form={formId} disabled={salvando}>
            {salvando ? "Salvando..." : "Salvar"}
          </Button>
        </>
      }
    >
      {mutacao.isError && <ErrorBanner role="alert">{mutacao.error.message}</ErrorBanner>}
      <Formulario
        id={formId}
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          void form.handleSubmit();
        }}
      >
        <form.AppField name="nome">{(field) => <field.TextField label="Nome" autoFocus autoComplete="off" disabled={salvando} />}</form.AppField>
        <form.AppField name="descricao">{(field) => <field.TextareaField label="Descrição (opcional)" disabled={salvando} />}</form.AppField>

        <Par>
          <form.AppField name="duracaoMinutos">
            {(field) => (
              <field.TextField
                label="Duração estimada (min)"
                inputMode="numeric"
                teclado={TECLADO_INTEIRO}
                hint="Só uma previsão de quanto o serviço leva."
                disabled={salvando}
              />
            )}
          </form.AppField>
          <form.AppField name="tempoPermitidoMinutos">
            {(field) => (
              <field.TextField
                label="Tempo permitido (min)"
                inputMode="numeric"
                teclado={TECLADO_INTEIRO}
                hint="Quanto o veículo fica no pátio sem pagar a permanência. Vazio ou 0: cobra normalmente."
                disabled={salvando}
              />
            )}
          </form.AppField>
        </Par>

        <Grupo>
          <Legenda>Preços</Legenda>
          <Apoio>Informe ao menos um. O preço de “Todas as categorias” vale para as que não têm preço próprio.</Apoio>
          <form.AppField name="precoTodas">
            {(field) => <field.TextField label="Todas as categorias" inputMode="decimal" teclado={TECLADO_DECIMAL} placeholder="0,00" disabled={salvando} />}
          </form.AppField>
          <SubTitulo>Preços específicos por categoria</SubTitulo>
          <Categorias>
            {CATEGORIAS_SERVICO.map((categoria) => (
              <form.AppField key={categoria} name={`precos.${categoria}`}>
                {(field) => (
                  <field.TextField label={CATEGORIA_ROTULO[categoria]} inputMode="decimal" teclado={TECLADO_DECIMAL} placeholder="0,00" disabled={salvando} />
                )}
              </form.AppField>
            ))}
          </Categorias>
        </Grupo>

        {servico && <Apoio>Editar não altera os serviços que já foram acrescentados a veículos: eles guardam o preço e o tempo de quando foram acrescentados.</Apoio>}
      </Formulario>
    </Modal>
  );
}
