"use client";

import { Apoio, Botao, Dot, List, Textos, Titulo, type EstadoEtapa } from "./PrecoEtapasNav.styles";

export type { EstadoEtapa };

export interface EtapaNav {
  titulo: string;
  apoio: string;
  // Completa e pendência vêm da validação dos dados; a etapa atual é indicada por `atual`.
  estado: Exclude<EstadoEtapa, "atual">;
}

export interface PrecoEtapasNavProps {
  etapas: EtapaNav[];
  // Número da etapa aberta (começa em 1).
  atual: number;
  onSelect: (etapa: number) => void;
  label?: string;
}

const ESTADO_TEXTO: Record<Exclude<EstadoEtapa, "atual">, string> = {
  completa: "completa",
  pendencia: "com pendência",
  neutra: "não preenchida",
};

const MARCA: Record<Exclude<EstadoEtapa, "atual">, string | null> = {
  completa: "✓",
  pendencia: "!",
  neutra: null,
};

// Navegação das etapas do cadastro: qualquer etapa pode ser aberta a qualquer momento.
// O estado é dito em texto no nome acessível, não só pela cor ou pela marca.
export function PrecoEtapasNav({ etapas, atual, onSelect, label = "Etapas do cadastro" }: PrecoEtapasNavProps) {
  return (
    <nav aria-label={label}>
      <List>
        {etapas.map((etapa, index) => {
          const numero = index + 1;
          const isAtual = numero === atual;
          const marca = MARCA[etapa.estado];
          return (
            <li key={etapa.titulo}>
              <Botao
                type="button"
                $atual={isAtual}
                aria-current={isAtual ? "step" : undefined}
                aria-label={`Etapa ${numero}: ${etapa.titulo}, ${ESTADO_TEXTO[etapa.estado]}`}
                onClick={() => onSelect(numero)}
              >
                <Dot $estado={etapa.estado} $atual={isAtual} aria-hidden="true">
                  {marca ?? numero}
                </Dot>
                <Textos>
                  <Titulo>{etapa.titulo}</Titulo>
                  <Apoio>{etapa.apoio}</Apoio>
                </Textos>
              </Botao>
            </li>
          );
        })}
      </List>
    </nav>
  );
}
