"use client";

import styled from "styled-components";

export const Page = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[4]}px;
  width: 100%;
  max-width: 720px;
  margin: 0 auto;
`;

export const Header = styled.div`
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: ${({ theme }) => theme.space[3]}px;

  @media (min-width: ${({ theme }) => theme.breakpoints.sm}) {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }
`;

export const Lista = styled.ul`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[3]}px;
  margin: 0;
  padding: 0;
  list-style: none;
`;

export const QuadroCard = styled.li`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[3]}px;
  padding: ${({ theme }) => theme.space[4]}px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.xl};
  background-color: ${({ theme }) => theme.colors.surface};
`;

export const QuadroTopo = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[1]}px;
`;

export const QuadroNome = styled.h2`
  margin: 0;
  font-size: ${({ theme }) => theme.fontSizes.lg};
  font-weight: ${({ theme }) => theme.fontWeights.extrabold};
`;

export const QuadroResumo = styled.span`
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: ${({ theme }) => theme.fontSizes.sm};
`;

export const Acoes = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.space[2]}px;
`;

export const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${({ theme }) => theme.space[3]}px;
  padding: ${({ theme }) => theme.space[6]}px ${({ theme }) => theme.space[4]}px;
  border: 1px dashed ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
  text-align: center;
`;

export const ErrorArea = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: ${({ theme }) => theme.space[2]}px;
`;

export const SkeletonList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[3]}px;
`;

export const FormPage = styled.form`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[4]}px;
  width: 100%;
  max-width: 480px;
  margin: 0 auto;
`;

export const Dimensoes = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${({ theme }) => theme.space[3]}px;
`;

export const PreviaTopo = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  justify-content: space-between;
  gap: ${({ theme }) => theme.space[1]}px ${({ theme }) => theme.space[3]}px;
`;

export const PreviaTitulo = styled.h2`
  margin: 0;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
`;

export const Rodape = styled.div`
  position: sticky;
  bottom: 0;
  /* Acima dos rótulos de linha da grade (sticky, z-index 1), que senão atravessam o rodapé. */
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: ${({ theme }) => theme.space[2]}px;
  padding: ${({ theme }) => theme.space[3]}px 0;
  background-color: ${({ theme }) => theme.colors.background};
`;

// Dentro de um modal o corpo tem folga (padding) em volta: com `bottom: 0` o rodapé para acima dela e a grade aparece
// por baixo. Descer a folga toda faz o rodapé encostar na borda do modal.
export const RodapeDoModal = styled(Rodape)`
  bottom: -${({ theme }) => theme.space[4]}px;
`;

export const LinkButton = styled.button`
  align-self: center;
  min-height: 44px;
  padding: 0 ${({ theme }) => theme.space[3]}px;
  border: none;
  border-radius: ${({ theme }) => theme.radii.md};
  background-color: transparent;
  color: ${({ theme }) => theme.colors.accent};
  font-family: inherit;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  cursor: pointer;

  &:hover:not(:disabled) {
    background-color: ${({ theme }) => theme.colors.primarySoft};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.focus};
    outline-offset: 2px;
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }
`;

export const EscolhaPage = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[4]}px;
`;

export const VeiculoCard = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[3]}px;
  padding: ${({ theme }) => theme.space[3]}px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg};
  background-color: ${({ theme }) => theme.colors.surface};
`;

export const VeiculoInfo = styled.div`
  display: flex;
  flex-direction: column;
  min-width: 0;
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  overflow-wrap: anywhere;
`;

export const SugestaoLetra = styled.span`
  color: ${({ theme }) => theme.colors.accent};
  font-family: ${({ theme }) => theme.typography.display};
  font-size: ${({ theme }) => theme.fontSizes.xxl};
  font-weight: ${({ theme }) => theme.typography.displayWeight};
  letter-spacing: ${({ theme }) => theme.typography.displayTracking};
  line-height: 1;
`;
