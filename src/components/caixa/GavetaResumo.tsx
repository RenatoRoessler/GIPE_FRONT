"use client";

import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { Text } from "@/components/ui/Text";
import { useCan } from "@/hooks/useCan";
import { AREA } from "@/lib/permissoes";
import type { Caixa, Turno } from "@/types/caixa";
import { EmptyPanel, PanelTitle, VisuallyHidden } from "./Caixa.styles";
import { proporcao } from "./agregados";
import { calcularGaveta } from "./gaveta";
import {
  AcaoRetirada,
  Amostra,
  Barra,
  Bloco,
  Destaque,
  Legenda,
  Linha,
  Numero,
  Rotulo,
  Topo,
  TrechoFundo,
  TrechoRetiravel,
  Valor,
} from "./GavetaResumo.styles";
import { formatMoeda } from "./format";

export interface GavetaResumoProps {
  caixa: Caixa;
  // undefined = carregando; null = não há turno aberto.
  turno: Turno | null | undefined;
  onRetirada: () => void;
}

// Entradas, saídas e saldo vêm prontos do GET /Caixa e não incluem o fundo; se faltar o saldo, é entradas menos saídas.
function Totais({ caixa }: { caixa: Caixa }) {
  const entradas = caixa.valorTotalEntrada ?? 0;
  const saidas = caixa.valorTotalSaida ?? 0;
  const saldo = caixa.saldoAtual ?? entradas - saidas;

  return (
    <Linha>
      <div>
        <dt>Entradas</dt>
        <dd>
          <Numero $tom="success">{formatMoeda(entradas)}</Numero>
        </dd>
      </div>
      <div>
        <dt>Saídas</dt>
        <dd>
          <Numero $tom="danger">{formatMoeda(saidas)}</Numero>
        </dd>
      </div>
      <div>
        <dt>Saldo do caixa</dt>
        <dd>{formatMoeda(saldo)}</dd>
      </div>
    </Linha>
  );
}

// Responde "quanto tem na gaveta e quanto posso tirar?": o dinheiro esperado em destaque, dividido entre o que fica e o que pode sair.
export function GavetaResumo({ caixa, turno, onRetirada }: GavetaResumoProps) {
  const podeRetirar = useCan(AREA.CaixaSangria);

  if (turno === undefined) {
    return (
      <Bloco role="status" aria-busy="true">
        <VisuallyHidden>Carregando a gaveta…</VisuallyHidden>
        <Skeleton width="40%" height="16px" />
        <Skeleton width="55%" height="36px" />
        <Skeleton height="12px" />
      </Bloco>
    );
  }

  if (turno === null) {
    return (
      <EmptyPanel>
        <PanelTitle>Sem turno aberto</PanelTitle>
        <Text variant="muted">O caixa está aberto, mas não há turno em andamento para mostrar a gaveta.</Text>
        <Totais caixa={caixa} />
      </EmptyPanel>
    );
  }

  const { naGaveta, fica, retiravel } = calcularGaveta(turno);
  const mostrarBarra = naGaveta !== null && naGaveta > 0 && retiravel !== null;
  const percentualRetiravel = mostrarBarra ? proporcao(retiravel ?? 0, naGaveta ?? 0) : 0;

  return (
    <Bloco aria-labelledby="gaveta-titulo">
      <Topo>
        <Destaque>
          <Rotulo id="gaveta-titulo">Na gaveta agora</Rotulo>
          <Valor>{formatMoeda(naGaveta)}</Valor>
        </Destaque>
        {podeRetirar && (
          <AcaoRetirada>
            <Button type="button" onClick={onRetirada}>
              Retirada
            </Button>
          </AcaoRetirada>
        )}
      </Topo>

      {mostrarBarra && (
        <Barra aria-hidden="true">
          <TrechoFundo $percentual={100 - percentualRetiravel} />
          <TrechoRetiravel $percentual={percentualRetiravel} />
        </Barra>
      )}

      <Legenda>
        <div>
          <dt>
            <Amostra $tom="fundo" aria-hidden="true" />
            Fundo de caixa, fica na gaveta
          </dt>
          <dd>{formatMoeda(fica)}</dd>
        </div>
        <div>
          <dt>
            <Amostra $tom="retiravel" aria-hidden="true" />
            Pode retirar
          </dt>
          <dd>{formatMoeda(retiravel)}</dd>
        </div>
      </Legenda>

      <Totais caixa={caixa} />
    </Bloco>
  );
}
