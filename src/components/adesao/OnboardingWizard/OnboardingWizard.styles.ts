"use client";

import styled from "styled-components";

export const Header = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[4]}px;
`;

export const TitleGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[1]}px;
`;

// A logo tem texto azul-marinho: no tema escuro ganha uma base clara para manter a leitura.
export const LogoWrapper = styled.div<{ $onDark: boolean }>`
  align-self: center;
  display: flex;
  padding: ${({ theme, $onDark }) => ($onDark ? `${theme.space[1]}px ${theme.space[2]}px` : 0)};
  border-radius: ${({ theme }) => theme.radii.md};
  background-color: ${({ theme, $onDark }) => ($onDark ? theme.colors.text : "transparent")};
`;

export const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[4]}px;
`;

export const ErrorBanner = styled.div`
  padding: ${({ theme }) => theme.space[2]}px ${({ theme }) => theme.space[3]}px;
  border-radius: ${({ theme }) => theme.radii.md};
  background-color: rgba(229, 72, 77, 0.08);
  border: 1px solid ${({ theme }) => theme.colors.danger};
  color: ${({ theme }) => theme.colors.danger};
  font-size: ${({ theme }) => theme.fontSizes.sm};
`;

export const Actions = styled.div`
  display: flex;
  flex-direction: column-reverse;
  gap: ${({ theme }) => theme.space[2]}px;

  @media (min-width: ${({ theme }) => theme.breakpoints.sm}) {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
  }
`;
