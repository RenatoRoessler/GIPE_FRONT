"use client";

import styled from "styled-components";

export const Item = styled.li`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[3]}px;
  padding: ${({ theme }) => theme.space[3]}px;
  border-radius: ${({ theme }) => theme.radii.md};
  background-color: ${({ theme }) => theme.colors.surface};
  box-shadow: inset 0 0 0 1px ${({ theme }) => theme.colors.border};
  list-style: none;
`;

export const Linha = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[3]}px;
  min-width: 0;
`;

export const Info = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
`;

export const Nome = styled.span`
  overflow: hidden;
  font-weight: ${({ theme }) => theme.fontWeights.extrabold};
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const Meta = styled.span`
  overflow: hidden;
  font-family: ${({ theme }) => theme.fontFamilies.mono};
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-variant-numeric: tabular-nums;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: ${({ theme }) => theme.colors.textMuted};
`;

export const Situacao = styled.span<{ $tom: "success" | "danger" }>`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[1]}px;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  color: ${({ theme, $tom }) => ($tom === "success" ? theme.colors.success : theme.colors.text)};

  ${({ $tom, theme }) =>
    $tom === "danger" &&
    `&::before {
      content: "";
      flex: none;
      width: 8px;
      height: 8px;
      border-radius: ${theme.radii.full};
      background-color: ${theme.colors.danger};
    }`}
`;

export const Resolvida = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.space[2]}px;
  flex-wrap: wrap;

  & > button {
    min-height: ${({ theme }) => theme.layout.touchTarget};
  }
`;
