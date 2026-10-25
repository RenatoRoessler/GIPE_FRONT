"use client";

import styled from "styled-components";
import { Actions, Column, Eyebrow, Screen, Top } from "../ComprovantePublico/ComprovantePublico.styles";

// Dente da borda serrilhada da via (a "rasgada" do talão).
const TOOTH = 12;

// Páginas do recibo: a mesma estrutura do comprovante, com ajustes só para a impressão em papel.
export const ReciboScreen = styled(Screen)`
  @media print {
    padding: 0;
    background-color: #fff;
  }
`;

export const ReciboColumn = styled(Column)`
  @media print {
    max-width: none;
    min-height: 0;
    border: none;
    border-radius: 0;
    box-shadow: none;

    &::before {
      display: none;
    }
  }
`;

// Navegadores não imprimem fundos: o texto claro do cabeçalho some no papel, então ele vira preto sobre branco.
export const ReciboTop = styled(Top)`
  @media print {
    padding: ${({ theme }) => theme.space[3]}px 0;
    background: none;
    color: #000;
    border-bottom: 1px solid #000;

    [role="img"],
    [role="img"] span {
      color: #000;
    }
  }
`;

export const ReciboEyebrow = styled(Eyebrow)`
  @media print {
    color: #000;
  }
`;

export const ReciboActions = styled(Actions)`
  @media print {
    display: none;
  }
`;

// A via do recibo: papel que sobe sobre o cabeçalho, com a base serrilhada como num talão rasgado.
export const Slip = styled.section`
  position: relative;
  display: flex;
  flex-direction: column;
  margin: -${({ theme }) => theme.space[5]}px ${({ theme }) => theme.space[3]}px ${TOOTH}px;
  padding-top: ${({ theme }) => theme.space[3]}px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-bottom: none;
  border-radius: ${({ theme }) => theme.radii.lg} ${({ theme }) => theme.radii.lg} 0 0;
  background-color: ${({ theme }) => theme.colors.background};
  box-shadow: ${({ theme }) => theme.shadows.sm};

  /* Base serrilhada: triângulos na cor do papel por baixo da via. */
  &::after {
    content: "";
    position: absolute;
    left: -1px;
    right: -1px;
    bottom: -${TOOTH}px;
    height: ${TOOTH}px;
    background:
      linear-gradient(135deg, ${({ theme }) => theme.colors.background} 25%, transparent 25%) 0 0 / ${TOOTH}px ${TOOTH}px,
      linear-gradient(225deg, ${({ theme }) => theme.colors.background} 25%, transparent 25%) 0 0 / ${TOOTH}px ${TOOTH}px;
    filter: drop-shadow(0 1px 0 ${({ theme }) => theme.colors.border});
  }

  @media print {
    margin: ${({ theme }) => theme.space[3]}px 0 0;
    border-color: #000;
    border-bottom: 1px solid #000;
    border-radius: 0;
    box-shadow: none;

    &::after {
      display: none;
    }
  }
`;

export const SlipHead = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.space[2]}px;
  padding: 0 ${({ theme }) => theme.space[3]}px;
  font-size: ${({ theme }) => theme.fontSizes.sm};
`;

// A placa é o protagonista da via, como no cupom da entrada; o veículo vai logo abaixo.
export const PlateLine = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${({ theme }) => theme.space[1]}px;
  padding: ${({ theme }) => theme.space[3]}px;
  text-align: center;

  .veiculo {
    color: ${({ theme }) => theme.colors.textMuted};
    font-size: ${({ theme }) => theme.fontSizes.sm};
    font-weight: ${({ theme }) => theme.fontWeights.medium};
  }
`;

// Lançamentos do recibo: rótulo, pontilhado e valor à direita.
export const Ledger = styled.dl`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[2]}px;
  padding: 0 ${({ theme }) => theme.space[3]}px ${({ theme }) => theme.space[3]}px;

  > div {
    display: flex;
    align-items: baseline;
    gap: ${({ theme }) => theme.space[2]}px;
  }

  dt {
    color: ${({ theme }) => theme.colors.textMuted};
    font-size: ${({ theme }) => theme.fontSizes.sm};
  }

  /* Pontilhado que liga o rótulo ao valor. */
  > div::after {
    content: "";
    order: 1;
    flex: 1;
    align-self: flex-end;
    margin-bottom: 4px;
    border-bottom: 2px dotted ${({ theme }) => theme.colors.border};
  }

  dt {
    order: 0;
  }

  dd {
    order: 2;
    font-weight: ${({ theme }) => theme.fontWeights.bold};
    font-variant-numeric: tabular-nums;
    text-align: right;
  }
`;

// Picote: recortes laterais e linha tracejada entre os lançamentos e o total.
export const Picote = styled.div`
  display: flex;
  align-items: center;
  height: 24px;

  &::before,
  &::after {
    content: "";
    flex: none;
    width: 12px;
    height: 24px;
    background-color: ${({ theme }) => theme.colors.surface};
    border: 1px solid ${({ theme }) => theme.colors.border};
  }

  &::before {
    margin-left: -1px;
    border-left: none;
    border-radius: 0 12px 12px 0;
  }

  &::after {
    margin-right: -1px;
    border-right: none;
    border-radius: 12px 0 0 12px;
  }

  hr {
    flex: 1;
    margin: 0 ${({ theme }) => theme.space[1]}px;
    border: none;
    border-top: 2px dashed ${({ theme }) => theme.colors.border};
  }

  @media print {
    &::before,
    &::after {
      display: none;
    }

    hr {
      border-top-color: #000;
    }
  }
`;

// Fecho da via: o total pago (ou "Sem cobrança") em destaque, com a forma de pagamento e a etiqueta de mensalista.
export const Total = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[1]}px;
  padding: ${({ theme }) => theme.space[1]}px ${({ theme }) => theme.space[3]}px ${({ theme }) => theme.space[4]}px;

  .linha {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: ${({ theme }) => theme.space[2]}px;
    padding-top: ${({ theme }) => theme.space[2]}px;
    border-top: 3px double ${({ theme }) => theme.colors.text};
  }

  .label {
    font-size: ${({ theme }) => theme.fontSizes.sm};
    font-weight: ${({ theme }) => theme.fontWeights.bold};
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }

  .amount {
    font-family: ${({ theme }) => theme.fontFamilies.mono};
    font-size: calc(${({ theme }) => theme.fontSizes.xl} * 1.5);
    font-weight: ${({ theme }) => theme.fontWeights.semibold};
    line-height: 1;
    font-variant-numeric: tabular-nums;
    text-align: right;
  }

  .method {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: ${({ theme }) => theme.space[2]}px;
    color: ${({ theme }) => theme.colors.textMuted};
    font-size: ${({ theme }) => theme.fontSizes.sm};
  }

  .method strong {
    color: ${({ theme }) => theme.colors.text};
  }

  /* A etiqueta de mensalista não estica na largura da via. */
  > span {
    align-self: flex-start;
  }

  @media print {
    .linha {
      border-top-color: #000;
    }
  }
`;
