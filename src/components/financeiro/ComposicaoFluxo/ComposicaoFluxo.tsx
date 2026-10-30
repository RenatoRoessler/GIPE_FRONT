"use client";

import { Button } from "@/components/ui/Button";
import { Link } from "@/components/ui/Link";
import { Text } from "@/components/ui/Text";
import { formatBRL } from "@/lib/money";
import type { Periodo } from "@/lib/periodo";
import { montarComposicao, type LadoComposicao, type LinhaComposicao } from "../composicao";
import {
  Barra,
  Cartao,
  Grupo,
  LadoTitulo,
  LadoTopo,
  LadoTotal,
  Lados,
  Linha,
  LinhaTopo,
  Nome,
  Percentual,
  Preenchimento,
  Trilho,
  Valor,
  Vazio,
} from "../FluxoCaixa/FluxoCaixa.styles";
import { formatPercentual } from "../format";
import { financeiroUrl } from "../url";
import type { FluxoCategoria } from "@/types/financeiro";

export interface ComposicaoFluxoProps {
  categorias: FluxoCategoria[];
  // O período do fluxo: as categorias levam aos lançamentos dele.
  periodo: Periodo;
  onLancarDespesa: () => void;
}

type Lado = "entrada" | "saida";

function BarraDeProporcao({ lado, percentual }: { lado: Lado; percentual: number }) {
  return (
    <Barra>
      <Trilho aria-hidden="true">
        <Preenchimento $lado={lado} $percentual={percentual} />
      </Trilho>
      <Percentual>{formatPercentual(percentual)}</Percentual>
    </Barra>
  );
}

function LinhaDeCategoria({ linha, lado, periodo, nivel }: { linha: LinhaComposicao; lado: Lado; periodo: Periodo; nivel: 0 | 1 }) {
  // Só categoria de lançamento tem para onde ir: rotativo e mensalidades não são lançamentos.
  const destino =
    linha.categoriaId !== null
      ? financeiroUrl("lancamentos", { lde: periodo.de, late: periodo.ate, categoria: String(linha.categoriaId) })
      : null;

  return (
    <>
      <Linha $nivel={nivel}>
        <LinhaTopo $destaque={nivel === 0}>
          <Nome>{destino ? <Link href={destino}>{linha.nome}</Link> : linha.nome}</Nome>
          <Valor>{formatBRL(linha.valor)}</Valor>
        </LinhaTopo>
        <BarraDeProporcao lado={lado} percentual={linha.percentual} />
      </Linha>
      {linha.filhas.map((filha) => (
        <LinhaDeCategoria key={filha.chave} linha={filha} lado={lado} periodo={periodo} nivel={1} />
      ))}
    </>
  );
}

function CartaoDoLado({ titulo, lado, dados, periodo, vazio }: { titulo: string; lado: Lado; dados: LadoComposicao; periodo: Periodo; vazio: React.ReactNode }) {
  return (
    <Cartao aria-label={titulo}>
      <LadoTopo>
        <LadoTitulo>{titulo}</LadoTitulo>
        <LadoTotal $lado={lado}>{formatBRL(dados.total)}</LadoTotal>
      </LadoTopo>
      {dados.grupos.length === 0
        ? vazio
        : dados.grupos.map((grupo) => (
            <Grupo key={grupo.chave}>
              <Linha $nivel={0}>
                <LinhaTopo $destaque>
                  <Nome>{grupo.titulo}</Nome>
                  <Valor>{formatBRL(grupo.valor)}</Valor>
                </LinhaTopo>
                <BarraDeProporcao lado={lado} percentual={grupo.percentual} />
              </Linha>
              {grupo.linhas.map((linha) => (
                <LinhaDeCategoria key={linha.chave} linha={linha} lado={lado} periodo={periodo} nivel={0} />
              ))}
            </Grupo>
          ))}
    </Cartao>
  );
}

// De onde veio cada real do período, entradas de um lado e saídas do outro.
export function ComposicaoFluxo({ categorias, periodo, onLancarDespesa }: ComposicaoFluxoProps) {
  const { entradas, saidas } = montarComposicao(categorias);

  return (
    <Lados>
      <CartaoDoLado titulo="Entradas" lado="entrada" dados={entradas} periodo={periodo} vazio={<Text variant="muted">Nenhuma entrada no período.</Text>} />
      <CartaoDoLado
        titulo="Saídas"
        lado="saida"
        dados={saidas}
        periodo={periodo}
        vazio={
          <Vazio>
            <Text variant="muted">Nenhuma saída no período.</Text>
            <Button type="button" variant="secondary" size="sm" onClick={onLancarDespesa}>
              Lançar despesa
            </Button>
          </Vazio>
        }
      />
    </Lados>
  );
}
