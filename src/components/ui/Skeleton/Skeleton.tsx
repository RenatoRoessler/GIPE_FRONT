"use client";

import { HTMLAttributes } from "react";
import { StyledSkeleton } from "./Skeleton.styles";

export interface SkeletonProps extends HTMLAttributes<HTMLSpanElement> {
  width?: string;
  height?: string;
  radius?: string;
}

// Bloco decorativo de carregamento; o texto acessível fica a cargo de quem o agrupa (role="status").
export function Skeleton({ width = "100%", height = "16px", radius, ...props }: SkeletonProps) {
  return (
    <StyledSkeleton
      aria-hidden="true"
      $width={width}
      $height={height}
      $radius={radius}
      {...props}
    />
  );
}
