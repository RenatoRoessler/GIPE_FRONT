"use client";

import type { ReactNode } from "react";
import {
  Acoes,
  Apoio,
  ItemBotao,
  Lista,
  Marca,
  Navegacao,
  Painel,
  Progresso,
  Segmento,
  Status,
  Textos,
  Titulo,
  Trilho,
} from "./PainelCadastro.styles";

export type EstadoSecao = "pronta" | "pendente" | "erro";

export interface SecaoPainel {
  // id do elemento da seção no formulário (alvo da rolagem).
  id: string;
  titulo: string;
  estado: EstadoSecao;
}

export interface PainelCadastroProps {
  secoes: SecaoPainel[];
  onSelect: (id: string) => void;
  // Substitui a contagem de seções prontas (ex.: "Alterações não salvas" na edição).
  status?: string;
  // Botões do formulário; o último é o principal.
  children: ReactNode;
}

const APOIO: Record<EstadoSecao, string> = {
  pronta: "Pronta",
  pendente: "Falta preencher",
  erro: "Há campos para corrigir",
};

function MarcaIcone({ estado }: { estado: EstadoSecao }) {
  if (estado === "pendente") return null;
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {estado === "pronta" ? <path d="m5 12.5 4.5 4.5L19 7.5" /> : <path d="M12 6v7M12 18h.01" />}
    </svg>
  );
}

// Painel de conclusão dos formulários de cadastro: progresso por seção, atalho para cada uma e as ações.
// Em telas grandes fica fixo ao lado do formulário; no celular e no tablet vira uma barra fixa acima da navegação.
export function PainelCadastro({ secoes, onSelect, status, children }: PainelCadastroProps) {
  const prontas = secoes.filter((secao) => secao.estado === "pronta").length;
  const texto = status ?? `${prontas} de ${secoes.length} ${secoes.length === 1 ? "seção pronta" : "seções prontas"}`;

  return (
    <Painel aria-label="Conclusão do cadastro">
      <Progresso>
        <Status>{texto}</Status>
        <Trilho aria-hidden="true">
          {secoes.map((secao) => (
            <Segmento key={secao.id} $estado={secao.estado} />
          ))}
        </Trilho>
      </Progresso>

      <Navegacao aria-label="Seções do cadastro">
        <Lista>
          {secoes.map((secao) => (
            <li key={secao.id}>
              <ItemBotao type="button" onClick={() => onSelect(secao.id)}>
                <Marca $estado={secao.estado} aria-hidden="true">
                  <MarcaIcone estado={secao.estado} />
                </Marca>
                <Textos>
                  <Titulo>{secao.titulo}</Titulo>
                  <Apoio $estado={secao.estado}>{APOIO[secao.estado]}</Apoio>
                </Textos>
              </ItemBotao>
            </li>
          ))}
        </Lista>
      </Navegacao>

      <Acoes>{children}</Acoes>
    </Painel>
  );
}

// Rola até a seção (respeitando a preferência por menos movimento) e põe o foco no primeiro controle dela.
export function irParaSecao(id: string) {
  const secao = document.getElementById(id);
  if (!secao) return;
  const reduzir = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
  secao.scrollIntoView?.({
    behavior: reduzir ? "auto" : "smooth",
    block: "start",
  });
  secao.querySelector<HTMLElement>("button, input, select, textarea")?.focus({ preventScroll: true });
}
