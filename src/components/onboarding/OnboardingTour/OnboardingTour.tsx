"use client";

import { useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent } from "react";
import { NavIcon } from "@/components/layout/NavIcons";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";
import type { Passo as PassoTour } from "../passos";
import {
  Anel,
  Balao,
  Cabecalho,
  Camada,
  Conteudo,
  Cortina,
  Dica,
  Fechar,
  Medalhao,
  Navegacao,
  Onde,
  Passo,
  Progresso,
  ProgressoTexto,
  Rodape,
  Saidas,
  Sobretitulo,
  Texto,
  Titulo,
} from "./OnboardingTour.styles";
import { calcularPosicao, type Tamanho } from "./posicao";
import { useAlvoTour } from "./useAlvoTour";

// No primeiro acesso a pessoa pode pedir para não ver mais; ao repetir o tour isso não faz sentido.
export type ModoTour = "primeiro-acesso" | "repeticao";

export interface OnboardingTourProps {
  passos: PassoTour[];
  modo: ModoTour;
  // Registrando "Não mostrar mais" ou a conclusão: trava os botões até o back responder.
  registrando?: boolean;
  // Fecha sem registrar: botão Sair, "×" e Esc.
  onSair: () => void;
  onNaoMostrarMais: () => void;
  onConcluir: () => void;
}

// Folga do destaque em volta do item do menu.
const RESPIRO = 4;

// Tour interativo: cada módulo é destacado no próprio menu (o item tem `data-tour-id` igual ao id do passo) e o balão fica ao
// lado dele. Links do menu podem ser abertos com o tour aberto; ao abrir, o tour segue para o passo seguinte. Passos sem item
// visível (boas-vindas, fechamento, módulos que ficam no "Mais" do celular) usam um balão centrado.
export function OnboardingTour({ passos, modo, registrando = false, onSair, onNaoMostrarMais, onConcluir }: OnboardingTourProps) {
  const [indice, setIndice] = useState(0);
  const [tamanhoBalao, setTamanhoBalao] = useState<Tamanho | null>(null);
  const [janela, setJanela] = useState<Tamanho>({ width: 0, height: 0 });
  const balaoRef = useRef<HTMLDivElement>(null);
  const avancarRef = useRef<HTMLButtonElement>(null);

  const passo = passos[indice];
  const primeiro = indice === 0;
  const ultimo = indice === passos.length - 1;
  const alvo = useAlvoTour(passo.icone ? passo.id : undefined);
  // Itens de ação (Entrada e Saída) abrem um modal por cima do tour: só os links são clicáveis.
  const alvoEhLink = passo.id.startsWith("/");

  const modulos = passos.filter((candidato) => candidato.icone);
  const posicaoModulo = passo.icone ? modulos.indexOf(passo) + 1 : 0;

  function avancar() {
    if (ultimo) {
      onConcluir();
    } else {
      setIndice(indice + 1);
    }
  }

  function voltar() {
    setIndice((atual) => Math.max(0, atual - 1));
  }

  // Esc equivale a Sair, como no "×". O tour não é modal, então o ouvinte fica no documento.
  useEffect(() => {
    function handleEsc(event: globalThis.KeyboardEvent) {
      if (event.key === "Escape" && !registrando) onSair();
    }
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [onSair, registrando]);

  // Abrir o módulo destacado conta como avançar; o clique segue para o link normalmente.
  const elementoAlvo = alvo?.elemento;
  useEffect(() => {
    if (!elementoAlvo || !alvoEhLink) return;
    const seguir = () => setIndice((atual) => Math.min(atual + 1, passos.length - 1));
    elementoAlvo.addEventListener("click", seguir);
    return () => elementoAlvo.removeEventListener("click", seguir);
  }, [elementoAlvo, alvoEhLink, passos.length]);

  // O foco acompanha o passo: em Avançar, que é onde a pessoa continua.
  useEffect(() => {
    avancarRef.current?.focus({ preventScroll: true });
  }, [indice]);

  useLayoutEffect(() => {
    const balao = balaoRef.current;
    if (!balao) return;
    const medidas = { width: balao.offsetWidth, height: balao.offsetHeight };
    setTamanhoBalao((atual) => (atual && atual.width === medidas.width && atual.height === medidas.height ? atual : medidas));
    setJanela((atual) => (atual.width === window.innerWidth && atual.height === window.innerHeight ? atual : { width: window.innerWidth, height: window.innerHeight }));
    // O balão muda de altura com o texto do passo e com a Dica de quando há alvo.
  }, [indice, elementoAlvo]);

  useEffect(() => {
    function handleResize() {
      setJanela({ width: window.innerWidth, height: window.innerHeight });
    }
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // As setas navegam enquanto o foco está no balão.
  function handleKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (registrando) return;
    if (event.key === "ArrowRight" && !ultimo) setIndice(indice + 1);
    if (event.key === "ArrowLeft" && !primeiro) voltar();
  }

  const destaque = alvo && {
    top: alvo.retangulo.top - RESPIRO,
    left: alvo.retangulo.left - RESPIRO,
    width: alvo.retangulo.width + RESPIRO * 2,
    height: alvo.retangulo.height + RESPIRO * 2,
  };
  const posicao = alvo && tamanhoBalao ? calcularPosicao(alvo.retangulo, tamanhoBalao, janela) : null;

  return (
    <Camada>
      {destaque ? (
        <>
          <Cortina style={{ top: 0, left: 0, right: 0, height: Math.max(0, destaque.top) }} />
          <Cortina style={{ top: destaque.top + destaque.height, left: 0, right: 0, bottom: 0 }} />
          <Cortina style={{ top: destaque.top, left: 0, width: Math.max(0, destaque.left), height: destaque.height }} />
          <Cortina style={{ top: destaque.top, left: destaque.left + destaque.width, right: 0, height: destaque.height }} />
          <Anel $interativo={alvoEhLink} style={destaque} />
        </>
      ) : (
        <Cortina style={{ inset: 0 }} />
      )}

      <Balao
        ref={balaoRef}
        role="dialog"
        aria-modal="false"
        aria-label="Tour de boas-vindas"
        $centrado={!posicao}
        style={posicao ? { top: posicao.top, left: posicao.left } : undefined}
        onKeyDown={handleKeyDown}
      >
        <Cabecalho>
          <Progresso style={{ flex: 1 }}>
            <ProgressBar value={indice + 1} max={passos.length} aria-label="Progresso do tour" />
            <ProgressoTexto>
              Passo {indice + 1} de {passos.length}
            </ProgressoTexto>
          </Progresso>
          <Fechar type="button" aria-label="Fechar" onClick={onSair} disabled={registrando}>
            ×
          </Fechar>
        </Cabecalho>

        <Conteudo>
          <div aria-live="polite">
            <Passo key={passo.id}>
              {passo.icone && (
                <Medalhao aria-hidden="true">
                  <NavIcon id={passo.icone} width={32} height={32} />
                </Medalhao>
              )}
              {posicaoModulo > 0 && (
                <Sobretitulo>
                  Módulo {posicaoModulo} de {modulos.length}
                </Sobretitulo>
              )}
              <Titulo>{passo.titulo}</Titulo>
              <Texto>{passo.texto}</Texto>
              {passo.onde && !alvo && <Onde>{passo.onde}</Onde>}
              {alvo && alvoEhLink && <Dica>Toque no item destacado para abrir {passo.titulo}; o tour continua.</Dica>}
            </Passo>
          </div>
        </Conteudo>

        <Rodape>
          <Navegacao>
            {!primeiro && (
              <Button type="button" variant="secondary" onClick={voltar} disabled={registrando}>
                Voltar
              </Button>
            )}
            <Button ref={avancarRef} type="button" onClick={avancar} disabled={registrando}>
              {registrando ? "Salvando..." : ultimo ? "Concluir" : "Avançar"}
            </Button>
          </Navegacao>
          <Saidas>
            <Button type="button" variant="secondary" onClick={onSair} disabled={registrando}>
              Sair
            </Button>
            {modo === "primeiro-acesso" && (
              <Button type="button" variant="secondary" onClick={onNaoMostrarMais} disabled={registrando}>
                Não mostrar mais
              </Button>
            )}
          </Saidas>
        </Rodape>
      </Balao>
    </Camada>
  );
}
