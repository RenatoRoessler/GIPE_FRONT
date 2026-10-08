"use client";

import styled, { keyframes } from "styled-components";

const shimmer = keyframes`
  from { background-position: 200% 0; }
  to { background-position: -200% 0; }
`;

export const StyledSkeleton = styled.span<{ $width: string; $height: string; $radius?: string }>`
  display: block;
  width: ${({ $width }) => $width};
  height: ${({ $height }) => $height};
  border-radius: ${({ theme, $radius }) => $radius ?? theme.radii.md};
  background-color: ${({ theme }) => theme.colors.surface};

  @media (prefers-reduced-motion: no-preference) {
    background-image: linear-gradient(
      90deg,
      ${({ theme }) => theme.colors.surface} 25%,
      ${({ theme }) => theme.colors.border} 50%,
      ${({ theme }) => theme.colors.surface} 75%
    );
    background-size: 200% 100%;
    animation: ${shimmer} 1.4s ease-in-out infinite;
  }
`;
