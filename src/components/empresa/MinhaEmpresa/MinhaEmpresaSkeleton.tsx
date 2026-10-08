"use client";

import { Skeleton } from "@/components/ui/Skeleton";
import {
  Sections,
  SkeletonCard,
  SkeletonField,
  SkeletonGrid,
  SkeletonHeader,
  VisuallyHidden,
} from "./MinhaEmpresa.styles";

const COMPANY_FIELDS = 11;
const HOURS_ROWS = 4;

function FieldSkeleton() {
  return (
    <SkeletonField>
      <Skeleton width="30%" height="14px" />
      <Skeleton height="44px" />
    </SkeletonField>
  );
}

// Reproduz o layout dos dois accordions para evitar salto de layout quando os dados chegam.
export function MinhaEmpresaSkeleton() {
  return (
    <Sections role="status" aria-busy="true">
      <VisuallyHidden>Carregando dados da empresa…</VisuallyHidden>
      <SkeletonCard>
        <SkeletonHeader>
          <Skeleton width="40%" height="20px" />
          <Skeleton width="25%" height="14px" />
        </SkeletonHeader>
        <SkeletonGrid>
          {Array.from({ length: COMPANY_FIELDS }, (_, index) => (
            <FieldSkeleton key={index} />
          ))}
        </SkeletonGrid>
      </SkeletonCard>
      <SkeletonCard>
        <SkeletonHeader>
          <Skeleton width="30%" height="20px" />
          <Skeleton width="20%" height="14px" />
        </SkeletonHeader>
        {Array.from({ length: HOURS_ROWS }, (_, index) => (
          <Skeleton key={index} height="44px" />
        ))}
      </SkeletonCard>
    </Sections>
  );
}
