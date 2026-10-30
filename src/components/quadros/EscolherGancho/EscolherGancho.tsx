"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { InfoCard } from "@/components/ui/InfoCard";
import { KeyBoardGrid } from "@/components/ui/KeyBoardGrid";
import { PlateDisplay } from "@/components/ui/PlateDisplay";
import { Skeleton } from "@/components/ui/Skeleton";
import { Tabs } from "@/components/ui/Tabs";
import { Text } from "@/components/ui/Text";
import type { ChaveEscolhida } from "@/types/quadroChaves";
import { linhasDaGrade, rotuloGancho } from "../gancho";
import { useQuadros } from "../useQuadros";
import { Acoes, EscolhaPage, ErrorArea, RodapeDoModal, SugestaoLetra, VeiculoCard, VeiculoInfo } from "../Quadros.styles";
import { useEscolherGancho, type ChaveAtual } from "./useEscolherGancho";

export interface EscolherGanchoProps {
  patioId: number;
  placa: string;
  modelo?: string | null;
  cor?: string | null;
  // O gancho foi guardado.
  onGuardado: (chave: ChaveEscolhida) => void;
  // Sem quadros, sem escolha possível ou "escolher depois": a entrada segue sem gancho. Sem esta função não há botão de adiar.
  onPular?: () => void;
  rotuloPular?: string;
  // A chave que o veículo já tem no quadro: a tela passa a ser de troca, sem sugestão.
  atual?: ChaveAtual | null;
}

function descricaoDoVeiculo(modelo?: string | null, cor?: string | null): string {
  const corTexto = cor ? cor.charAt(0).toUpperCase() + cor.slice(1).toLowerCase() : "";
  return [modelo, corTexto].filter(Boolean).join(" · ");
}

// Etapa da entrada de veículos: onde a chave será pendurada. A sugestão (primeiro gancho livre) já vem marcada.
export function EscolherGancho({ patioId, placa, modelo, cor, onGuardado, onPular, rotuloPular = "Escolher depois", atual }: EscolherGanchoProps) {
  const { data: quadros, isPending, isError, error, refetch, isFetching } = useQuadros();
  const semQuadros = quadros !== undefined && quadros.length === 0;

  // Empresa sem quadros não é bloqueada: a entrada termina como antes.
  useEffect(() => {
    if (semQuadros) {
      onPular?.();
    }
  }, [semQuadros, onPular]);

  if (isPending || semQuadros) {
    return (
      <EscolhaPage role="status" aria-label="Carregando">
        <Skeleton height="64px" radius="14px" />
        <Skeleton height="240px" radius="18px" />
      </EscolhaPage>
    );
  }

  if (isError || !quadros) {
    return (
      <ErrorArea>
        <ErrorBanner role="alert">Não foi possível carregar o quadro de chaves. {error?.message}</ErrorBanner>
        <Acoes>
          <Button type="button" variant="secondary" onClick={() => void refetch()} disabled={isFetching}>
            Tentar novamente
          </Button>
          {onPular && (
            <Button type="button" variant="secondary" onClick={onPular}>
              {rotuloPular}
            </Button>
          )}
        </Acoes>
      </ErrorArea>
    );
  }

  return (
    <Escolha
      quadros={quadros}
      patioId={patioId}
      placa={placa}
      modelo={modelo}
      cor={cor}
      onGuardado={onGuardado}
      onPular={onPular}
      rotuloPular={rotuloPular}
      atual={atual}
    />
  );
}

type EscolhaProps = EscolherGanchoProps & { quadros: NonNullable<ReturnType<typeof useQuadros>["data"]> };

function Escolha({ quadros, patioId, placa, modelo, cor, onGuardado, onPular, rotuloPular, atual }: EscolhaProps) {
  const { quadro, selecionado, atualId, ehSugestao, erro, guardando, escolherQuadro, escolherGancho, guardar } = useEscolherGancho({
    patioId,
    quadros,
    onGuardado,
    atual,
  });

  if (!quadro) {
    return null;
  }

  const rotulo = selecionado ? rotuloGancho(selecionado.linha, selecionado.coluna) : null;
  const descricao = descricaoDoVeiculo(modelo, cor);

  // JSX direto, não um componente interno: a grade mantém o foco quando a tela renderiza de novo.
  const grade = (
    <>
      {selecionado ? (
        <InfoCard
          title={ehSugestao ? "Gancho sugerido" : "Gancho escolhido"}
          icon={<SugestaoLetra>{rotuloGancho(selecionado.linha, selecionado.coluna)}</SugestaoLetra>}
        >
          {ehSugestao ? "Primeiro livre. Toque em outro livre para trocar." : "Toque em outro livre para trocar."}
        </InfoCard>
      ) : atual ? (
        <InfoCard title={`Chave hoje no ${atual.rotulo}`}>Toque em um gancho livre para trocar.</InfoCard>
      ) : (
        <InfoCard title="Todos os ganchos deste quadro estão ocupados">
          {quadros.length > 1 ? "Escolha outro quadro ou deixe a chave para depois." : "Libere um gancho ou escolha depois."}
        </InfoCard>
      )}
      <KeyBoardGrid
        linhas={linhasDaGrade(quadro, selecionado?.patioQuadroChaveId, atualId)}
        modo="escolher"
        aria-label={`Quadro ${quadro.nome}`}
        onSelect={(id) => escolherGancho(Number(id))}
      />
    </>
  );

  return (
    <EscolhaPage>
      <VeiculoCard>
        <PlateDisplay value={placa} size="sm" />
        {descricao && <VeiculoInfo>{descricao}</VeiculoInfo>}
      </VeiculoCard>

      {erro && <ErrorBanner role="alert">{erro}</ErrorBanner>}

      {quadros.length > 1 ? (
        <Tabs
          tabs={quadros.map((item) => ({ id: String(item.patioQuadroId), label: item.nome }))}
          value={String(quadro.patioQuadroId)}
          onChange={(id) => escolherQuadro(Number(id))}
          aria-label="Quadro de chaves"
        >
          {grade}
        </Tabs>
      ) : (
        grade
      )}

      <RodapeDoModal>
        {rotulo && (
          <Text variant="muted">
            Pendure a chave no {rotulo}. A posição aparece no card do carro no pátio.
          </Text>
        )}
        <Button type="button" onClick={guardar} disabled={!selecionado || guardando}>
          {guardando ? "Guardando…" : rotulo ? `Guardar no gancho ${rotulo}` : atual ? "Escolha um gancho" : "Guardar no gancho"}
        </Button>
        {onPular && (
          <Button type="button" variant="secondary" onClick={onPular} disabled={guardando}>
            {rotuloPular}
          </Button>
        )}
      </RodapeDoModal>
    </EscolhaPage>
  );
}
