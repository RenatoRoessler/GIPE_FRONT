"use client";

import { useStore } from "@tanstack/react-form";
import { useEffect, useRef, useState } from "react";
import { withForm } from "@/components/form";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { formatCPF } from "@/lib/cpf";
import { IconButton } from "../Mensalistas.styles";
import { RemoveIcon } from "../RemoveIcon";
import { EMPTY_MENSALISTA_VALUES, mesclarCondutores, novoCondutor } from "./mensalistaForm";
import {
  CondutoresActions,
  CondutoresBlock,
  CondutorRow,
  CopyBox,
  Hint,
  InlineError,
  RowAction,
  SectionTitle,
} from "./Veiculos.styles";

export const CondutoresList = withForm({
  defaultValues: EMPTY_MENSALISTA_VALUES,
  props: {} as { index: number; disabled?: boolean },
  render: function Render({ form, index, disabled = false }) {
    const veiculos = useStore(form.store, (state) => state.values.veiculos);
    const condutores = veiculos[index]?.condutores ?? [];
    const outrosComCondutores = veiculos.filter(
      (veiculo, i) => i !== index && veiculo.condutores.some((condutor) => condutor.nome.trim() || condutor.cpf.trim()),
    );
    const linhas = useRef(new Map<string, HTMLDivElement>());
    const [focoUid, setFocoUid] = useState<string | null>(null);

    // Condutor recém-adicionado: foco no primeiro campo dele.
    useEffect(() => {
      if (!focoUid) {
        return;
      }
      linhas.current.get(focoUid)?.querySelector("input")?.focus();
      setFocoUid(null);
    }, [focoUid]);

    function adicionar() {
      const novo = novoCondutor();
      form.pushFieldValue(`veiculos[${index}].condutores`, novo);
      setFocoUid(novo.uid);
    }

    function copiarDe(uidOrigem: string) {
      const origem = veiculos.find((veiculo) => veiculo.uid === uidOrigem);
      if (!origem) {
        return;
      }
      form.setFieldValue(`veiculos[${index}].condutores`, mesclarCondutores(condutores, origem.condutores));
    }

    return (
      <CondutoresBlock>
        <SectionTitle>Condutores autorizados</SectionTitle>
        {condutores.length === 0 && <InlineError role="alert">Informe pelo menos um condutor.</InlineError>}
        {condutores.map((condutor, j) => (
          <CondutorRow
            key={condutor.uid}
            role="group"
            aria-label={`Condutor ${j + 1}`}
            ref={(element) => {
              if (element) {
                linhas.current.set(condutor.uid, element);
              } else {
                linhas.current.delete(condutor.uid);
              }
            }}
          >
            <form.AppField name={`veiculos[${index}].condutores[${j}].nome`}>
              {(field) => (
                <field.TextField label="Nome do condutor" maxLength={100} autoComplete="off" disabled={disabled} />
              )}
            </form.AppField>
            <form.AppField name={`veiculos[${index}].condutores[${j}].cpf`}>
              {(field) => (
                <field.TextField
                  label="CPF do condutor"
                  format={formatCPF}
                  inputMode="numeric"
                  autoComplete="off"
                  disabled={disabled}
                />
              )}
            </form.AppField>
            <RowAction>
              <IconButton
                type="button"
                aria-label={`Remover condutor ${j + 1}`}
                title={condutores.length === 1 ? "Pelo menos um condutor por veículo" : "Remover condutor"}
                disabled={disabled || condutores.length === 1}
                onClick={() => form.removeFieldValue(`veiculos[${index}].condutores`, j)}
              >
                <RemoveIcon />
              </IconButton>
            </RowAction>
          </CondutorRow>
        ))}
        {condutores.length === 1 && <Hint>Pelo menos um condutor por veículo.</Hint>}
        <CondutoresActions>
          <Button type="button" variant="secondary" size="sm" onClick={adicionar} disabled={disabled}>
            Adicionar condutor
          </Button>
          {outrosComCondutores.length > 0 && (
            <CopyBox>
              <Select
                label="Copiar condutores de…"
                value=""
                disabled={disabled}
                onChange={(event) => copiarDe(event.target.value)}
              >
                <option value="">Selecione um veículo</option>
                {outrosComCondutores.map((veiculo) => (
                  <option key={veiculo.uid} value={veiculo.uid}>
                    {veiculo.placa || "Veículo sem placa"}
                  </option>
                ))}
              </Select>
            </CopyBox>
          )}
        </CondutoresActions>
      </CondutoresBlock>
    );
  },
});

