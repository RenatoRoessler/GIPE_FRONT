"use client";

import styled, { css, keyframes, type DefaultTheme } from "styled-components";

export type VisorTom = "neutro" | "lido" | "invalido";

const MIRA = 34;
const MIRA_RECUO = 14;

const varredura = keyframes`
  0% { top: 16px; }
  50% { top: calc(100% - 18px); }
  100% { top: 16px; }
`;

const corDaMira = (tom: VisorTom, theme: DefaultTheme) =>
  tom === "lido" ? theme.colors.success : tom === "invalido" ? theme.colors.danger : theme.colors.warn;

export const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${({ theme }) => theme.space[2]}px;
`;

export const Visor = styled.button<{ $tom: VisorTom }>`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: min(220px, 60vw);
  aspect-ratio: 1;
  padding: 0;
  overflow: hidden;
  border: 1px solid ${({ theme, $tom }) => ($tom === "neutro" ? theme.colors.border : corDaMira($tom, theme))};
  border-radius: ${({ theme }) => theme.radii.lg};
  background-color: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.textMuted};
  cursor: pointer;

  &:focus-visible {
    outline: 3px solid ${({ theme }) => theme.colors.primary};
    outline-offset: 2px;
  }
`;

export const Video = styled.video`
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

export const Mira = styled.span<{ $canto: "tl" | "tr" | "bl" | "br"; $tom: VisorTom }>`
  position: absolute;
  z-index: 2;
  width: ${MIRA}px;
  height: ${MIRA}px;
  border: 4px solid ${({ theme, $tom }) => corDaMira($tom, theme)};
  transition: border-color 0.2s ease;

  ${({ $canto, theme }) => {
    const raio = theme.radii.md;
    switch ($canto) {
      case "tl":
        return css`
          top: ${MIRA_RECUO}px;
          left: ${MIRA_RECUO}px;
          border-right: 0;
          border-bottom: 0;
          border-radius: ${raio} 0 0 0;
        `;
      case "tr":
        return css`
          top: ${MIRA_RECUO}px;
          right: ${MIRA_RECUO}px;
          border-left: 0;
          border-bottom: 0;
          border-radius: 0 ${raio} 0 0;
        `;
      case "bl":
        return css`
          bottom: ${MIRA_RECUO}px;
          left: ${MIRA_RECUO}px;
          border-right: 0;
          border-top: 0;
          border-radius: 0 0 0 ${raio};
        `;
      default:
        return css`
          bottom: ${MIRA_RECUO}px;
          right: ${MIRA_RECUO}px;
          border-left: 0;
          border-top: 0;
          border-radius: 0 0 ${raio} 0;
        `;
    }
  }}
`;

export const Varredura = styled.span`
  position: absolute;
  left: 20px;
  right: 20px;
  z-index: 2;
  height: 2px;
  background-color: ${({ theme }) => theme.colors.warn};
  box-shadow: 0 0 12px ${({ theme }) => theme.colors.warn};
  animation: ${varredura} 2.6s ease-in-out infinite;

  @media (prefers-reduced-motion: reduce) {
    top: 50%;
    animation: none;
  }
`;

export const Mensagem = styled.span`
  position: relative;
  z-index: 2;
  padding: 0 ${({ theme }) => theme.space[5]}px;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  line-height: 1.4;
  text-align: center;
`;

export const Lido = styled.span`
  position: absolute;
  inset: 0;
  z-index: 3;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.space[2]}px;
  background-color: color-mix(in srgb, ${({ theme }) => theme.colors.success} 16%, ${({ theme }) => theme.colors.background});
  color: ${({ theme }) => theme.colors.text};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
`;

export const Check = styled.span`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 58px;
  height: 58px;
  border-radius: ${({ theme }) => theme.radii.full};
  background-color: ${({ theme }) => theme.colors.success};
  color: ${({ theme }) => theme.colors.background};
`;

export const TokenRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[2]}px;
  width: 100%;
`;

export const TokenLabel = styled.label`
  flex-shrink: 0;
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: ${({ theme }) => theme.colors.textMuted};
`;

export const TokenField = styled.input`
  flex: 1;
  min-width: 0;
  height: 44px;
  padding: 0 ${({ theme }) => theme.space[3]}px;
  border: 1px dashed ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
  background-color: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.text};
  font-family: ${({ theme }) => theme.typography.display};
  font-size: ${({ theme }) => theme.fontSizes.lg};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  letter-spacing: 0.14em;
  text-align: center;

  &::placeholder {
    font-family: inherit;
    font-size: ${({ theme }) => theme.fontSizes.sm};
    font-weight: ${({ theme }) => theme.fontWeights.medium};
    letter-spacing: 0;
    color: ${({ theme }) => theme.colors.textMuted};
  }

  &:focus {
    outline: none;
  }
`;

export const LimparButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 44px;
  height: 44px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
  background-color: transparent;
  color: ${({ theme }) => theme.colors.text};
  cursor: pointer;

  &:hover:not(:disabled) {
    border-color: ${({ theme }) => theme.colors.primary};
  }

  &:focus-visible {
    outline: 3px solid ${({ theme }) => theme.colors.primary};
    outline-offset: 2px;
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }
`;

export const VisuallyHidden = styled.span`
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  padding: 0;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
`;
