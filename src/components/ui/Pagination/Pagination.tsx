"use client";

import { Button } from "@/components/ui/Button";
import { Controls, Nav, PageIndicator } from "./Pagination.styles";

export interface PaginationProps {
  page: number;
  totalPages: number;
  totalRecords: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ page, totalPages, totalRecords, pageSize, onPageChange }: PaginationProps) {
  const first = totalRecords === 0 ? 0 : (page - 1) * pageSize + 1;
  const last = Math.min(page * pageSize, totalRecords);

  return (
    <Nav aria-label="Paginação">
      <span>
        Mostrando {first}–{last} de {totalRecords}
      </span>
      <Controls>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
        >
          Anterior
        </Button>
        <PageIndicator aria-current="page">
          Página {page} de {Math.max(totalPages, 1)}
        </PageIndicator>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
        >
          Próxima
        </Button>
      </Controls>
    </Nav>
  );
}
