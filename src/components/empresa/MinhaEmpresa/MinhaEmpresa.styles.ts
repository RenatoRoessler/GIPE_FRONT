"use client";

import styled from "styled-components";

export const Page = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[4]}px;
  max-width: 880px;
`;

export const TitleGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[1]}px;
`;

export const Sections = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[4]}px;
`;

export const Actions = styled.div`
  display: flex;
  flex-direction: column-reverse;
  gap: ${({ theme }) => theme.space[2]}px;

  @media (min-width: ${({ theme }) => theme.breakpoints.sm}) {
    flex-direction: row;
    justify-content: flex-end;
    align-items: center;
  }
`;

export const StatusRow = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: ${({ theme }) => theme.space[2]}px;
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

export const SkeletonCard = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[4]}px;
  padding: ${({ theme }) => theme.space[4]}px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg};
  background-color: ${({ theme }) => theme.colors.background};
`;

export const SkeletonGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: ${({ theme }) => theme.space[3]}px;

  @media (min-width: ${({ theme }) => theme.breakpoints.sm}) {
    grid-template-columns: 1fr 1fr;
  }
`;

export const SkeletonField = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[2]}px;
`;

export const SkeletonHeader = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[2]}px;
`;
