"use client";

import { useId, useMemo, useState } from "react";
import { formatDate, formatTime } from "@/components/caixa/format";
import { BackButton } from "@/components/ui/BackButton";
import { Button } from "@/components/ui/Button";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { InfoCard } from "@/components/ui/InfoCard";
import { formatPlacaExibicao } from "@/lib/placa";
import { OBSERVACAO_MAX } from "@/lib/schemas/conferenciaPatio";
import { Cabecalho, Coluna, Rodape, Rotulo, Secao, Titulo, Titulos } from "../Conferencia.styles";
import { calcularTotais, duracaoEntre } from "../conferencia";
import type { EtapaProps } from "../tipos";
import {
  Ajuste,
  Ajustes,
  AvisoBotao,
  CampoObservacao,
  Contador,
  Destaque,
  Icone,
  Numero,
  Numeros,
  Observacao,
  Periodo,
  SemAjustes,
} from "./ConferenciaResumo.styles";

const MENSAGEM_ERRO = "Não foi possível finalizar a conferência. Tente de novo.";

// A observação digitada sobrevive a um recarregamento da página; guardada só por conferência e apagada ao finalizar.
const chaveObservacao = (conferenciaId: number) => `conferencia-patio:observacao:${conferenciaId}`;

function lerObservacao(conferenciaId: number): string {
  try {
    return window.sessionStorage.getItem(chaveObservacao(conferenciaId)) ?? "";
  } catch {
    return "";
  }
}

function guardarObservacao(conferenciaId: number, texto: string) {
  try {
    if (texto === "") {
      window.sessionStorage.removeItem(chaveObservacao(conferenciaId));
    } else {
      window.sessionStorage.setItem(chaveObservacao(conferenciaId), texto);
    }
  } catch {
    // Sem armazenamento (janela privada, dados bloqueados): a observação só vale nesta tela.
  }
}

const iconeProps = { width: 30, height: 30, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2.4, strokeLinecap: "round", strokeLinejoin: "round" } as const;

export function ConferenciaResumo({ conferencia, acoes, onIr, onMensagem }: EtapaProps) {
  const observacaoId = useId();
  const [agora] = useState(() => new Date());
  const [observacao, setObservacao] = useState(() => lerObservacao(conferencia.patioConferenciaId));
  const [erro, setErro] = useState<string | null>(null);

  const totais = useMemo(() => calcularTotais(conferencia), [conferencia]);
  const completo = totais.divergencias === 0 && totais.faltam === 0;
  const excedeu = observacao.length > OBSERVACAO_MAX;
  const fim = agora.toISOString();

  function mudarObservacao(texto: string) {
    setObservacao(texto);
    guardarObservacao(conferencia.patioConferenciaId, texto);
  }

  async function finalizar() {
    setErro(null);
    try {
      await acoes.finalizar(observacao.trim() || undefined);
    } catch (error) {
      setErro(error instanceof Error && error.message ? error.message : MENSAGEM_ERRO);
      return;
    }
    // A conferência deixou de estar aberta: a página volta sozinha ao início.
    guardarObservacao(conferencia.patioConferenciaId, "");
    onMensagem(`Conferência finalizada · ${totais.conferidos} de ${totais.total} conferidos`);
  }

  return (
    <Coluna>
      <BackButton onClick={() => onIr("conferindo")} aria-label="Voltar para a conferência">
        Voltar
      </BackButton>

      <Destaque>
        <Icone $tom={completo ? "success" : "danger"} aria-hidden="true">
          {completo ? (
            <svg {...iconeProps}>
              <path d="m5 12.5 4.5 4.5L19 7.5" />
            </svg>
          ) : (
            <svg {...iconeProps}>
              <circle cx="12" cy="12" r="9" />
              <path d="M12 8v5M12 16h.01" />
            </svg>
          )}
        </Icone>
        <Rotulo>Resumo da conferência</Rotulo>
        <Cabecalho>
          <Titulos>
            <Titulo>{completo ? "Pátio conferido" : "Quase lá"}</Titulo>
          </Titulos>
        </Cabecalho>
        <Periodo>
          {formatDate(conferencia.dataInicio).slice(0, 5)} · {formatTime(conferencia.dataInicio)} às {formatTime(fim)} · {duracaoEntre(conferencia.dataInicio, fim)}
          {conferencia.usuarioInicio ? ` · ${conferencia.usuarioInicio}` : ""}
        </Periodo>
      </Destaque>

      <Numeros>
        <Numero>
          <dt>no sistema</dt>
          <dd>{totais.total}</dd>
        </Numero>
        <Numero>
          <dt>conferidos</dt>
          <dd>{totais.conferidos}</dd>
        </Numero>
        <Numero>
          <dt>ajustes feitos</dt>
          <dd>{totais.ajustes}</dd>
        </Numero>
      </Numeros>

      {totais.faltam > 0 && (
        <InfoCard title={`${totais.faltam === 1 ? "Falta 1 carro" : `Faltam ${totais.faltam} carros`}`}>Se finalizar agora, {totais.faltam === 1 ? "ele fica" : "eles ficam"} como não encontrado{totais.faltam === 1 ? "" : "s"}.</InfoCard>
      )}
      {totais.divergencias > 0 && (
        <AvisoBotao type="button" onClick={() => onIr("divergencias")}>
          <span>
            <strong>
              {totais.divergencias} {totais.divergencias === 1 ? "divergência" : "divergências"}
            </strong>{" "}
            sem resolver. Toque para ver.
          </span>
        </AvisoBotao>
      )}

      <Secao aria-labelledby="secao-ajustes">
        <Rotulo id="secao-ajustes">Ajustes</Rotulo>
        {conferencia.ajustes.length > 0 ? (
          <Ajustes>
            {conferencia.ajustes.map((ajuste, indice) => (
              <Ajuste key={`${ajuste.placa ?? "sem-placa"}-${indice}`}>
                {ajuste.placa && <b>{formatPlacaExibicao(ajuste.placa)}</b>}
                <span>{ajuste.descricao}</span>
              </Ajuste>
            ))}
          </Ajustes>
        ) : (
          <SemAjustes>Nenhum ajuste nesta conferência.</SemAjustes>
        )}
      </Secao>

      <CampoObservacao>
        <label htmlFor={observacaoId}>Observação (opcional)</label>
        <Observacao
          id={observacaoId}
          rows={3}
          value={observacao}
          onChange={(event) => mudarObservacao(event.target.value)}
          placeholder="Ex.: Kwid saiu na troca de turno, avisar a gerência."
          aria-invalid={excedeu}
          aria-describedby={`${observacaoId}-contador`}
          $erro={excedeu}
          disabled={acoes.finalizando}
        />
        <Contador id={`${observacaoId}-contador`} $acima={excedeu}>
          {observacao.length}/{OBSERVACAO_MAX}
        </Contador>
      </CampoObservacao>

      {erro && <ErrorBanner role="alert">{erro}</ErrorBanner>}

      <Rodape>
        <Button type="button" onClick={() => void finalizar()} disabled={acoes.finalizando || excedeu}>
          {acoes.finalizando ? "Finalizando…" : "Finalizar conferência"}
        </Button>
      </Rodape>
    </Coluna>
  );
}
