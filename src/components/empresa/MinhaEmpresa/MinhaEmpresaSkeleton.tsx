"use client";

import { CadastroCorpo } from "@/components/ui/PainelCadastro";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  Sections,
  SkeletonAside,
  SkeletonCard,
  SkeletonField,
  SkeletonGrid,
  SkeletonHeader,
  VisuallyHidden,
} from "./MinhaEmpresa.styles";

const COMPANY_FIELDS = 11;
const HOURS_ROWS = 4;
const PAYMENT_ROWS = 2;

function FieldSkeleton() {
  return (
    <SkeletonField>
      <Skeleton width="30%" height="14px" />
      <Skeleton height="44px" />
    </SkeletonField>
  );
}

// Reproduz o layout dos três accordions e do painel lateral para evitar salto de layout quando os dados chegam.
export function MinhaEmpresaSkeleton() {
  return (
    <CadastroCorpo role="status" aria-busy="true">
      <Sections>
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
        <SkeletonCard>
          <SkeletonHeader>
            <Skeleton width="25%" height="20px" />
            <Skeleton width="30%" height="14px" />
          </SkeletonHeader>
          {Array.from({ length: PAYMENT_ROWS }, (_, index) => (
            <Skeleton key={index} height="56px" />
          ))}
        </SkeletonCard>
      </Sections>
      <SkeletonAside aria-hidden="true">
        <Skeleton width="60%" height="14px" />
        <Skeleton height="6px" />
        {Array.from({ length: 3 }, (_, index) => (
          <Skeleton key={index} height="36px" />
        ))}
        <Skeleton height="40px" />
      </SkeletonAside>
    </CadastroCorpo>
  );
}
