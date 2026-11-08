"use client";

import styled, { css } from "styled-components";
import { Button } from "@/components/ui/Button";
import { NumeroLink, Page } from "./Faturas.styles";

// Arranjo de celular de Faturas (abaixo de `breakpoints.md`): cartões, botão flutuante e barra de ações.

export const ListaCartoes = styled.ul<{ $refreshing?: boolean }>`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[2]}px;
  margin: 0;
  padding: 0;
  list-style: none;
  opacity: ${({ $refreshing }) => ($refreshing ? 0.6 : 1)};
  transition: opacity 0.15s ease;
`;

// Cartão de fatura na lista. Vencida ou que vence hoje ganha fundo de perigo suave; o texto do aviso continua dizendo o motivo.
export const CartaoFatura = styled.li<{ $alerta: boolean }>`
  position: relative;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[1]}px;
  min-height: ${({ theme }) => theme.layout.touchTarget};
  padding: ${({ theme }) => theme.space[3]}px;
  border: 1px solid ${({ theme, $alerta }) => ($alerta ? theme.colors.danger : theme.colors.border)};
  border-radius: ${({ theme }) => theme.radii.lg};
  background-color: ${({ theme, $alerta }) => ($alerta ? theme.colors.dangerSoft : theme.colors.surface)};

  &:active {
    background-color: ${({ theme }) => theme.colors.surfaceMuted};
  }

  &:has(a:focus-visible) {
    outline: 2px solid ${({ theme }) => theme.colors.focus};
    outline-offset: 2px;
  }
`;

// O número da fatura é o link de verdade; o ::after estende o toque ao cartão inteiro.
export const NumeroLinkEsticado = styled(NumeroLink)`
  &::after {
    content: "";
    position: absolute;
    inset: 0;
    border-radius: ${({ theme }) => theme.radii.lg};
  }

  &:focus-visible {
    outline: none;
  }
`;

export const CartaoTopo = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.space[2]}px;
`;

// Número e conveniada na mesma linha; a conveniada trunca com reticências e não empurra o selo.
export const Identificacao = styled.div`
  display: flex;
  align-items: baseline;
  gap: ${({ theme }) => theme.space[2]}px;
  min-width: 0;
`;

export const NomeConveniada = styled.span`
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: ${({ theme }) => theme.fontWeights.medium};
`;

// Cancelada: apagado e riscado, como no detalhe, para não parecer uma cobrança viva.
export const ValorCartao = styled.span<{ $cancelada: boolean }>`
  font-size: ${({ theme }) => theme.fontSizes.lg};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  font-variant-numeric: tabular-nums;
  color: ${({ theme, $cancelada }) => ($cancelada ? theme.colors.textMuted : theme.colors.accent)};
  text-decoration: ${({ $cancelada }) => ($cancelada ? "line-through" : "none")};
`;

export const LinhaCartao = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textMuted};
`;

export const ApoioCartao = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.textMuted};
  font-variant-numeric: tabular-nums;
`;

// Cartão de saída no detalhe: não é interativo, então não tem estado pressionado.
export const CartaoSaida = styled.li`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[1]}px;
  padding: ${({ theme }) => theme.space[3]}px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg};
  background-color: ${({ theme }) => theme.colors.surface};
`;

// Página da lista no celular: o fim ganha a folga do botão flutuante, para ele não cobrir o último item.
export const PaginaComFab = styled(Page)`
  padding-bottom: ${({ theme }) => theme.layout.fabClearance};
`;

// Resumo no topo da seção de saídas ("14 saídas · R$ 1.250,00") para quem rola uma lista longa.
export const ResumoSaidas = styled.p`
  margin: 0;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  color: ${({ theme }) => theme.colors.textMuted};
  font-variant-numeric: tabular-nums;
`;

// Total da fatura no fim da lista de cartões: a conferência da soma.
export const RodapeTotal = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  justify-content: space-between;
  gap: ${({ theme }) => theme.space[2]}px;
  padding: ${({ theme }) => theme.space[3]}px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg};
  background-color: ${({ theme }) => theme.colors.surfaceMuted};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  font-variant-numeric: tabular-nums;
`;

export const SaidaTopo = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: ${({ theme }) => theme.space[2]}px;
`;

// A parte da conveniada é o que se cobra e o que soma na fatura: o valor em destaque do cartão.
export const SaidaValor = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  text-align: right;
  font-variant-numeric: tabular-nums;

  strong {
    font-weight: ${({ theme }) => theme.fontWeights.bold};
    color: ${({ theme }) => theme.colors.text};
  }

  span {
    font-size: ${({ theme }) => theme.fontSizes.xs};
    color: ${({ theme }) => theme.colors.textMuted};
  }
`;

export const SaidaLinha = styled.p`
  margin: 0;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.text};
  font-variant-numeric: tabular-nums;
  overflow-wrap: anywhere;
`;

export const SaidaApoio = styled.p`
  margin: 0;
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.textMuted};
  font-variant-numeric: tabular-nums;
`;

// Botão flutuante de emitir fatura: no canto, acima da barra de navegação inferior (mesmo desenho de Mensalistas).
export const EmitirFlutuante = styled(Button)`
  position: fixed;
  right: max(${({ theme }) => theme.space[3]}px, env(safe-area-inset-right, 0px));
  /* Acima da barra de navegação inferior (que já inclui a área segura). */
  bottom: calc(${({ theme }) => theme.space[3]}px + ${({ theme }) => theme.layout.bottomNavReserved} + env(safe-area-inset-bottom, 0px));
  z-index: 10;
  min-height: 48px;
  padding-inline: ${({ theme }) => theme.space[4]}px;
  border-radius: ${({ theme }) => theme.radii.full};
  box-shadow: ${({ theme }) => theme.shadows.md};
`;

// Barra de ações do detalhe: gruda acima da navegação inferior, no fim do conteúdo (mesmo desenho do rodapé de Conferência).
export const BarraAcoes = styled.div`
  position: sticky;
  bottom: calc(${({ theme }) => theme.layout.bottomNavReserved} + env(safe-area-inset-bottom, 0px));
  z-index: 5;
  display: flex;
  gap: ${({ theme }) => theme.space[2]}px;
  margin: 0 -${({ theme }) => theme.space[3]}px;
  padding: ${({ theme }) => theme.space[3]}px;
  border-top: 1px solid ${({ theme }) => theme.colors.border};
  background-color: ${({ theme }) => theme.colors.background};

  & > button {
    min-height: ${({ theme }) => theme.layout.touchTarget};
  }

  & > :first-child {
    flex: 1;
  }

  & > :last-child {
    flex: 2;
  }
`;

// "Filtrando: Abertas · Auto Peças Sul" com o botão de limpar à direita.
export const LinhaFiltrando = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.space[2]}px;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textMuted};
`;

// Aviso de vencimento (ícone + texto): perigo para vencida e hoje, ênfase para a que está perto, neutro nas demais.
export const AvisoVenc = styled.span<{ $tipo: "vencida" | "hoje" | "proxima" | "futura" }>`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[1]}px;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme, $tipo }) => ($tipo === "futura" ? theme.fontWeights.regular : theme.fontWeights.bold)};
  color: ${({ theme, $tipo }) =>
    $tipo === "vencida" || $tipo === "hoje" ? theme.colors.danger : $tipo === "proxima" ? theme.colors.text : theme.colors.textMuted};

  svg {
    flex: none;
  }
`;

// Observação longa no celular: 3 linhas até o usuário pedir o resto.
export const TextoLimitado = styled.p<{ $limitado: boolean }>`
  margin: 0;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textMuted};
  overflow-wrap: anywhere;

  ${({ $limitado }) =>
    $limitado &&
    css`
      display: -webkit-box;
      -webkit-line-clamp: 3;
      -webkit-box-orient: vertical;
      overflow: hidden;
    `}
`;

// Ação em texto (Limpar, Ver mais, Alterar): sem caixa, mas com o alvo de toque completo.
export const BotaoTexto = styled.button`
  display: inline-flex;
  align-items: center;
  min-height: ${({ theme }) => theme.layout.touchTarget};
  padding: 0 ${({ theme }) => theme.space[2]}px;
  border: none;
  background: none;
  font-family: inherit;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  color: ${({ theme }) => theme.colors.link};
  text-decoration: underline;
  text-underline-offset: 3px;
  cursor: pointer;

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.focus};
    outline-offset: 2px;
    border-radius: ${({ theme }) => theme.radii.sm};
  }
`;

// "Data: agora · Alterar": a data do pagamento fica recolhida até o usuário pedir para mudá-la.
export const LinhaData = styled(LinhaFiltrando)`
  padding: 0 ${({ theme }) => theme.space[1]}px;
`;

// Botão de rodapé de diálogo com o alvo de toque completo.
export const BotaoRodape = styled(Button)`
  min-height: ${({ theme }) => theme.layout.touchTarget};
`;

// No rodapé de um modal estreito os botões se empilham em ordem inversa (o último fica em cima).
// O botão de perigo vai para baixo de "Manter fatura", que fica em cima e com o foco inicial.
export const BotaoPerigoEmbaixo = styled(BotaoRodape)`
  @media (max-width: calc(${({ theme }) => theme.breakpoints.sm} - 1px)) {
    order: -1;
  }
`;
