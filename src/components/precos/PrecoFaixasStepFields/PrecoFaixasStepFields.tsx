"use client";

import { useEffect, useRef, useState } from "react";
import { withForm } from "@/components/form";
import { Button } from "@/components/ui/Button";
import { Text } from "@/components/ui/Text";
import { parseMoney } from "@/lib/money";
import { EMPTY_PRECO_FAIXA, type PrecoFaixasValues } from "@/types/preco";
import { FaixasPreview, type FaixasPreviewDiaria } from "../FaixasPreview";
import { formatMinutos } from "../format";
import {
  EmptyHint,
  LiveRegion,
  Row,
  RowList,
  Toolbar,
  Wrapper,
} from "../shared/RepeatableRows.styles";
import { Layout, RowFields, RowFooter } from "./PrecoFaixasStepFields.styles";

const DEFAULT_VALUES: PrecoFaixasValues = { faixas: [] };

interface FaixasAnnouncerProps {
  count: number;
}

// Anuncia adições/remoções e leva o foco ao primeiro campo da linha criada.
function FaixasAnnouncer({ count }: FaixasAnnouncerProps) {
  const previousCountRef = useRef(count);
  const [announcement, setAnnouncement] = useState("");

  useEffect(() => {
    const previous = previousCountRef.current;
    previousCountRef.current = count;
    if (count === previous) {
      return;
    }
    if (count === previous + 1) {
      document.querySelector<HTMLElement>(`[data-faixa-row="${count - 1}"] input`)?.focus();
      setAnnouncement(`Faixa ${count} adicionada.`);
    } else {
      setAnnouncement("Faixa removida.");
    }
  }, [count]);

  return (
    <LiveRegion role="status" aria-live="polite">
      {announcement}
    </LiveRegion>
  );
}

export const PrecoFaixasStepFields = withForm({
  defaultValues: DEFAULT_VALUES,
  props: {} as { disabled?: boolean; showPercentual?: boolean; diaria?: FaixasPreviewDiaria },
  render: function Render({ form, disabled, showPercentual = false, diaria }) {
    // Mantém as faixas em ordem crescente de minutos quando o foco sai da linha (não reordena durante a digitação).
    function sortFaixas() {
      const faixas = form.state.values.faixas;
      const allValid = faixas.every((faixa) => /^\d+$/.test(faixa.minutosLimite));
      if (!allValid) {
        return;
      }
      const sorted = [...faixas].sort((a, b) => Number(a.minutosLimite) - Number(b.minutosLimite));
      if (sorted.some((faixa, index) => faixa !== faixas[index])) {
        form.setFieldValue("faixas", sorted);
      }
    }

    return (
      <Layout>
        <Wrapper>
          <Toolbar>
            <Text variant="muted">Defina o valor cobrado até cada limite de tempo.</Text>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => form.pushFieldValue("faixas", { ...EMPTY_PRECO_FAIXA })}
              disabled={disabled}
            >
              Adicionar faixa
            </Button>
          </Toolbar>

          <form.Subscribe selector={(state) => state.values.faixas.length}>
            {(count) => (
              <>
                <FaixasAnnouncer count={count} />
                {count === 0 ? (
                  <EmptyHint>
                    <Text variant="muted">Nenhuma faixa cadastrada.</Text>
                  </EmptyHint>
                ) : (
                  <RowList>
                    {Array.from({ length: count }, (_, index) => (
                      <Row
                        key={index}
                        role="group"
                        aria-label={`Faixa ${index + 1}`}
                        data-faixa-row={index}
                        onBlur={(event) => {
                          if (!event.currentTarget.contains(event.relatedTarget)) {
                            sortFaixas();
                          }
                        }}
                      >
                        <RowFields $withPercent={showPercentual}>
                          <form.AppField name={`faixas[${index}].minutosLimite`}>
                            {(field) => (
                              <form.Subscribe selector={(state) => state.values.faixas[index]?.minutosLimite}>
                                {(minutos) => (
                                  <field.TextField
                                    label={`Até (minutos) — faixa ${index + 1}`}
                                    inputMode="numeric"
                                    hint={minutos ? `= ${formatMinutos(Number(minutos))}` : undefined}
                                    format={(value) => value.replace(/\D/g, "")}
                                    disabled={disabled}
                                  />
                                )}
                              </form.Subscribe>
                            )}
                          </form.AppField>
                          <form.AppField name={`faixas[${index}].valor`}>
                            {(field) => (
                              <field.TextField
                                label={`Valor (R$) — faixa ${index + 1}`}
                                inputMode="decimal"
                                format={(value) => value.replace(/[^\d.,]/g, "")}
                                disabled={disabled}
                              />
                            )}
                          </form.AppField>
                          {showPercentual && (
                            <form.AppField name={`faixas[${index}].percentualConveniada`}>
                              {(field) => (
                                <field.TextField
                                  label={`% conveniada (opcional) — faixa ${index + 1}`}
                                  inputMode="decimal"
                                  format={(value) => value.replace(/[^\d.,]/g, "")}
                                  disabled={disabled}
                                />
                              )}
                            </form.AppField>
                          )}
                        </RowFields>
                        <RowFooter>
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={() => form.removeFieldValue("faixas", index)}
                            disabled={disabled}
                            aria-label={`Remover faixa ${index + 1}`}
                          >
                            Remover
                          </Button>
                        </RowFooter>
                      </Row>
                    ))}
                  </RowList>
                )}
              </>
            )}
          </form.Subscribe>
        </Wrapper>

        <form.Subscribe selector={(state) => state.values.faixas}>
          {(faixas) => (
            <FaixasPreview
              diaria={diaria}
              faixas={faixas
                .map((faixa) => ({
                  minutosLimite: Number(faixa.minutosLimite),
                  valor: parseMoney(faixa.valor),
                }))
                .filter((faixa) => faixa.minutosLimite > 0 && Number.isFinite(faixa.valor))}
            />
          )}
        </form.Subscribe>
      </Layout>
    );
  },
});
