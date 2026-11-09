"use client";

import { useState } from "react";
import { withForm } from "@/components/form";
import { OptionGroup } from "@/components/ui/OptionGroup";
import { EMPTY_PRECO_INFO } from "@/types/preco";
import { inicioVigenciaDeHoje } from "../novoPreco";
import { Campo } from "./CampoVigencia.styles";

type ModoInicio = "hoje" | "data";
type ModoFim = "sem-fim" | "data";

const OPCOES_INICIO = [
  { value: "hoje", label: "Começa hoje" },
  { value: "data", label: "Escolher data" },
];

const OPCOES_FIM = [
  { value: "sem-fim", label: "Sem fim" },
  { value: "data", label: "Termina em…" },
];

// Início e fim da vigência: o caso comum (hoje, sem fim) é um toque; o seletor de data só aparece sob demanda.
// Os valores gravados no formulário seguem o formato do datetime-local ("" no fim = sem data de fim).
export const CampoVigencia = withForm({
  defaultValues: EMPTY_PRECO_INFO,
  props: {} as { disabled?: boolean },
  render: function Render({ form, disabled }) {
    // Ao abrir uma tabela existente, os chips refletem os valores salvos.
    const [modoInicio, setModoInicio] = useState<ModoInicio>(() =>
      form.state.values.inicioVigencia === inicioVigenciaDeHoje() ? "hoje" : "data",
    );
    const [modoFim, setModoFim] = useState<ModoFim>(() => (form.state.values.fimVigencia === "" ? "sem-fim" : "data"));

    function escolherInicio(modo: string) {
      setModoInicio(modo as ModoInicio);
      if (modo === "hoje") {
        form.setFieldValue("inicioVigencia", inicioVigenciaDeHoje());
      }
    }

    function escolherFim(modo: string) {
      setModoFim(modo as ModoFim);
      if (modo === "sem-fim") {
        form.setFieldValue("fimVigencia", "");
      }
    }

    return (
      <Campo>
        <OptionGroup legend="Início da vigência" options={OPCOES_INICIO} value={modoInicio} onChange={escolherInicio} disabled={disabled} columns={2} />
        {modoInicio === "data" && (
          <form.AppField name="inicioVigencia">
            {(field) => <field.TextField label="Data de início" type="datetime-local" disabled={disabled} />}
          </form.AppField>
        )}
        <OptionGroup legend="Fim da vigência" options={OPCOES_FIM} value={modoFim} onChange={escolherFim} disabled={disabled} columns={2} />
        {modoFim === "data" && (
          <form.AppField name="fimVigencia">
            {(field) => <field.TextField label="Data de fim" type="datetime-local" disabled={disabled} />}
          </form.AppField>
        )}
      </Campo>
    );
  },
});
