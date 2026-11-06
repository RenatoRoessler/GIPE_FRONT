"use client";

import { useState } from "react";
import { OptionGroup } from "@/components/ui/OptionGroup";
import { AREAS_DO_SISTEMA } from "@/lib/areasDoSistema";
import {
  descreverCondicao,
  formatarReais,
  lancamentoVigente,
  PLANOS,
  ROTULO_FIM_DO_LANCAMENTO,
  valorPorMes,
} from "@/lib/planos";
import { TipoPlanoAdesao } from "@/types/plano";
import {
  Area,
  AreaDescricao,
  Areas,
  AreaTitulo,
  Funcionalidades,
  FuncionalidadesTitulo,
  Raiz,
  Unidade,
  Valor,
} from "./PlanoStepFields.styles";

export interface PlanoStepFieldsProps {
  plano: TipoPlanoAdesao | undefined;
  onChange: (plano: TipoPlanoAdesao) => void;
  error?: string;
}

// Sem valor nem total: o teste não cobra nada; as condições são as mesmas que o site promete.
const OPCAO_TESTE = {
  value: String(TipoPlanoAdesao.Trial),
  label: "Teste grátis",
  aside: <Valor>30 dias</Valor>,
  detail: <span>Todas as funcionalidades, sem cartão de crédito e sem compromisso.</span>,
};

function opcoesPagas(agora: number) {
  return PLANOS.map((plano) => ({
    value: String(plano.tipo),
    label: plano.nome,
    aside: (
      <Valor>
        {formatarReais(valorPorMes(plano, agora))}
        <Unidade>/mês</Unidade>
      </Valor>
    ),
    detail: <span>{descreverCondicao(plano, agora)}</span>,
    badge: lancamentoVigente(agora) ? `Preço de lançamento · assine até ${ROTULO_FIM_DO_LANCAMENTO}` : undefined,
  }));
}

export function PlanoStepFields({ plano, onChange, error }: PlanoStepFieldsProps) {
  const [agora] = useState(() => Date.now());
  const OPCOES = [OPCAO_TESTE, ...opcoesPagas(agora)];

  return (
    <Raiz>
      <OptionGroup
        legend="Plano"
        variant="card"
        options={OPCOES}
        value={plano === undefined ? "" : String(plano)}
        onChange={(value) => onChange(Number(value) as TipoPlanoAdesao)}
        error={error}
      />
      <Funcionalidades aria-labelledby="funcionalidades-titulo">
        <FuncionalidadesTitulo id="funcionalidades-titulo">Tudo isso incluso no plano</FuncionalidadesTitulo>
        <Areas>
          {AREAS_DO_SISTEMA.map((area) => (
            <Area key={area.titulo}>
              <AreaTitulo>{area.titulo}</AreaTitulo>
              <AreaDescricao>{area.descricao}</AreaDescricao>
            </Area>
          ))}
        </Areas>
      </Funcionalidades>
    </Raiz>
  );
}
