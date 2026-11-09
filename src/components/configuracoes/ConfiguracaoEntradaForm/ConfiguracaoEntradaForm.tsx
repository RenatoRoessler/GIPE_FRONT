"use client";

import { useStore } from "@tanstack/react-form";
import { useState } from "react";
import { formatDateTime } from "@/components/caixa/format";
import { useAppForm } from "@/components/form";
import { Button } from "@/components/ui/Button";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Text } from "@/components/ui/Text";
import { Toast } from "@/components/ui/Toast";
import { useToast } from "@/hooks/useToast";
import type { Configuracao, ConfiguracaoValues } from "@/types/configuracao";
import { useSalvarConfiguracao } from "../useConfiguracao";
import { Auditoria, Cartao, Efeito, Fieldset, Legenda, Linha, Linhas, Rodape } from "./ConfiguracaoEntradaForm.styles";

const OPCOES: { campo: keyof ConfiguracaoValues; rotulo: string; efeito: string }[] = [
  { campo: "modelo", rotulo: "Modelo obrigatório", efeito: "Pede o modelo do carro (ex.: Corolla)." },
  { campo: "cor", rotulo: "Cor obrigatória", efeito: "Pede a cor do carro." },
  { campo: "prisma", rotulo: "Prisma obrigatório", efeito: "Pede o número do prisma (de 1 a 999). Mensalista pode entrar sem ele." },
];

export interface ConfiguracaoEntradaFormProps {
  initial: Configuracao;
  // Sem permissão de edição a tela só mostra os valores.
  podeEditar: boolean;
}

export function ConfiguracaoEntradaForm({ initial, podeEditar }: ConfiguracaoEntradaFormProps) {
  const { toast, showToast, dismissToast } = useToast();
  const salvar = useSalvarConfiguracao();
  const [gravada, setGravada] = useState<ConfiguracaoValues>({ modelo: initial.modelo, cor: initial.cor, prisma: initial.prisma });

  const form = useAppForm({
    defaultValues: gravada,
    onSubmit: async ({ value }) => {
      await salvar.mutateAsync(value).then(
        () => {
          setGravada(value);
          form.reset(value);
          showToast("Configuração salva.");
        },
        () => {
          // O erro fica em `salvar.error`, mostrado no banner; o que foi marcado é mantido.
        },
      );
    },
  });

  const valores = useStore(form.store, (state) => state.values);
  const alterado = OPCOES.some(({ campo }) => valores[campo] !== gravada[campo]);
  const salvando = salvar.isPending;

  return (
    <Cartao
      aria-label="Entrada de veículos"
      onSubmit={(event) => {
        event.preventDefault();
        event.stopPropagation();
        if (podeEditar) {
          void form.handleSubmit();
        }
      }}
    >
      <Fieldset>
        <Legenda>
          Dados obrigatórios na entrada
          {!podeEditar && <StatusBadge>Somente leitura</StatusBadge>}
        </Legenda>
        <Text variant="muted">O operador só registra a entrada depois de preencher o que estiver ligado.</Text>
        <Linhas>
          {OPCOES.map(({ campo, rotulo, efeito }) => (
            <Linha key={campo} $checked={valores[campo]}>
              <form.AppField name={campo}>
                {(field) => <field.SwitchField label={rotulo} disabled={!podeEditar || salvando} aria-describedby={`configuracao-${campo}`} />}
              </form.AppField>
              <Efeito id={`configuracao-${campo}`}>{efeito}</Efeito>
            </Linha>
          ))}
        </Linhas>
      </Fieldset>

      {salvar.isError && <ErrorBanner role="alert">{salvar.error.message}</ErrorBanner>}

      {podeEditar && (
        <Rodape>
          <Button type="submit" disabled={!alterado || salvando}>
            {salvando ? "Salvando…" : "Salvar"}
          </Button>
          {alterado && !salvando && <Text variant="muted">Alterações não salvas</Text>}
        </Rodape>
      )}

      {initial.alteradoEm && <Auditoria>{`Última alteração em ${formatDateTime(initial.alteradoEm)}.`}</Auditoria>}

      {toast && <Toast message={toast.message} variant={toast.variant} onDismiss={dismissToast} />}
    </Cartao>
  );
}
