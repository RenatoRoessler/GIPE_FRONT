"use client";

import { useState } from "react";
import { BackButton } from "@/components/ui/BackButton";
import { Button } from "@/components/ui/Button";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { Skeleton } from "@/components/ui/Skeleton";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Tabs } from "@/components/ui/Tabs";
import { Text } from "@/components/ui/Text";
import { getSituacao } from "@/lib/api/services/preco.mapper";
import { TIPO_CATEGORIA, type PrecoView } from "@/types/preco";
import { FaixasPreview } from "../FaixasPreview";
import { formatBRL, formatMinutos, formatVigencia, getCategoriaLabel, getTipoRegraLabel } from "../format";
import { PrecoSemana } from "../PrecoSemana";
import { SITUACAO_BADGE } from "../situacao";
import { SimuladorCobranca } from "../SimuladorCobranca";
import {
  Cabecalho,
  Detalhe,
  EditarLink,
  Estado,
  Fatos,
  FatosEmColunas,
  Identificacao,
  Meta,
  SkeletonBloco,
  Tarifa,
  TipoNome,
  Titulo,
  VoltarArea,
} from "./PrecoDetalhe.styles";

export type AbaDetalhe = "tarifa" | "horarios" | "informacoes";

const ABAS = [
  { id: "tarifa", label: "Tarifa" },
  { id: "horarios", label: "Horários" },
  { id: "informacoes", label: "Informações" },
];

export const TABELA_INEXISTENTE_MESSAGE = "Esta tabela de preço não existe mais.";

export interface PrecoDetalheProps {
  estado: "pronto" | "carregando" | "erro" | "inexistente";
  preco?: PrecoView | null;
  mensagemErro?: string;
  onTentarNovamente?: () => void;
  // Leva à primeira tabela da lista quando a escolhida deixou de existir.
  onIrParaPrimeira?: () => void;
  // No celular, volta para a lista.
  onVoltar?: () => void;
}

function categoriasTexto(preco: PrecoView): string {
  if (preco.categorias.length === 0) {
    return "—";
  }
  if (preco.categorias.includes(TIPO_CATEGORIA.Todas)) {
    return getCategoriaLabel(TIPO_CATEGORIA.Todas);
  }
  return preco.categorias.map(getCategoriaLabel).join(", ");
}

// Percentuais da conveniada usados nos degraus: um só valor vira selo na placa; vários viram texto.
function descontosConveniada(preco: PrecoView): number[] {
  return [...new Set(preco.faixas.map((faixa) => faixa.percentualConveniada).filter((p): p is number => p !== null && p > 0))].sort(
    (a, b) => a - b,
  );
}

function Esqueleto() {
  return (
    <Detalhe role="status" aria-busy="true" aria-label="Carregando tabela de preço">
      <SkeletonBloco>
        <Skeleton height="36px" width="60%" />
        <Skeleton height="20px" width="40%" />
      </SkeletonBloco>
      <Skeleton height="44px" />
      <Skeleton height="220px" />
      <Skeleton height="140px" />
    </Detalhe>
  );
}

export function PrecoDetalhe({ estado, preco, mensagemErro, onTentarNovamente, onIrParaPrimeira, onVoltar }: Readonly<PrecoDetalheProps>) {
  // A aba escolhida vale para qualquer tabela: ao trocar de tabela, continua na mesma aba.
  const [aba, setAba] = useState<AbaDetalhe>("tarifa");

  if (estado === "carregando") {
    return <Esqueleto />;
  }

  if (estado === "erro") {
    return (
      <Estado>
        {onVoltar && (
          <VoltarArea>
            <BackButton onClick={onVoltar}>Preços</BackButton>
          </VoltarArea>
        )}
        <ErrorBanner role="alert">Não foi possível carregar a tabela de preço. {mensagemErro}</ErrorBanner>
        {onTentarNovamente && (
          <Button type="button" variant="secondary" onClick={onTentarNovamente}>
            Tentar novamente
          </Button>
        )}
      </Estado>
    );
  }

  if (estado === "inexistente" || !preco) {
    return (
      <Estado>
        {onVoltar && (
          <VoltarArea>
            <BackButton onClick={onVoltar}>Preços</BackButton>
          </VoltarArea>
        )}
        <Text variant="muted">{TABELA_INEXISTENTE_MESSAGE}</Text>
        {onIrParaPrimeira && (
          <Button type="button" variant="secondary" onClick={onIrParaPrimeira}>
            Ver a primeira da lista
          </Button>
        )}
      </Estado>
    );
  }

  const situacao = SITUACAO_BADGE[getSituacao(preco.ativo, preco.inicioVigencia, preco.fimVigencia, new Date())];
  const descontos = descontosConveniada(preco);

  return (
    <Detalhe aria-labelledby={`detalhe-titulo-${preco.rotatividadeId}`}>
      {onVoltar && (
        <VoltarArea>
          <BackButton onClick={onVoltar}>Preços</BackButton>
        </VoltarArea>
      )}
      <Cabecalho>
        <Identificacao>
          <Titulo id={`detalhe-titulo-${preco.rotatividadeId}`}>{preco.descricao}</Titulo>
          <Meta>
            <TipoNome>{getTipoRegraLabel(preco.tipoRegra)}</TipoNome>
            <StatusBadge tone={situacao.tone}>{situacao.label}</StatusBadge>
            <span>{formatVigencia(preco.inicioVigencia, preco.fimVigencia)}</span>
          </Meta>
        </Identificacao>
        <EditarLink href={`/precos/${preco.rotatividadeId}/editar`} aria-label={`Editar ${preco.descricao}`}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 20h9" />
            <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
          </svg>
          Editar
        </EditarLink>
      </Cabecalho>

      <Tabs tabs={ABAS} value={aba} onChange={(id) => setAba(id as AbaDetalhe)} aria-label="Detalhes da tabela de preço">
        {aba === "tarifa" && (
          <Tarifa>
            <FaixasPreview
              size="lg"
              faixas={preco.faixas}
              diaria={{ periodo: preco.periodoDiaria, valor: preco.valorDiaria, adicional: preco.valorAdicionalDiaria }}
              conveniadaPercentual={descontos.length === 1 ? descontos[0] : null}
            />
            <Fatos>
              <div>
                <dt>Tolerância de entrada</dt>
                <dd>{preco.toleranciaEntradaMinutos} min</dd>
              </div>
              <div>
                <dt>Tolerância de alteração de faixa</dt>
                <dd>{preco.toleranciaAlteracaoFaixaMinutos} min</dd>
              </div>
              <div>
                <dt>Categorias</dt>
                <dd>{categoriasTexto(preco)}</dd>
              </div>
              {descontos.length > 1 && (
                <div>
                  <dt>Desconto da conveniada</dt>
                  <dd>
                    {descontos[0]}% a {descontos.at(-1)}%, conforme o degrau
                  </dd>
                </div>
              )}
            </Fatos>
          </Tarifa>
        )}

        {aba === "horarios" && <PrecoSemana regras={preco.regras} />}

        {aba === "informacoes" && (
          <FatosEmColunas>
            <div>
              <dt>Tipo de regra</dt>
              <dd>{getTipoRegraLabel(preco.tipoRegra)}</dd>
            </div>
            <div>
              <dt>Vigência</dt>
              <dd>{formatVigencia(preco.inicioVigencia, preco.fimVigencia)}</dd>
            </div>
            <div>
              <dt>Situação</dt>
              <dd>{situacao.label}</dd>
            </div>
            <div>
              <dt>Período da diária</dt>
              <dd>{formatMinutos(preco.periodoDiaria)}</dd>
            </div>
            <div>
              <dt>Valor da diária</dt>
              <dd>{formatBRL(preco.valorDiaria)}</dd>
            </div>
            <div>
              <dt>Valor adicional</dt>
              <dd>{formatBRL(preco.valorAdicionalDiaria)}</dd>
            </div>
            {preco.empresaConveniadaId !== null && (
              <div>
                <dt>Empresa conveniada</dt>
                <dd>{preco.empresaConveniadaId}</dd>
              </div>
            )}
          </FatosEmColunas>
        )}
      </Tabs>

      <SimuladorCobranca key={preco.rotatividadeId} preco={preco} />
    </Detalhe>
  );
}
