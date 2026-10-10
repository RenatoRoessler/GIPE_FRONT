"use client";

import { parseMoney } from "@/lib/money";
import { DIAS_SEMANA_PRECO, TIPO_REGRA_OPTIONS, type PrecoFormValues } from "@/types/preco";
import { FaixasPreview } from "../FaixasPreview";
import { diffPreco, type ListDiff } from "../diff";
import { formatDataIso, formatMinutos, getCategoriaLabel } from "../format";
import {
  ChangeItem,
  ChangeList,
  ChangeTitle,
  Changes,
  Fact,
  Facts,
  HorarioList,
  OldValue,
  Resumo,
  ResumoTitle,
  ScreenReaderOnly,
} from "./PrecoResumo.styles";

export interface PrecoResumoProps {
  values: PrecoFormValues;
  // Tabela como foi salva. Quando informada (edição), o resumo destaca o que mudou.
  original?: PrecoFormValues;
}

// "2 faixas adicionadas · 1 removida"; vazio quando a lista não mudou.
function describeListChange(diff: ListDiff, singular: string, plural: string): string | null {
  const noun = (count: number) => (count === 1 ? singular : plural);
  const parts: string[] = [];
  if (diff.adicionadas.length > 0) {
    parts.push(`${diff.adicionadas.length} ${noun(diff.adicionadas.length)} ${diff.adicionadas.length === 1 ? "adicionada" : "adicionadas"}`);
  }
  if (diff.removidas.length > 0) {
    parts.push(`${diff.removidas.length} ${diff.removidas.length === 1 ? "removida" : "removidas"}`);
  }
  return parts.length > 0 ? parts.join(" · ") : null;
}

function ListChange({ title, diff, singular, plural }: { title: string; diff: ListDiff; singular: string; plural: string }) {
  const summary = describeListChange(diff, singular, plural);
  if (!summary) {
    return null;
  }
  return (
    <ChangeItem>
      <dt>{title}</dt>
      <dd>
        {summary}
        <HorarioList>
          {diff.adicionadas.map((label) => (
            <li key={`+${label}`}>+ {label}</li>
          ))}
          {diff.removidas.map((label) => (
            <li key={`-${label}`}>
              <OldValue>− {label}</OldValue>
            </li>
          ))}
        </HorarioList>
      </dd>
    </ChangeItem>
  );
}

function minutes(value: string): string {
  return /^\d+$/.test(value) ? formatMinutos(Number(value)) : "—";
}

// Leitura rápida de tudo o que será salvo, exibida na última etapa do cadastro.
export function PrecoResumo({ values, original }: PrecoResumoProps) {
  const { info, horarios, faixas, categorias } = values;
  const tipo = TIPO_REGRA_OPTIONS.find((option) => String(option.value) === info.tipoRegra)?.label ?? "—";

  const diff = original ? diffPreco(original, values) : null;

  return (
    <Resumo aria-label="Resumo da tabela de preço">
      <ResumoTitle>Resumo</ResumoTitle>
      {diff && (
        <Changes aria-label="Alterações em relação à tabela salva">
          <ChangeTitle>Alterações</ChangeTitle>
          {diff.hasChanges ? (
            <ChangeList>
              {diff.info.map((change) => (
                <ChangeItem key={change.campo}>
                  <dt>{change.rotulo}</dt>
                  <dd>
                    <OldValue>{change.antes}</OldValue> → <strong>{change.depois}</strong>
                    <ScreenReaderOnly>
                      {` (era ${change.antes}, agora ${change.depois})`}
                    </ScreenReaderOnly>
                  </dd>
                </ChangeItem>
              ))}
              <ListChange title="Horários" diff={diff.horarios} singular="horário" plural="horários" />
              <ListChange title="Faixas de valores" diff={diff.faixas} singular="faixa" plural="faixas" />
              <ListChange title="Categorias" diff={diff.categorias} singular="categoria" plural="categorias" />
            </ChangeList>
          ) : (
            <p>Nenhuma alteração em relação à tabela salva.</p>
          )}
        </Changes>
      )}
      <Facts>
        <Fact>
          <dt>Descrição</dt>
          <dd>{info.descricao || "—"}</dd>
        </Fact>
        <Fact>
          <dt>Tipo de regra</dt>
          <dd>{tipo}</dd>
        </Fact>
        <Fact>
          <dt>Vigência</dt>
          <dd>
            {formatDataIso(info.inicioVigencia || null)} → {info.fimVigencia ? formatDataIso(info.fimVigencia) : "sem fim"}
          </dd>
        </Fact>
        <Fact>
          <dt>Tolerâncias</dt>
          <dd>
            Entrada {minutes(info.toleranciaEntradaMinutos)} · alteração de faixa{" "}
            {minutes(info.toleranciaAlteracaoFaixaMinutos)}
          </dd>
        </Fact>
        <Fact>
          <dt>Categorias</dt>
          <dd>{categorias.length > 0 ? categorias.map(getCategoriaLabel).join(", ") : "—"}</dd>
        </Fact>
        <Fact>
          <dt>Situação</dt>
          <dd>{info.ativo ? "Ativo" : "Inativo"}</dd>
        </Fact>
      </Facts>

      <Facts>
        <Fact>
          <dt>Horários</dt>
          <dd>
            <HorarioList>
            {horarios.map((horario, index) => (
              <li key={index}>
                {DIAS_SEMANA_PRECO.find((dia) => String(dia.codigo) === horario.diaSemana)?.label ?? "—"}:{" "}
                {horario.horaInicio || "—"} às {horario.horaFim || "—"}
                {!horario.ativo && " (inativo)"}
              </li>
            ))}
            </HorarioList>
          </dd>
        </Fact>
      </Facts>

      <FaixasPreview
        faixas={faixas
          .map((faixa) => ({ minutosLimite: Number(faixa.minutosLimite), valor: parseMoney(faixa.valor) }))
          .filter((faixa) => faixa.minutosLimite > 0 && Number.isFinite(faixa.valor))}
        diaria={{
          periodo: Number(info.periodoDiaria),
          valor: parseMoney(info.valorDiaria),
          adicional: parseMoney(info.valorAdicionalDiaria),
        }}
      />
    </Resumo>
  );
}
