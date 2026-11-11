"use client";

import styled, { createGlobalStyle } from "styled-components";
import { Button } from "@/components/ui/Button";

// Folha A4 a 96 dpi (794 x 1123 px): é a escala da referência do cartaz, então as medidas em px e em múltiplos
// dos tamanhos do tema seguem o desenho sem conversão. Um milímetro a menos evita a página em branco depois do cartaz.
const PAGE_WIDTH = "210mm";
const PAGE_HEIGHT = "296mm";

// Nó fora do app para a impressão: na tela fica oculto e, ao imprimir, é a única coisa visível. Diferente do recibo,
// preserva cores e fundos: o cartaz é de marca (asfalto, giz e amarelo), não um cupom em preto e branco.
export const PrintStyles = createGlobalStyle`
  #cartaz-print-root {
    display: none;
  }

  @page {
    size: A4 portrait;
    margin: 0;
  }

  @media print {
    body > *:not(#cartaz-print-root) {
      display: none !important;
    }

    html,
    body {
      margin: 0;
      padding: 0;
    }

    #cartaz-print-root {
      display: flex;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
  }
`;

export const Root = styled.div`
  position: relative;
  flex-direction: column;
  width: ${PAGE_WIDTH};
  height: ${PAGE_HEIGHT};
  overflow: hidden;
  break-inside: avoid;
  page-break-after: avoid;
  background-color: ${({ theme }) => theme.colors.background};
  color: ${({ theme }) => theme.colors.text};
  font-family: ${({ theme }) => theme.fontFamilies.sans};
`;

// Faixa de cabeçalho: usa o tema escuro (aninhado) para a marca e o selo saírem com o contraste do tema da marca.
export const Header = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${({ theme }) => theme.space[4]}px ${({ theme }) => theme.space[6]}px;
  background-color: ${({ theme }) => theme.colors.background};
`;

export const Selo = styled.span`
  padding: ${({ theme }) => theme.space[2]}px ${({ theme }) => theme.space[3]}px;
  border-radius: ${({ theme }) => theme.radii.full};
  background-color: ${({ theme }) => theme.colors.primary};
  color: ${({ theme }) => theme.colors.onPrimary};
  font-family: ${({ theme }) => theme.fontFamilies.mono};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  letter-spacing: 0.14em;
  text-transform: uppercase;
`;

export const Content = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[5]}px;
  padding: ${({ theme }) => theme.space[6]}px ${({ theme }) => theme.space[6]}px ${({ theme }) => theme.space[4]}px;
`;

export const Title = styled.h1`
  font-size: calc(${({ theme }) => theme.fontSizes.xxl} * 2);
  font-weight: ${({ theme }) => theme.fontWeights.extrabold};
  letter-spacing: -0.03em;
  line-height: 1.05;
`;

// Marcador amarelo sob a palavra de destaque.
export const Marcador = styled.span`
  padding: 0 ${({ theme }) => theme.space[2]}px;
  background: linear-gradient(transparent 52%, ${({ theme }) => theme.colors.primary} 52%);
`;

export const Lead = styled.p`
  max-width: 620px;
  margin-top: ${({ theme }) => theme.space[3]}px;
  font-size: ${({ theme }) => theme.fontSizes.lg};
  line-height: 1.5;
`;

export const Body = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) 300px;
  gap: ${({ theme }) => theme.space[5]}px;
  align-items: start;
`;

export const Passos = styled.ol`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[4]}px;
  list-style: none;
`;

export const Passo = styled.li`
  display: grid;
  grid-template-columns: 52px minmax(0, 1fr);
  gap: ${({ theme }) => theme.space[3]}px;
  align-items: start;
`;

export const Numero = styled.span`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 52px;
  height: 52px;
  border-radius: ${({ theme }) => theme.radii.lg};
  background-color: ${({ theme }) => theme.colors.text};
  color: ${({ theme }) => theme.colors.warn};
  font-size: ${({ theme }) => theme.fontSizes.subtitle};
  font-weight: ${({ theme }) => theme.fontWeights.extrabold};
`;

export const PassoTexto = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[1]}px;

  h2 {
    font-size: ${({ theme }) => theme.fontSizes.lg};
    font-weight: ${({ theme }) => theme.fontWeights.bold};
  }

  p {
    color: ${({ theme }) => theme.colors.textMuted};
    font-size: ${({ theme }) => theme.fontSizes.md};
    line-height: 1.45;
  }
`;

// A miniplaca do passo 2 é só ilustração: o exemplo não é uma placa real.
export const PlacaExemplo = styled.div`
  width: 180px;
  margin-top: ${({ theme }) => theme.space[1]}px;
`;

export const QrCard = styled.section`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${({ theme }) => theme.space[3]}px;
  padding: ${({ theme }) => theme.space[4]}px ${({ theme }) => theme.space[3]}px;
  border: 2px solid ${({ theme }) => theme.colors.text};
  border-radius: ${({ theme }) => theme.radii.xl};
  background-color: ${({ theme }) => theme.colors.surface};
`;

export const QrRotulo = styled.p`
  font-family: ${({ theme }) => theme.fontFamilies.mono};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  letter-spacing: 0.2em;
  text-transform: uppercase;
`;

export const QrLegenda = styled.p`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[1]}px;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
`;

export const Beneficios = styled.ul`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${({ theme }) => theme.space[3]}px 0;
  border-top: 2px dashed ${({ theme }) => theme.colors.warn};
  list-style: none;

  li {
    display: flex;
    align-items: center;
    gap: ${({ theme }) => theme.space[2]}px;
    font-size: ${({ theme }) => theme.fontSizes.md};
    font-weight: ${({ theme }) => theme.fontWeights.bold};
  }
`;

export const Rodape = styled.footer`
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: ${({ theme }) => theme.space[4]}px;
  margin-top: auto;

  h2 {
    font-size: ${({ theme }) => theme.fontSizes.lg};
    font-weight: ${({ theme }) => theme.fontWeights.bold};
  }

  p {
    color: ${({ theme }) => theme.colors.textMuted};
    font-size: ${({ theme }) => theme.fontSizes.sm};
  }
`;

export const Marca = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: ${({ theme }) => theme.space[1]}px;

  span {
    color: ${({ theme }) => theme.colors.textMuted};
    font-family: ${({ theme }) => theme.fontFamilies.mono};
    font-size: ${({ theme }) => theme.fontSizes.xs};
  }
`;

export const FaixaAmarela = styled.div`
  height: ${({ theme }) => theme.space[3]}px;
  background-color: ${({ theme }) => theme.colors.primary};
`;

// Botão que gera o cartaz: ícone e texto lado a lado.
export const GerarButton = styled(Button)`
  gap: ${({ theme }) => theme.space[2]}px;
`;
