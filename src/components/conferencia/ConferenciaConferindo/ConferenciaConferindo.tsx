"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { BackButton } from "@/components/ui/BackButton";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { formatPlacaExibicao } from "@/lib/placa";
import { METODO_CONFERENCIA, ORIGEM_ITEM, RESULTADO_LEITURA, type FiltroLista, type ItemConferencia, type SituacaoMarcacao } from "@/types/conferenciaPatio";
import { Cabecalho, Rotulo, Titulo, Titulos } from "../Conferencia.styles";
import { calcularTotais, filtrarItens, ordenarItens, pctProgresso } from "../conferencia";
import { ConferenciaItem } from "../ConferenciaItem";
import { DigitarPlacaModal } from "../DigitarPlacaModal";
import { RegistrarEntradaConferenciaModal } from "../RegistrarEntradaConferenciaModal";
import type { EtapaProps } from "../tipos";
import { VisorPlacas } from "../VisorPlacas";
import { Acoes, Filtro, Filtros, Itens, Lista, ListaVazia, Painel, Percentual, Progresso, ProgressoLinha, ProgressoTexto, Tela, Topo } from "./ConferenciaConferindo.styles";

const MENSAGEM_VAZIA: Record<FiltroLista, string> = {
  faltam: "Nenhum carro faltando. Pode ver o resumo.",
  conferidos: "Nenhum carro conferido ainda.",
};

export function ConferenciaConferindo({ conferencia, acoes, onIr, onMensagem }: EtapaProps) {
  const [filtro, setFiltro] = useState<FiltroLista>("faltam");
  const [digitando, setDigitando] = useState(false);
  const [placaEntrada, setPlacaEntrada] = useState<string | null>(null);
  const listaRef = useRef<HTMLUListElement>(null);
  const vaziaRef = useRef<HTMLParagraphElement>(null);
  // Posição do item que acabou de sair da lista: o foco vai para quem ocupa o lugar dele.
  const focoNaPosicao = useRef<number | null>(null);

  const totais = useMemo(() => calcularTotais(conferencia), [conferencia]);
  const visiveis = useMemo(() => ordenarItens(filtrarItens(conferencia.itens, filtro), filtro), [conferencia.itens, filtro]);
  const camera = conferencia.metodo === METODO_CONFERENCIA.Camera;
  const { marcar, ler } = acoes;

  // Depois de uma marcação o item muda de lista: o foco não pode ficar num botão que deixou de existir.
  useEffect(() => {
    const posicao = focoNaPosicao.current;
    if (posicao === null) {
      return;
    }
    focoNaPosicao.current = null;
    const itens = Array.from(listaRef.current?.querySelectorAll<HTMLElement>("li") ?? []);
    const alvo = itens[Math.min(posicao, itens.length - 1)]?.querySelector<HTMLElement>("button:not(:disabled)");
    (alvo ?? vaziaRef.current)?.focus();
  }, [visiveis]);

  async function aoMarcar(item: ItemConferencia, situacao: SituacaoMarcacao) {
    const posicao = visiveis.findIndex((atual) => atual.patioConferenciaItemId === item.patioConferenciaItemId);
    try {
      await marcar(item.patioConferenciaItemId, situacao);
      focoNaPosicao.current = posicao;
    } catch (error) {
      onMensagem(error instanceof Error && error.message ? error.message : "Não foi possível marcar o veículo. Tente de novo.", "error");
    }
  }

  // A câmera chama sem esperar; a falha já aparece como aviso pelo hook de ações.
  function aoLerPlaca(placa: string) {
    void ler(placa, ORIGEM_ITEM.Camera).catch(() => undefined);
  }

  async function conferirDigitada(placa: string) {
    const leitura = await ler(placa, ORIGEM_ITEM.Manual);
    if (leitura === null) {
      return;
    }
    const exibida = formatPlacaExibicao(placa);
    if (leitura.resultado === RESULTADO_LEITURA.Conferido) {
      onMensagem(`${exibida} conferido.`);
    } else if (leitura.resultado === RESULTADO_LEITURA.JaConferido) {
      onMensagem(`${exibida} já estava conferido.`);
    } else {
      onMensagem(`${exibida} está sem entrada. Resolva em Divergências.`, "error");
    }
  }

  const semPendentes = totais.faltam === 0;
  const principal =
    semPendentes && totais.divergencias > 0 ? (
      <Button type="button" onClick={() => onIr("divergencias")}>
        Resolver divergências
      </Button>
    ) : (
      <Button type="button" onClick={() => onIr("resumo")}>
        Ver resumo
      </Button>
    );

  const filtros: Array<{ id: FiltroLista; texto: string; total: number }> = [
    { id: "faltam", texto: "Faltam", total: totais.faltam },
    { id: "conferidos", texto: "Conferidos", total: totais.conferidos },
  ];

  return (
    <Tela>
      <Topo>
        <BackButton onClick={() => onIr("inicio")} aria-label="Voltar (a conferência fica salva)">
          Voltar
        </BackButton>
        <Cabecalho>
          <Titulos>
            <Titulo>Conferindo pátio</Titulo>
            <Rotulo>Salvo a cada placa</Rotulo>
          </Titulos>
        </Cabecalho>
      </Topo>

      <Painel>
        <Progresso>
          <ProgressoLinha>
            <ProgressoTexto role="status">
              {totais.conferidos} de {totais.total} conferidos
            </ProgressoTexto>
            <Percentual aria-hidden="true">{pctProgresso(totais.conferidos, totais.total)}%</Percentual>
          </ProgressoLinha>
          <ProgressBar value={totais.conferidos} max={totais.total} aria-label="Progresso da conferência" />
        </Progresso>

        {camera && (
          <VisorPlacas
            ativo={!digitando && placaEntrada === null}
            onPlaca={aoLerPlaca}
            ultimaLeitura={acoes.ultimaLeitura}
            onRegistrarEntrada={setPlacaEntrada}
            onDigitar={() => setDigitando(true)}
          />
        )}
      </Painel>

      <Lista>
        <Filtros role="group" aria-label="Filtrar veículos">
          {filtros.map((opcao) => (
            <Filtro key={opcao.id} type="button" aria-pressed={filtro === opcao.id} onClick={() => setFiltro(opcao.id)}>
              {opcao.texto} {opcao.total}
            </Filtro>
          ))}
          {totais.divergencias > 0 && (
            <Filtro type="button" $alerta aria-pressed={false} onClick={() => onIr("divergencias")}>
              Divergências {totais.divergencias}
            </Filtro>
          )}
        </Filtros>

        {visiveis.length > 0 ? (
          <Itens ref={listaRef} aria-label="Veículos">
            {visiveis.map((item) => (
              <ConferenciaItem key={item.patioConferenciaItemId} item={item} ocupado={acoes.marcando} onMarcar={aoMarcar} />
            ))}
          </Itens>
        ) : (
          <ListaVazia ref={vaziaRef} tabIndex={-1}>
            {MENSAGEM_VAZIA[filtro]}
          </ListaVazia>
        )}
      </Lista>

      <Acoes>
        {principal}
        <Button type="button" variant="secondary" onClick={() => setDigitando(true)}>
          Digitar placa
        </Button>
      </Acoes>

      {digitando && <DigitarPlacaModal onConferir={conferirDigitada} onClose={() => setDigitando(false)} />}
      {placaEntrada !== null && (
        <RegistrarEntradaConferenciaModal
          conferenciaId={conferencia.patioConferenciaId}
          placa={placaEntrada}
          onClose={() => setPlacaEntrada(null)}
          onRegistrada={onMensagem}
        />
      )}
    </Tela>
  );
}
