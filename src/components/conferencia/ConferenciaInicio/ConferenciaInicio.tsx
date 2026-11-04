"use client";

import { useState, useSyncExternalStore } from "react";
import { formatDate, formatTime } from "@/components/caixa/format";
import { ListError } from "@/components/mensalistas/ListError";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { InfoCard } from "@/components/ui/InfoCard";
import { Link } from "@/components/ui/Link";
import { OptionGroup } from "@/components/ui/OptionGroup";
import { Skeleton } from "@/components/ui/Skeleton";
import { TipoClienteBadge } from "@/components/ui/TipoClienteBadge";
import { METODO_CONFERENCIA, type MetodoConferencia } from "@/types/conferenciaPatio";
import { Coluna, Cabecalho, Rodape, Rotulo, Secao, Titulo, Titulos } from "../Conferencia.styles";
import { calcularTotais, descreverEncerrada } from "../conferencia";
import type { InicioProps } from "../tipos";
import { useConferenciaResumo } from "../useConferenciaResumo";
import { Chip, Chips, Dica, Divisor, Total, TotalNumero, Ultima } from "./ConferenciaInicio.styles";

const icone = { width: 20, height: 20, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2.2, strokeLinecap: "round", strokeLinejoin: "round" } as const;

const IconeCamera = (
  <svg {...icone}>
    <path d="M4 8h3l2-3h6l2 3h3v11H4z" />
    <circle cx="12" cy="13" r="3.5" />
  </svg>
);

const IconeLista = (
  <svg {...icone}>
    <path d="M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01" />
  </svg>
);

// A câmera só existe em conexão segura e em aparelho com câmera; no servidor assume que existe.
const semAssinatura = () => () => undefined;
const cameraDoNavegador = () => typeof navigator !== "undefined" && Boolean(navigator.mediaDevices?.getUserMedia);

const MENSAGEM_ERRO = "Não foi possível iniciar a conferência. Tente de novo.";

function rotuloDeHoje(agora: Date): string {
  const dia = agora.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", "");
  return `${dia} ${formatDate(agora.toISOString().slice(0, 19)).slice(0, 5)} · ${agora.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`;
}

export function ConferenciaInicio({ conferencia, acoes, onIr }: InicioProps) {
  const resumoQuery = useConferenciaResumo();
  const cameraDisponivel = useSyncExternalStore(semAssinatura, cameraDoNavegador, () => true);
  const [agora] = useState(() => new Date());
  const [escolhido, setMetodo] = useState<string>(String(METODO_CONFERENCIA.Camera));
  const [erro, setErro] = useState<string | null>(null);

  const metodo = cameraDisponivel ? escolhido : String(METODO_CONFERENCIA.Lista);
  const resumo = resumoQuery.data;
  const semCaixa = resumo !== undefined && resumo.caixaIdAberto === null && conferencia === null;
  const totais = conferencia ? calcularTotais(conferencia) : null;

  async function iniciar() {
    setErro(null);
    try {
      await acoes.iniciar(Number(metodo) as MetodoConferencia);
      onIr("conferindo");
    } catch (error) {
      setErro(error instanceof Error && error.message ? error.message : MENSAGEM_ERRO);
    }
  }

  return (
    <Coluna>
      <Cabecalho>
        <Titulos>
          <Titulo>Conferência de pátio</Titulo>
          <Rotulo>{rotuloDeHoje(agora)}</Rotulo>
        </Titulos>
      </Cabecalho>

      {resumoQuery.isPending ? (
        <div role="status" aria-label="Carregando o pátio">
          <Skeleton height="176px" radius="18px" />
        </div>
      ) : resumoQuery.isError ? (
        <ListError error={resumoQuery.error} what="o resumo do pátio" onRetry={() => void resumoQuery.refetch()} retrying={resumoQuery.isFetching} />
      ) : resumo ? (
        <Card maxWidth="none" role="region" aria-label="Pátio agora">
          <Secao>
            <Rotulo>No sistema agora</Rotulo>
            <Total>
              <TotalNumero>{resumo.totalVeiculos}</TotalNumero>
              <span>{resumo.totalVeiculos === 1 ? "veículo no pátio" : "veículos no pátio"}</span>
            </Total>
            <Chips aria-label="Veículos por tipo de cliente">
              <Chip>
                <TipoClienteBadge tipo="avulso" size="sm" />
                {resumo.avulsos} {resumo.avulsos === 1 ? "avulso" : "avulsos"}
              </Chip>
              <Chip>
                <TipoClienteBadge tipo="mensal" size="sm" />
                {resumo.mensais} {resumo.mensais === 1 ? "mensal" : "mensais"}
              </Chip>
              <Chip>
                <TipoClienteBadge tipo="conveniado" size="sm" />
                {resumo.conveniados} {resumo.conveniados === 1 ? "conveniado" : "conveniados"}
              </Chip>
            </Chips>
          </Secao>
          <Divisor />
          <Ultima>
            <dt>Última conferência</dt>
            <dd>{resumo.ultimaConferencia ? descreverEncerrada(resumo.ultimaConferencia, agora, formatDate, formatTime) : "nenhuma ainda"}</dd>
          </Ultima>
        </Card>
      ) : null}

      {conferencia && totais ? (
        <InfoCard title="Há uma conferência em andamento">
          Iniciada às {formatTime(conferencia.dataInicio)}
          {conferencia.usuarioInicio ? ` por ${conferencia.usuarioInicio}` : ""}: {totais.conferidos} de {totais.total} conferidos.
        </InfoCard>
      ) : (
        <>
          <OptionGroup
            legend="Como conferir"
            variant="card"
            columns={1}
            value={metodo}
            onChange={setMetodo}
            options={[
              ...(cameraDisponivel
                ? [
                    {
                      value: String(METODO_CONFERENCIA.Camera),
                      label: "Ler placas com a câmera",
                      icon: IconeCamera,
                      detail: "Caminhe pelo pátio apontando para as placas. Cada carro lido é marcado sozinho.",
                    },
                  ]
                : []),
              {
                value: String(METODO_CONFERENCIA.Lista),
                label: "Marcar pela lista",
                icon: IconeLista,
                detail: "Para pátio pequeno ou pouca luz. Toque em cada carro que encontrar.",
              },
            ]}
          />
          {!cameraDisponivel && <Dica>Câmera indisponível neste aparelho ou navegador.</Dica>}
          <InfoCard title="Entradas e saídas continuam funcionando">Cada carro conferido fica salvo na hora.</InfoCard>
        </>
      )}

      {semCaixa && (
        <ErrorBanner role="alert">
          Abra o caixa para iniciar a conferência. <Link href="/caixa">Abrir caixa</Link>
        </ErrorBanner>
      )}
      {erro && <ErrorBanner role="alert">{erro}</ErrorBanner>}

      <Rodape>
        {conferencia ? (
          <Button type="button" onClick={() => onIr("conferindo")}>
            Continuar conferência
          </Button>
        ) : (
          <Button type="button" onClick={() => void iniciar()} disabled={acoes.iniciando || resumoQuery.isPending || semCaixa}>
            {acoes.iniciando ? "Iniciando…" : "Iniciar conferência"}
          </Button>
        )}
      </Rodape>
    </Coluna>
  );
}
