"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { Logo } from "@/components/ui/Logo";
import { Skeleton } from "@/components/ui/Skeleton";
import { consultarContratoCliente, ContratoError } from "@/lib/api/services/contrato";
import type { AceiteContrato, ContratoCliente } from "@/types/contrato";
import { CONTRATO_STATUS } from "@/types/mensalista";
import {
  Column,
  Eyebrow,
  Fecho,
  Folha,
  Header,
  LogoBox,
  Meta,
  PrintStyles,
  ProgressBar,
  ProgressTrack,
  Screen,
  Skeletons,
  SkipLink,
  StatusStrip,
  Texto,
  Title,
} from "../Contrato.styles";
import { ConfirmacaoAceite, type EstadoContrato } from "../ConfirmacaoAceite";
import { ContratoMensagem } from "../ContratoMensagem";
import { formatDataHora } from "../format";
import { SeloAceite } from "../SeloAceite";
import { useReadingProgress } from "../useReadingProgress";

export interface ContratoAceiteProps {
  token: string;
}

const contratoQueryKey = (token: string) => ["contrato-cliente", token] as const;

function Moldura({ children }: { children: ReactNode }) {
  return (
    <Screen data-print-area="">
      <Column>
        <LogoBox data-no-print="">
          <Logo />
        </LogoBox>
        {children}
      </Column>
    </Screen>
  );
}

function Carregando() {
  return (
    <Moldura>
      <Skeletons role="status" aria-busy="true" aria-label="Carregando contrato">
        <Skeleton width="40%" height="12px" />
        <Skeleton width="70%" height="28px" />
        <Skeleton width="55%" height="14px" />
        <Skeleton height="72px" />
        {Array.from({ length: 10 }, (_, index) => (
          <Skeleton key={index} height="16px" width={index % 3 === 2 ? "60%" : "100%"} />
        ))}
      </Skeletons>
    </Moldura>
  );
}

function Falha({ mensagem, onTentarNovamente }: { mensagem: string; onTentarNovamente: () => void }) {
  return (
    <Moldura>
      <ErrorBanner role="alert">{mensagem}</ErrorBanner>
      <Button type="button" variant="secondary" onClick={onTentarNovamente}>
        Tentar novamente
      </Button>
    </Moldura>
  );
}

export function ContratoAceite({ token }: ContratoAceiteProps) {
  const queryClient = useQueryClient();
  const folhaRef = useRef<HTMLElement>(null);
  const [recemAceito, setRecemAceito] = useState(false);
  const [estadoForcado, setEstadoForcado] = useState<"vencido" | "invalido" | null>(null);

  const query = useQuery({
    queryKey: contratoQueryKey(token),
    queryFn: () => consultarContratoCliente(token),
    retry: false,
    refetchOnWindowFocus: false,
  });
  const contrato = query.data;
  const progresso = useReadingProgress(folhaRef, Boolean(contrato));

  function handleAceito(resultado: AceiteContrato) {
    queryClient.setQueryData<ContratoCliente>(contratoQueryKey(token), (atual) =>
      atual
        ? { ...atual, status: CONTRATO_STATUS.Aceito, dataAceite: resultado.dataAceite, hash: resultado.hash || atual.hash }
        : atual,
    );
    setRecemAceito(true);
  }

  function handleEstado(estado: EstadoContrato) {
    if (estado === "ja-aceito") {
      void query.refetch();
      return;
    }
    setEstadoForcado(estado);
  }

  if (estadoForcado) {
    return <ContratoMensagem kind={estadoForcado} />;
  }
  if (query.isPending) {
    return <Carregando />;
  }
  if (query.isError) {
    const kind = query.error instanceof ContratoError ? query.error.contratoKind : null;
    if (kind === "vencido") {
      return <ContratoMensagem kind="vencido" />;
    }
    if (kind === "invalido" || kind === "documento" || kind === "ja-aceito") {
      return <ContratoMensagem kind="invalido" />;
    }
    return (
      <Falha
        mensagem={
          kind === "rate-limited"
            ? "Muitas consultas seguidas. Aguarde um pouco e tente de novo."
            : "Não foi possível abrir o contrato agora. Tente novamente em instantes."
        }
        onTentarNovamente={() => void query.refetch()}
      />
    );
  }
  if (!contrato || contrato.status === CONTRATO_STATUS.Cancelado) {
    return <ContratoMensagem kind="invalido" />;
  }

  const aceito = contrato.status === CONTRATO_STATUS.Aceito;

  return (
    <Moldura>
      <PrintStyles />
      <ProgressTrack aria-hidden="true" data-no-print="">
        {/* O valor muda a cada rolagem: inline evita gerar uma classe CSS por posição. */}
        <ProgressBar style={{ transform: `scaleX(${progresso})` }} />
      </ProgressTrack>

      <Header>
        <Eyebrow>{contrato.razaoSocial}</Eyebrow>
        <Title>{contrato.titulo}</Title>
        <Meta>{`Versão ${contrato.versao} · Para ${contrato.nomeMensalista}`}</Meta>
      </Header>

      <StatusStrip $tone={aceito ? "success" : "info"} data-no-print="">
        {aceito ? (
          <span>{`Contrato aceito em ${formatDataHora(contrato.dataAceite)}.`}</span>
        ) : (
          <>
            <span>
              {contrato.tokenExpiracao
                ? `Leia o contrato e confirme no final. Link válido até ${formatDataHora(contrato.tokenExpiracao)}.`
                : "Leia o contrato e confirme no final."}
            </span>
            <SkipLink href="#confirmacao">Pular para a confirmação</SkipLink>
          </>
        )}
      </StatusStrip>

      <Folha ref={folhaRef} aria-label={contrato.titulo}>
        <Texto>{contrato.conteudo}</Texto>
        <Fecho id="confirmacao" tabIndex={-1} $divisor={!aceito}>
          {aceito ? (
            <SeloAceite dataAceite={contrato.dataAceite} hash={contrato.hash} recemAceito={recemAceito} />
          ) : (
            <ConfirmacaoAceite token={token} hash={contrato.hash} onAceito={handleAceito} onEstado={handleEstado} />
          )}
        </Fecho>
      </Folha>
    </Moldura>
  );
}
