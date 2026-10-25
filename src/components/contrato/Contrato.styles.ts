"use client";

import styled, { createGlobalStyle } from "styled-components";

// Largura de leitura confortável para o texto do contrato (valor de layout local, como o max-width do comprovante).
const READING_WIDTH = "720px";

// Mesmo fundo das telas de acesso (PageBackground), mas alinhado ao topo: o documento é longo e rola.
export const Screen = styled.div`
  min-height: 100dvh;
  display: flex;
  justify-content: center;
  padding: ${({ theme }) => theme.space[4]}px ${({ theme }) => theme.space[3]}px ${({ theme }) => theme.space[6]}px;
  background: linear-gradient(
    340deg,
    ${({ theme }) => theme.colors.background} 0%,
    ${({ theme }) => theme.colors.primarySoft} 55%,
    ${({ theme }) => theme.colors.primarySofter} 100%
  );
  color: ${({ theme }) => theme.colors.text};
`;

export const Column = styled.main`
  width: 100%;
  max-width: ${READING_WIDTH};
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[4]}px;
`;

// Logo menor que o das telas de acesso: o foco aqui é o documento.
export const LogoBox = styled.div`
  max-width: 160px;
  margin: 0 auto;
`;

export const Message = styled.section`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${({ theme }) => theme.space[2]}px;
  padding: ${({ theme }) => theme.space[5]}px ${({ theme }) => theme.space[4]}px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg};
  background-color: ${({ theme }) => theme.colors.background};
  box-shadow: ${({ theme }) => theme.shadows.sm};
  text-align: center;

  svg {
    color: ${({ theme }) => theme.colors.textMuted};
  }

  h1 {
    margin: 0;
    font-family: ${({ theme }) => theme.typography.display};
    font-size: ${({ theme }) => theme.typography.displaySize};
    text-transform: ${({ theme }) => theme.typography.displayTransform};
    letter-spacing: ${({ theme }) => theme.typography.displayTracking};
  }

  p {
    margin: 0;
    color: ${({ theme }) => theme.colors.textMuted};
    font-size: ${({ theme }) => theme.fontSizes.md};
  }
`;

export const Header = styled.header`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[1]}px;
`;

export const Eyebrow = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  letter-spacing: 0.08em;
  text-transform: uppercase;
`;

export const Title = styled.h1`
  margin: 0;
  font-family: ${({ theme }) => theme.typography.display};
  font-size: ${({ theme }) => theme.typography.displaySize};
  text-transform: ${({ theme }) => theme.typography.displayTransform};
  letter-spacing: ${({ theme }) => theme.typography.displayTracking};
`;

export const Meta = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: ${({ theme }) => theme.fontSizes.sm};
`;

export const StatusStrip = styled.div<{ $tone: "info" | "success" }>`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[1]}px;
  padding: ${({ theme }) => theme.space[3]}px;
  border-radius: ${({ theme }) => theme.radii.md};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  background-color: ${({ theme, $tone }) => ($tone === "success" ? theme.colors.surface : theme.colors.primarySoft)};
  color: ${({ theme, $tone }) => ($tone === "success" ? theme.colors.success : theme.colors.link)};
  box-shadow: ${({ theme, $tone }) => ($tone === "success" ? `inset 0 0 0 1px ${theme.colors.success}` : "none")};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
`;

// Fica fora da tela até receber foco: leva direto à confirmação (WCAG 2.4.1).
export const SkipLink = styled.a`
  align-self: flex-start;
  color: inherit;
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  text-decoration: underline;
  border-radius: ${({ theme }) => theme.radii.sm};

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.focus};
    outline-offset: 2px;
  }
`;

export const ProgressTrack = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 10;
  height: 3px;
  background-color: ${({ theme }) => theme.colors.border};
`;

export const ProgressBar = styled.div`
  height: 100%;
  background-color: ${({ theme }) => theme.colors.accent};
  transform-origin: left;
`;

// A folha: o documento é o protagonista, e o aceite é o fecho dele.
export const Folha = styled.section`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[4]}px;
  padding: ${({ theme }) => theme.space[4]}px;
  border-radius: ${({ theme }) => theme.radii.md};
  background-color: ${({ theme }) => theme.colors.background};
  box-shadow: ${({ theme }) => theme.shadows.md};

  @media (min-width: ${({ theme }) => theme.breakpoints.md}) {
    padding: ${({ theme }) => theme.space[5]}px;
  }
`;

export const Texto = styled.div`
  max-width: 68ch;
  font-size: ${({ theme }) => theme.fontSizes.md};
  line-height: 1.6;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
`;

export const Fecho = styled.section<{ $divisor: boolean }>`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[3]}px;
  max-width: 68ch;
  padding-top: ${({ theme, $divisor }) => ($divisor ? theme.space[4] : 0)}px;
  border-top: ${({ theme, $divisor }) => ($divisor ? `1px dashed ${theme.colors.border}` : "none")};

  &:focus {
    outline: none;
  }
`;

export const FechoTitle = styled.h2`
  margin: 0;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  letter-spacing: 0.04em;
  text-transform: uppercase;
`;

export const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[3]}px;
`;

export const Small = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: ${({ theme }) => theme.fontSizes.xs};
`;

export const HashLine = styled.p`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${({ theme }) => theme.space[2]}px;
  margin: 0;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-variant-numeric: tabular-nums;
  overflow-wrap: anywhere;
`;

export const LinkButton = styled.button`
  padding: 0;
  border: none;
  background: transparent;
  color: ${({ theme }) => theme.colors.link};
  font-size: inherit;
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  text-decoration: underline;
  cursor: pointer;

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.focus};
    outline-offset: 2px;
    border-radius: ${({ theme }) => theme.radii.sm};
  }
`;

// Selo de aceite: mesma linguagem do recibo (borda tracejada) para dizer "isto é um comprovante".
export const Selo = styled.section`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${({ theme }) => theme.space[2]}px;
  padding: ${({ theme }) => theme.space[4]}px;
  border: 2px dashed ${({ theme }) => theme.colors.success};
  border-radius: ${({ theme }) => theme.radii.md};
  background-color: ${({ theme }) => theme.colors.surface};
  text-align: center;

  p {
    margin: 0;
  }
`;

export const SeloTitle = styled.h2`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[2]}px;
  margin: 0;
  color: ${({ theme }) => theme.colors.success};
  font-size: ${({ theme }) => theme.fontSizes.lg};
  font-weight: ${({ theme }) => theme.fontWeights.bold};

  &:focus {
    outline: none;
  }
`;

export const Skeletons = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[2]}px;
`;

// Na impressão sai só o documento: cabeçalho, texto e selo, em preto sobre branco.
export const PrintStyles = createGlobalStyle`
  @media print {
    [data-no-print] {
      display: none !important;
    }

    body {
      background: white !important;
    }

    [data-print-area] {
      background: white !important;
      color: black !important;
      padding: 0 !important;
    }

    [data-print-area] * {
      color: black !important;
      background: transparent !important;
      border-color: black !important;
      box-shadow: none !important;
    }
  }
`;
