"use client";

import styled from "styled-components";

export const Track = styled.div`
  height: 8px;
  overflow: hidden;
  border-radius: ${({ theme }) => theme.radii.full};
  background-color: ${({ theme }) => theme.colors.surfaceMuted};
`;

// A largura final é um valor entre 0 e 1 aplicado por `scaleX`: animar `transform` evita recalcular o layout.
export const Fill = styled.div<{ $ratio: number }>`
  width: 100%;
  height: 100%;
  border-radius: ${({ theme }) => theme.radii.full};
  background-color: ${({ theme }) => theme.colors.success};
  transform: scaleX(${({ $ratio }) => $ratio});
  transform-origin: left center;
  transition: transform 0.3s ease;

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;
