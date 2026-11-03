"use client";

import { OptionGroup } from "@/components/ui/OptionGroup";
import { AREAS_DO_SISTEMA } from "@/lib/areasDoSistema";
import { descreverEconomia, descreverTotal, formatarReais, PLANOS } from "@/lib/planos";
import { TipoPlanoAdesao } from "@/types/plano";
import {
  Area,
  AreaDescricao,
  Areas,
  AreaTitulo,
  Economia,
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

const OPCOES_PAGAS = PLANOS.map((plano) => {
  const economia = descreverEconomia(plano);

  return {
    value: String(plano.tipo),
    label: plano.nome,
    aside: (
      <Valor>
        {formatarReais(plano.centavosPorMes)}
        <Unidade>/mês</Unidade>
      </Valor>
    ),
    detail: (
      <>
        <span>{descreverTotal(plano)}</span>
        {economia && (
          <Economia>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden="true">
              <path d="M5 12.5l4.5 4.5L19 7.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {economia}
          </Economia>
        )}
      </>
    ),
    badge: plano.recomendado ? "Mais econômico" : undefined,
  };
});

const OPCOES = [OPCAO_TESTE, ...OPCOES_PAGAS];

export function PlanoStepFields({ plano, onChange, error }: PlanoStepFieldsProps) {
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
        <FuncionalidadesTitulo id="funcionalidades-titulo">Tudo isso em todos os planos</FuncionalidadesTitulo>
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
