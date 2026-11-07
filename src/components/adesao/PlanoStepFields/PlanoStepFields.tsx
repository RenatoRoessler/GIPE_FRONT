"use client";

import { OptionGroup } from "@/components/ui/OptionGroup";
import { AREAS_DO_SISTEMA } from "@/lib/areasDoSistema";
import {
  CONDICOES_DO_TESTE,
  descreverCondicao,
  descreverDuracao,
  descreverParaLeitor,
  formatarReais,
  rotuloDoSelo,
} from "@/lib/planos";
import { PlanoAdesao, TipoPlanoAdesao } from "@/types/plano";
import {
  Area,
  AreaDescricao,
  Areas,
  AreaTitulo,
  Funcionalidades,
  FuncionalidadesTitulo,
  PrecoRiscado,
  Raiz,
  Unidade,
  Valor,
} from "./PlanoStepFields.styles";
import { PlanosCarregando } from "./PlanosCarregando";
import { PlanosErro } from "./PlanosErro";

// O que a etapa precisa da consulta dos planos (o hook do wizard devolve exatamente isto).
export interface ConsultaPlanos {
  status: "pending" | "error" | "success";
  dados?: PlanoAdesao[];
  refazer: () => void;
  refazendo: boolean;
}

export interface PlanoStepFieldsProps {
  planos: ConsultaPlanos;
  plano: number | undefined;
  onChange: (plano: number) => void;
  error?: string;
}

function opcaoDoPlano(plano: PlanoAdesao) {
  const teste = plano.tipo === TipoPlanoAdesao.Trial;

  return {
    value: String(plano.tipo),
    label: plano.nome,
    ariaLabel: descreverParaLeitor(plano),
    // O teste mostra a duração no lugar do valor: não cobra nada.
    aside: teste ? (
      <Valor>{descreverDuracao(plano.meses)}</Valor>
    ) : (
      <>
        {plano.emPromocao && <PrecoRiscado aria-hidden="true">{formatarReais(plano.centavosTabela)}</PrecoRiscado>}
        <Valor>
          {formatarReais(plano.centavosAtual)}
          <Unidade>/mês</Unidade>
        </Valor>
      </>
    ),
    detail: <span>{teste ? CONDICOES_DO_TESTE : descreverCondicao(plano)}</span>,
    badge: rotuloDoSelo(plano),
  };
}

export function PlanoStepFields({ planos, plano, onChange, error }: PlanoStepFieldsProps) {
  let escolha;
  if (planos.status === "pending") {
    escolha = <PlanosCarregando />;
  } else if (planos.status === "error" || !planos.dados) {
    escolha = <PlanosErro onRetry={planos.refazer} refazendo={planos.refazendo} />;
  } else {
    escolha = (
      <OptionGroup
        legend="Plano"
        variant="card"
        options={planos.dados.map(opcaoDoPlano)}
        value={plano === undefined ? "" : String(plano)}
        onChange={(value) => onChange(Number(value))}
        error={error}
      />
    );
  }

  return (
    <Raiz>
      {escolha}
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
