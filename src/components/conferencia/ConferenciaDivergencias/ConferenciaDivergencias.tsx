"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { formatTime } from "@/components/caixa/format";
import { BackButton } from "@/components/ui/BackButton";
import { Button } from "@/components/ui/Button";
import { InfoCard } from "@/components/ui/InfoCard";
import { PlateDisplay } from "@/components/ui/PlateDisplay";
import { TipoClienteBadge } from "@/components/ui/TipoClienteBadge";
import { formatPlacaExibicao } from "@/lib/placa";
import { SITUACAO_ITEM, type ItemConferencia } from "@/types/conferenciaPatio";
import { Cabecalho, LadoALado, Rodape, Rotulo, Secao, Titulo, Titulos, Coluna } from "../Conferencia.styles";
import { calcularTotais, duracaoEntre, itensNaoEncontrados, rotuloVeiculo, semEntradaPendentes, tipoDoCliente } from "../conferencia";
import { DarSaidaConferenciaModal } from "../DarSaidaConferenciaModal";
import { Info, Item, Linha, Meta, Nome } from "../ConferenciaItem/ConferenciaItem.styles";
import { RegistrarEntradaConferenciaModal } from "../RegistrarEntradaConferenciaModal";
import type { EtapaProps } from "../tipos";
import { Lista, SemDivergencias, Subtitulo } from "./ConferenciaDivergencias.styles";

const MENSAGEM_ERRO = "Não foi possível concluir. Tente de novo.";

export function ConferenciaDivergencias({ conferencia, acoes, onIr, onMensagem }: EtapaProps) {
  const [agora] = useState(() => new Date());
  const [itemSaida, setItemSaida] = useState<ItemConferencia | null>(null);
  const [placaEntrada, setPlacaEntrada] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const raizRef = useRef<HTMLDivElement>(null);
  const resumoRef = useRef<HTMLButtonElement>(null);
  // Posição, entre todos os cartões, do que acabou de ser resolvido: o foco vai para quem ocupa o lugar.
  const focoNaPosicao = useRef<number | null>(null);

  const totais = useMemo(() => calcularTotais(conferencia), [conferencia]);
  const naoEncontrados = useMemo(() => itensNaoEncontrados(conferencia), [conferencia]);
  const semEntrada = useMemo(() => semEntradaPendentes(conferencia), [conferencia]);

  useEffect(() => {
    const posicao = focoNaPosicao.current;
    if (posicao === null) {
      return;
    }
    focoNaPosicao.current = null;
    const cartoes = Array.from(raizRef.current?.querySelectorAll<HTMLElement>("li[data-divergencia]") ?? []);
    const alvo = cartoes[Math.min(posicao, cartoes.length - 1)]?.querySelector<HTMLElement>("button:not(:disabled)");
    (alvo ?? resumoRef.current)?.focus();
  }, [naoEncontrados, semEntrada]);

  function posicaoDe(elemento: HTMLElement | null): number {
    const cartoes = Array.from(raizRef.current?.querySelectorAll("li[data-divergencia]") ?? []);
    const cartao = elemento?.closest("li[data-divergencia]");
    return cartao ? cartoes.indexOf(cartao) : 0;
  }

  async function executar(origem: HTMLElement, acao: () => Promise<unknown>) {
    const posicao = posicaoDe(origem);
    setOcupado(true);
    try {
      await acao();
      focoNaPosicao.current = posicao;
    } catch (error) {
      onMensagem(error instanceof Error && error.message ? error.message : MENSAGEM_ERRO, "error");
    } finally {
      setOcupado(false);
    }
  }

  const temDivergencias = totais.divergencias > 0;

  return (
    <Coluna ref={raizRef}>
      <BackButton onClick={() => onIr("conferindo")} aria-label="Voltar para a conferência">
        Voltar
      </BackButton>
      <Cabecalho>
        <Titulos>
          <Titulo>Divergências</Titulo>
          <Subtitulo $tom={temDivergencias ? "danger" : "success"}>{temDivergencias ? `${totais.divergencias} para resolver` : "Tudo resolvido"}</Subtitulo>
        </Titulos>
      </Cabecalho>

      {!temDivergencias && <SemDivergencias>Nenhuma divergência. O pátio bate com o sistema.</SemDivergencias>}

      {naoEncontrados.length > 0 && (
        <Secao aria-labelledby="secao-nao-encontrados">
          <Rotulo id="secao-nao-encontrados">No sistema, não está no pátio</Rotulo>
          <Lista>
            {naoEncontrados.map((item) => {
              const placa = formatPlacaExibicao(item.placa);
              return (
                <Item key={item.patioConferenciaItemId} data-divergencia="">
                  <Linha>
                    <PlateDisplay value={item.placa} size="sm" />
                    <Info>
                      <Nome title={rotuloVeiculo(item)}>{rotuloVeiculo(item)}</Nome>
                      <Meta>
                        Entrada {formatTime(item.dataEntrada)} · {duracaoEntre(item.dataEntrada, agora.toISOString())} no sistema
                      </Meta>
                    </Info>
                    <TipoClienteBadge tipo={tipoDoCliente(item)} />
                  </Linha>
                  {item.conveniado && (
                    <InfoCard title="Conveniado">O valor da saída vai para a fatura da conveniada. Confira o horário antes de dar baixa.</InfoCard>
                  )}
                  <LadoALado>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      disabled={ocupado}
                      aria-label={`Procurar de novo: ${placa}`}
                      onClick={(event) => void executar(event.currentTarget, () => acoes.marcar(item.patioConferenciaItemId, SITUACAO_ITEM.Pendente))}
                    >
                      Procurar de novo
                    </Button>
                    <Button type="button" variant="secondary" size="sm" disabled={ocupado} aria-label={`Dar saída: ${placa}`} onClick={() => setItemSaida(item)}>
                      Dar saída
                    </Button>
                  </LadoALado>
                </Item>
              );
            })}
          </Lista>
        </Secao>
      )}

      {semEntrada.length > 0 && (
        <Secao aria-labelledby="secao-sem-entrada">
          <Rotulo id="secao-sem-entrada">No pátio, sem entrada</Rotulo>
          <Lista>
            {semEntrada.map((linha) => {
              const placa = formatPlacaExibicao(linha.placa);
              return (
                <Item key={linha.placa} data-divergencia="">
                  <Linha>
                    <PlateDisplay value={linha.placa} size="sm" />
                    <Info>
                      <Nome>Sem ticket aberto</Nome>
                      <Meta>Lida às {formatTime(linha.dataLeitura)}</Meta>
                    </Info>
                  </Linha>
                  <LadoALado>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      disabled={ocupado}
                      aria-label={`Leitura errada: ${placa}`}
                      onClick={(event) => void executar(event.currentTarget, () => acoes.descartar(linha.placa))}
                    >
                      Leitura errada
                    </Button>
                    <Button type="button" variant="secondary" size="sm" disabled={ocupado} aria-label={`Registrar entrada: ${placa}`} onClick={() => setPlacaEntrada(linha.placa)}>
                      Registrar entrada
                    </Button>
                  </LadoALado>
                </Item>
              );
            })}
          </Lista>
        </Secao>
      )}

      <Rodape>
        <Button ref={resumoRef} type="button" onClick={() => onIr("resumo")}>
          Ver resumo
        </Button>
      </Rodape>

      {itemSaida && (
        <DarSaidaConferenciaModal
          conferenciaId={conferencia.patioConferenciaId}
          item={itemSaida}
          onClose={() => setItemSaida(null)}
          onConcluida={onMensagem}
        />
      )}
      {placaEntrada !== null && (
        <RegistrarEntradaConferenciaModal
          conferenciaId={conferencia.patioConferenciaId}
          placa={placaEntrada}
          onClose={() => setPlacaEntrada(null)}
          onRegistrada={onMensagem}
        />
      )}
    </Coluna>
  );
}
