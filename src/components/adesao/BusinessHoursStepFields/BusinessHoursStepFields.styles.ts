"use client";

import styled from "styled-components";

export const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[3]}px;
`;

export const Toolbar = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[2]}px;

  @media (min-width: ${({ theme }) => theme.breakpoints.sm}) {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }
`;

export const DayList = styled.div`
  display: flex;
  flex-direction: column;
`;

export const DayRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${({ theme }) => theme.space[2]}px ${({ theme }) => theme.space[3]}px;
  align-items: start;
  padding: ${({ theme }) => theme.space[3]}px 0;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};

  &:last-child {
    border-bottom: none;
  }

  @media (min-width: ${({ theme }) => theme.breakpoints.md}) {
    grid-template-columns: 140px auto auto 1fr 1fr;
    align-items: end;
  }
`;

export const DayName = styled.span`
  grid-column: 1 / -1;
  font-size: ${({ theme }) => theme.fontSizes.md};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  color: ${({ theme }) => theme.colors.text};

  @media (min-width: ${({ theme }) => theme.breakpoints.md}) {
    grid-column: auto;
    align-self: center;
  }
`;
