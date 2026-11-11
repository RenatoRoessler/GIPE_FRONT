"use client";

import styled, { css, keyframes } from "styled-components";

const entrada = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const Z_TOUR = 1000;

// Tela do tour: acima do menu e dos modais da página. Só os filhos recebem clique.
export const Camada = styled.div`
  position: fixed;
  inset: 0;
  z-index: ${Z_TOUR};
  pointer-events: none;
`;

// Cortina que escurece o que não é o alvo. Bloqueia cliques na página, para o tour não ser pulado sem querer.
export const Cortina = styled.div`
  position: fixed;
  background: rgba(14, 23, 41, 0.62);
  pointer-events: auto;

  @media (prefers-reduced-motion: no-preference) {
    transition:
      top 0.2s ease,
      left 0.2s ease,
      width 0.2s ease,
      height 0.2s ease;
  }
`;

// Contorno do item destacado. Deixa o clique passar quando o item é um link (a pessoa pode abri-lo) e o segura nos demais.
export const Anel = styled.div<{ $interativo: boolean }>`
  position: fixed;
  border-radius: ${({ theme }) => theme.radii.md};
  box-shadow: 0 0 0 3px ${({ theme }) => theme.colors.primary};
  pointer-events: ${({ $interativo }) => ($interativo ? "none" : "auto")};

  @media (prefers-reduced-motion: no-preference) {
    transition:
      top 0.2s ease,
      left 0.2s ease,
      width 0.2s ease,
      height 0.2s ease;
  }
`;

// Balão do passo. Sem alvo visível, fica centrado na tela (boas-vindas, fechamento e módulos fora da barra do celular).
export const Balao = styled.div<{ $centrado: boolean }>`
  position: fixed;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[3]}px;
  width: min(380px, calc(100vw - ${({ theme }) => theme.space[4] * 2}px));
  max-height: calc(100vh - ${({ theme }) => theme.space[4] * 2}px);
  padding: ${({ theme }) => theme.space[4]}px;
  overflow-y: auto;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg};
  background: ${({ theme }) => theme.colors.background};
  box-shadow: ${({ theme }) => theme.shadows.md};
  pointer-events: auto;

  ${({ $centrado }) =>
    $centrado &&
    css`
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
    `}

  @media (prefers-reduced-motion: no-preference) {
    transition:
      top 0.2s ease,
      left 0.2s ease;
  }
`;

export const Cabecalho = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.space[2]}px;
`;

export const Fechar = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: ${({ theme }) => theme.layout.touchTarget};
  height: ${({ theme }) => theme.layout.touchTarget};
  margin: -${({ theme }) => theme.space[2]}px;
  border: none;
  border-radius: ${({ theme }) => theme.radii.full};
  background: none;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: ${({ theme }) => theme.fontSizes.lg};
  cursor: pointer;

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.focus};
  }
`;

export const Dica = styled.p`
  margin: 0;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  color: ${({ theme }) => theme.colors.accent};
`;

export const Conteudo = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[3]}px;
`;

export const Progresso = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[2]}px;
`;

export const ProgressoTexto = styled.p`
  margin: 0;
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.textMuted};
`;

// Troca de passo em fade curto; sem animação para quem pede menos movimento.
export const Passo = styled.section`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: ${({ theme }) => theme.space[2]}px;
  padding-top: ${({ theme }) => theme.space[2]}px;

  @media (prefers-reduced-motion: no-preference) {
    animation: ${entrada} 160ms ease-out;
  }
`;

export const Medalhao = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: ${({ theme }) => theme.space[7]}px;
  height: ${({ theme }) => theme.space[7]}px;
  border-radius: ${({ theme }) => theme.radii.full};
  background: ${({ theme }) => theme.colors.primarySoft};
  color: ${({ theme }) => theme.colors.accent};
`;

export const Sobretitulo = styled.p`
  margin: 0;
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  color: ${({ theme }) => theme.colors.textMuted};
`;

export const Titulo = styled.h3`
  margin: 0;
  font-size: ${({ theme }) => theme.fontSizes.lg};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  color: ${({ theme }) => theme.colors.text};
`;

export const Texto = styled.p`
  margin: 0;
  font-size: ${({ theme }) => theme.fontSizes.md};
  line-height: 1.5;
  color: ${({ theme }) => theme.colors.text};
`;

export const Onde = styled.p`
  margin: 0;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textMuted};
`;

// No celular: navegação em cima e saídas embaixo; no computador, uma linha com as saídas à esquerda.
export const Rodape = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[2]}px;
  width: 100%;

  @media (min-width: ${({ theme }) => theme.breakpoints.md}) {
    flex-direction: row-reverse;
    align-items: center;
    justify-content: space-between;
  }
`;

// Cada grupo de botões divide a linha no celular e encolhe ao tamanho do conteúdo no computador.
const grupo = css`
  display: flex;
  gap: ${({ theme }) => theme.space[2]}px;

  & > * {
    flex: 1;
  }

  @media (min-width: ${({ theme }) => theme.breakpoints.md}) {
    & > * {
      flex: none;
    }
  }
`;

export const Navegacao = styled.div`
  ${grupo}
`;

export const Saidas = styled.div`
  ${grupo}
`;
