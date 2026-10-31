"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import { withForm } from "@/components/form";
import { Button } from "@/components/ui/Button";
import { Text } from "@/components/ui/Text";
import { EMPTY_PRECO_FAIXA, type PrecoFaixaValues, type PrecoFaixasValues } from "@/types/preco";
import { parseMoney } from "@/lib/money";
import { avisosFaixas } from "../avisosFaixas";
import { formatBRL } from "../format";
import {
  EmptyHint,
  LiveRegion,
  RowList,
  Toolbar,
  ToolbarActions,
  Wrapper,
} from "../shared/RepeatableRows.styles";
import { RemoveRowButton } from "../shared/RemoveRowButton";
import { DuracaoFaixa } from "./DuracaoFaixa";
import { Aviso, Avisos, FaixaRow, RowFields, RowFooter, Salto, SemAvisos } from "./PrecoFaixasStepFields.styles";
import { TECLADO_DECIMAL } from "@/lib/teclado/tipos";

const DEFAULT_VALUES: PrecoFaixasValues = { faixas: [] };

// Modelos prontos: substituem a lista de faixas inteira.
const MODELOS: { rotulo: string; faixas: PrecoFaixaValues[] }[] = [
  {
    rotulo: "Rotativo (1 h, 2 h, 3 h)",
    faixas: [
      { minutosLimite: "60", valor: "10,00", percentualConveniada: "" },
      { minutosLimite: "120", valor: "16,00", percentualConveniada: "" },
      { minutosLimite: "180", valor: "20,00", percentualConveniada: "" },
    ],
  },
  {
    rotulo: "A cada 30 min até 2 h",
    faixas: [
      { minutosLimite: "30", valor: "6,00", percentualConveniada: "" },
      { minutosLimite: "60", valor: "10,00", percentualConveniada: "" },
      { minutosLimite: "90", valor: "13,00", percentualConveniada: "" },
      { minutosLimite: "120", valor: "16,00", percentualConveniada: "" },
    ],
  },
];

// Diferença para o degrau anterior ("+ R$ 4,00"); vazio na primeira faixa ou com valores incompletos.
function descreverSalto(atual: string, anterior: string | undefined): string {
  if (anterior === undefined) {
    return "";
  }
  const diferenca = parseMoney(atual) - parseMoney(anterior);
  if (!Number.isFinite(diferenca)) {
    return "";
  }
  return `${diferenca < 0 ? "−" : "+"} ${formatBRL(Math.abs(diferenca))}`;
}

interface FaixasAnnouncerProps {
  count: number;
  // Ligado por "Adicionar faixa": só então a linha criada recebe o foco (modelos também mudam a quantidade).
  focarNovaLinhaRef: RefObject<boolean>;
}

// Anuncia adições/remoções e leva o foco ao primeiro campo da linha criada.
function FaixasAnnouncer({ count, focarNovaLinhaRef }: FaixasAnnouncerProps) {
  const previousCountRef = useRef(count);
  const [announcement, setAnnouncement] = useState("");

  useEffect(() => {
    const previous = previousCountRef.current;
    previousCountRef.current = count;
    if (count === previous) {
      return;
    }
    if (count === previous + 1 && focarNovaLinhaRef.current) {
      document.querySelector<HTMLElement>(`[data-faixa-row="${count - 1}"] input`)?.focus();
      setAnnouncement(`Faixa ${count} adicionada.`);
    } else if (count < previous) {
      setAnnouncement("Faixa removida.");
    } else {
      setAnnouncement("Faixas atualizadas.");
    }
    focarNovaLinhaRef.current = false;
  }, [count, focarNovaLinhaRef]);

  return (
    <LiveRegion role="status" aria-live="polite">
      {announcement}
    </LiveRegion>
  );
}

export const PrecoFaixasStepFields = withForm({
  defaultValues: DEFAULT_VALUES,
  props: {} as { disabled?: boolean; showPercentual?: boolean; diariaValor?: number },
  render: function Render({ form, disabled, showPercentual = false, diariaValor = Number.NaN }) {
    const focarNovaLinhaRef = useRef(false);

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
      <Wrapper>
        <Toolbar>
          <Text variant="muted">Modelos prontos ou degraus de tempo e valor, até cada limite.</Text>
          <ToolbarActions>
            {MODELOS.map((modelo) => (
              <Button
                key={modelo.rotulo}
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => form.setFieldValue("faixas", modelo.faixas.map((faixa) => ({ ...faixa })))}
                disabled={disabled}
              >
                {modelo.rotulo}
              </Button>
            ))}
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => {
                focarNovaLinhaRef.current = true;
                form.pushFieldValue("faixas", { ...EMPTY_PRECO_FAIXA });
              }}
              disabled={disabled}
            >
              Adicionar faixa
            </Button>
          </ToolbarActions>
        </Toolbar>

        <form.Subscribe selector={(state) => state.values.faixas.length}>
          {(count) => (
            <>
              <FaixasAnnouncer count={count} focarNovaLinhaRef={focarNovaLinhaRef} />
              {count === 0 ? (
                <EmptyHint>
                  <Text variant="muted">Nenhuma faixa cadastrada.</Text>
                </EmptyHint>
              ) : (
                <RowList>
                  {Array.from({ length: count }, (_, index) => (
                    <FaixaRow
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
                          {(field) => {
                            const error = field.state.meta.isTouched ? field.state.meta.errors[0] : undefined;
                            return (
                              <DuracaoFaixa
                                numero={index + 1}
                                value={field.state.value}
                                onChange={field.handleChange}
                                onBlur={field.handleBlur}
                                error={typeof error === "string" ? error : undefined}
                                disabled={disabled}
                              />
                            );
                          }}
                        </form.AppField>
                        <form.AppField name={`faixas[${index}].valor`}>
                          {(field) => (
                            <field.TextField
                              label={`Valor (R$) — faixa ${index + 1}`}
                              inputMode="decimal"
                              teclado={TECLADO_DECIMAL}
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
                                teclado={TECLADO_DECIMAL}
                                format={(value) => value.replace(/[^\d.,]/g, "")}
                                disabled={disabled}
                              />
                            )}
                          </form.AppField>
                        )}
                      </RowFields>
                      <RowFooter>
                        <form.Subscribe selector={(state) => state.values.faixas[index]?.valor}>
                          {(valor) => (
                            <form.Subscribe selector={(state) => state.values.faixas[index - 1]?.valor}>
                              {(anterior) => {
                                const salto = descreverSalto(valor ?? "", anterior);
                                return salto ? <Salto aria-label={`Salto em relação à faixa anterior: ${salto}`}>{salto}</Salto> : null;
                              }}
                            </form.Subscribe>
                          )}
                        </form.Subscribe>
                        <RemoveRowButton
                          label={`Remover faixa ${index + 1}`}
                          onClick={() => form.removeFieldValue("faixas", index)}
                          disabled={disabled}
                        />
                      </RowFooter>
                    </FaixaRow>
                  ))}
                </RowList>
              )}
            </>
          )}
        </form.Subscribe>
        <form.Subscribe selector={(state) => state.values.faixas}>
          {(faixas) => {
            const avisos = avisosFaixas(faixas, diariaValor);
            if (faixas.length === 0) {
              return null;
            }
            return avisos.length > 0 ? (
              <Avisos aria-label="Avisos sobre as faixas">
                {avisos.map((aviso) => (
                  <Aviso key={aviso}>{aviso}</Aviso>
                ))}
              </Avisos>
            ) : (
              <SemAvisos role="status">Faixas sem problemas.</SemAvisos>
            );
          }}
        </form.Subscribe>
      </Wrapper>
    );
  },
});
