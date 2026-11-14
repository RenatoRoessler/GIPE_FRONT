"use client";

import styled from "styled-components";
import { amarelo, fg2 } from "./Catalogo.styles";

export const Veu = styled.div<{ $centro: boolean }>`
  position: fixed;
  inset: 0;
  z-index: 70;
  display: flex;
  align-items: ${({ $centro }) => ($centro ? "center" : "flex-end")};
  justify-content: center;
  background-color: rgba(10, 17, 31, 0.55);
`;

export const Painel = styled.div<{ $centro: boolean }>`
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: ${({ $centro }) => ($centro ? 480 : 440)}px;
  max-height: 92vh;
  overflow-y: auto;
  background-color: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.text};
  ${({ $centro }) =>
    $centro
      ? "gap: 12px; padding: 20px; border-radius: 20px;"
      : "gap: 16px; padding: 10px max(16px, env(safe-area-inset-right, 0px)) calc(16px + env(safe-area-inset-bottom, 0px)) max(16px, env(safe-area-inset-left, 0px)); border-radius: 24px 24px 0 0;"}

  @media (prefers-reduced-motion: no-preference) {
    animation: sobe 0.22s ease-out;
  }

  @keyframes sobe {
    from {
      transform: translateY(30px);
    }
  }

  &:focus {
    outline: none;
  }
`;

export const Alca = styled.span`
  align-self: center;
  width: 44px;
  height: 5px;
  border-radius: 3px;
  background-color: ${({ theme }) => theme.colors.border};
`;

export const TituloDaFolha = styled.h3`
  margin: 0;
  font-size: 18px;
  font-weight: 800;
`;

export const TextoDaFolha = styled.p`
  margin: 0;
  color: ${fg2};
`;

export const AcoesDaFolha = styled.div`
  display: flex;
  gap: 10px;
  margin-top: 6px;

  button {
    flex: 1;
  }
`;

// Cabeçalho da folha da categoria: ícone, nome e exemplos, e o botão de fechar.
export const CabecalhoDaCategoria = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;

  .cico {
    display: grid;
    flex: none;
    place-items: center;
    width: 44px;
    height: 44px;
    border-radius: 13px;
    background-color: ${({ theme }) => theme.colors.onPrimary};
    color: ${amarelo};

    svg {
      width: 24px;
      height: 24px;
    }
  }

  .nome {
    flex: 1;
  }

  h3 {
    margin: 0;
    font-size: 19px;
    font-weight: 800;
  }

  small {
    display: block;
    color: ${({ theme }) => theme.colors.textMuted};
    font-size: 12.5px;
  }

  .fechar {
    display: grid;
    flex: none;
    place-items: center;
    width: 42px;
    height: 42px;
    border: 0;
    border-radius: 12px;
    background: none;
    color: ${fg2};
    cursor: pointer;

    svg {
      width: 22px;
      height: 22px;
    }
  }
`;

export const Faz = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 14px;
  border-radius: 14px;
  background-color: ${({ theme }) => theme.colors.surfaceMuted};
  font-weight: 700;
`;

export const InterruptorGrande = styled.button`
  position: relative;
  flex: none;
  width: 52px;
  height: 30px;
  padding: 0;
  border: 0;
  border-radius: 999px;
  background-color: ${({ theme }) => theme.colors.border};
  cursor: pointer;

  &::after {
    content: "";
    position: absolute;
    top: 3px;
    left: 3px;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background-color: #fff;
    box-shadow: 0 1px 3px rgba(14, 23, 41, 0.3);
    transition: left 0.15s;
  }

  &[aria-checked="true"] {
    background-color: ${({ theme }) => theme.colors.success};
  }

  &[aria-checked="true"]::after {
    left: 25px;
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.focus};
    outline-offset: 2px;
  }
`;

// O valor em tamanho de destaque: "R$" pequeno e o número grande, sublinhado que fica amarelo no foco.
export const Valor = styled.div`
  display: flex;
  align-items: baseline;
  gap: 6px;
  padding: 4px 0 8px;
  border-bottom: 2px solid ${({ theme }) => theme.colors.border};

  &:focus-within {
    border-color: ${({ theme }) => theme.colors.accent};
  }

  span {
    color: ${({ theme }) => theme.colors.textMuted};
    font-size: 20px;
    font-weight: 800;
  }

  input {
    flex: 1;
    width: 100%;
    min-width: 0;
    border: 0;
    outline: none;
    background: none;
    color: inherit;
    font: inherit;
    font-size: 38px;
    font-weight: 800;
    font-variant-numeric: tabular-nums;
    letter-spacing: -1px;
  }
`;

export const Outro = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 12.5px;

  input {
    width: 110px;
    height: 42px;
    padding: 0 14px;
    border: 1.5px solid ${({ theme }) => theme.colors.border};
    border-radius: 14px;
    outline: none;
    background-color: ${({ theme }) => theme.colors.surface};
    color: ${({ theme }) => theme.colors.text};
    font: inherit;
    font-size: 16px;
    font-variant-numeric: tabular-nums;

    &:focus {
      border-color: ${({ theme }) => theme.colors.accent};
    }
  }
`;

export const Marcar = styled.label`
  display: flex;
  align-items: center;
  gap: 10px;
  color: ${fg2};
  font-size: 14px;
  font-weight: 600;

  input {
    width: 20px;
    height: 20px;
    accent-color: ${({ theme }) => theme.colors.accent};
  }
`;
