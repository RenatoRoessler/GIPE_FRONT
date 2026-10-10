"use client";

import { parseMoney } from "@/lib/money";
import { DIAS_SEMANA_PRECO, TIPO_REGRA_OPTIONS, type PrecoFormValues } from "@/types/preco";
import { FaixasPreview } from "../FaixasPreview";
import { formatDataIso, formatMinutos, getCategoriaLabel } from "../format";
import { Fact, Facts, HorarioList, Resumo, ResumoTitle } from "./PrecoResumo.styles";

export interface PrecoResumoProps {
  values: PrecoFormValues;
}

function minutes(value: string): string {
  return /^\d+$/.test(value) ? formatMinutos(Number(value)) : "—";
}

// Leitura rápida de tudo o que será salvo, exibida na última etapa do cadastro.
export function PrecoResumo({ values }: PrecoResumoProps) {
  const { info, horarios, faixas, categorias } = values;
  const tipo = TIPO_REGRA_OPTIONS.find((option) => String(option.value) === info.tipoRegra)?.label ?? "—";

  return (
    <Resumo aria-label="Resumo da tabela de preço">
      <ResumoTitle>Resumo</ResumoTitle>
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
