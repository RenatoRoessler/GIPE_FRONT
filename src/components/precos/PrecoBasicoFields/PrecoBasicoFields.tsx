"use client";

import { withForm } from "@/components/form";
import { Grid, GridItem } from "@/components/form/FormGrid.styles";
import { Checkbox } from "@/components/ui/Checkbox";
import { Text } from "@/components/ui/Text";
import type { ConveniadaOpcao } from "@/types/conveniada";
import { EMPTY_PRECO_INFO } from "@/types/preco";
import { Section, SectionTitle } from "../shared/FormSection.styles";
import { TipoRegraCards } from "../TipoRegraCards";

export const PrecoBasicoFields = withForm({
  defaultValues: EMPTY_PRECO_INFO,
  props: {} as {
    disabled?: boolean;
    semFim: boolean;
    onSemFimChange: (semFim: boolean) => void;
    // Conveniadas com convênio ativo para o campo "Empresa conveniada"; `conveniosState` diz se a lista ainda carrega ou falhou.
    convenios: ConveniadaOpcao[];
    conveniosState: "carregando" | "pronto" | "erro";
    // Motivo devolvido pela API quando a lista falha.
    conveniosErro?: string;
  },
  render: function Render({ form, disabled, semFim, onSemFimChange, convenios, conveniosState, conveniosErro }) {
    function handleSemFim(checked: boolean) {
      if (checked) {
        form.setFieldValue("fimVigencia", "");
      }
      onSemFimChange(checked);
    }

    return (
      <>
        <Section>
          <SectionTitle>Identificação</SectionTitle>
          <Grid>
            <GridItem $span>
              <form.AppField name="descricao">
                {(field) => <field.TextField label="Descrição" maxLength={120} disabled={disabled} />}
              </form.AppField>
            </GridItem>
            <GridItem $span>
              <form.AppField name="tipoRegra">
                {(field) => {
                  const error = field.state.meta.isTouched ? field.state.meta.errors[0] : undefined;
                  return (
                    <TipoRegraCards
                      value={field.state.value}
                      onChange={field.handleChange}
                      disabled={disabled}
                      error={typeof error === "string" ? error : undefined}
                    />
                  );
                }}
              </form.AppField>
            </GridItem>
            <GridItem $span>
              <form.AppField name="empresaConveniadaId">
                {(field) => {
                  const atual = field.state.value;
                  // Convênio já gravado que não veio na lista (ex.: encerrado) continua escolhido, para não se perder ao salvar.
                  const foraDaLista = atual !== "" && !convenios.some((convenio) => String(convenio.empresaConveniadaId) === atual);
                  return (
                    <>
                      <field.SelectField label="Empresa conveniada" disabled={disabled || conveniosState === "carregando"}>
                        <option value="">Nenhuma</option>
                        {foraDaLista && <option value={atual}>{`Empresa nº ${atual}`}</option>}
                        {convenios.map((convenio) => (
                          <option key={convenio.empresaConveniadaId} value={String(convenio.empresaConveniadaId)}>
                            {convenio.nome}
                          </option>
                        ))}
                      </field.SelectField>
                      <Text variant={conveniosState === "erro" ? "error" : "muted"}>
                        {conveniosState === "carregando"
                          ? "Carregando conveniadas…"
                          : conveniosState === "erro"
                            ? `Não foi possível carregar as conveniadas${conveniosErro ? `: ${conveniosErro}` : "."} A tabela vale para todos.`
                            : "Obrigatória no tipo Convênio; nos outros tipos, deixe em Nenhuma."}
                      </Text>
                    </>
                  );
                }}
              </form.AppField>
            </GridItem>
          </Grid>
        </Section>

        <Section>
          <SectionTitle>Vigência</SectionTitle>
          <Grid>
            <GridItem>
              <form.AppField name="inicioVigencia">
                {(field) => <field.TextField label="Início da vigência" type="datetime-local" disabled={disabled} />}
              </form.AppField>
            </GridItem>
            <GridItem>
              <form.AppField name="fimVigencia">
                {(field) => <field.TextField label="Fim da vigência" type="datetime-local" disabled={disabled || semFim} />}
              </form.AppField>
            </GridItem>
            <GridItem $span>
              <Checkbox label="Sem data de fim" checked={semFim} onCheckedChange={handleSemFim} disabled={disabled} />
            </GridItem>
          </Grid>
        </Section>

        <Section>
          <SectionTitle>Situação</SectionTitle>
          <form.AppField name="ativo">{(field) => <field.SwitchField label="Ativo" disabled={disabled} />}</form.AppField>
          <form.Subscribe selector={(state) => state.values.ativo}>
            {(ativo) => (
              <Text variant="muted" aria-live="polite">
                {ativo
                  ? "Ativa: é aplicada durante a vigência."
                  : "Inativa: não será aplicada enquanto estiver desligada."}
              </Text>
            )}
          </form.Subscribe>
        </Section>
      </>
    );
  },
});
