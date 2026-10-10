"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/Button";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { Link } from "@/components/ui/Link";
import { Pagination } from "@/components/ui/Pagination";
import { Skeleton } from "@/components/ui/Skeleton";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Table, TableBody, TableCell, TableHead, TableRow } from "@/components/ui/Table";
import { Text } from "@/components/ui/Text";
import { Toast } from "@/components/ui/Toast";
import { listPrecos } from "@/lib/api/services/preco";
import { getSituacao } from "@/lib/api/services/preco.mapper";
import { TIPO_CATEGORIA, type PrecoView } from "@/types/preco";
import { formatVigencia, getCategoriaLabel, getTipoRegraLabel } from "../format";
import { SITUACAO_BADGE } from "../situacao";
import {
  CategoryList,
  Description,
  EmptyState,
  ErrorArea,
  Header,
  Page,
  RowActions,
  SkeletonRows,
  TableArea,
} from "./PrecosList.styles";

const PAGE_SIZE = 20;
const SKELETON_ROWS = 8;
const MAX_VISIBLE_CATEGORIES = 2;

// Destino do clique na linha. Enquanto a visualização (/precos/[id]) não existe, abre a edição;
// quando ela for implementada, trocar por `detalhe`.
const ROW_CLICK_TARGET = "editar";

const SAVED_MESSAGES: Record<string, string> = {
  criado: "Tabela de preço criada.",
  atualizado: "Tabela de preço atualizada.",
};

function parsePage(value: string | null): number {
  const page = Number(value);
  return Number.isInteger(page) && page >= 1 ? page : 1;
}

function formatCategorias(preco: PrecoView): string {
  if (preco.categorias.length === 0) {
    return "—";
  }
  if (preco.categorias.includes(TIPO_CATEGORIA.Todas)) {
    return getCategoriaLabel(TIPO_CATEGORIA.Todas);
  }
  const visible = preco.categorias.slice(0, MAX_VISIBLE_CATEGORIES).map(getCategoriaLabel);
  const hidden = preco.categorias.length - visible.length;
  return hidden > 0 ? `${visible.join(", ")} +${hidden}` : visible.join(", ");
}

export function PrecosList() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pagina = parsePage(searchParams.get("pagina"));
  const tableRef = useRef<HTMLDivElement>(null);
  // O aviso vem do parâmetro `salvo` (enviado pelo wizard) e some junto com ele, uma única vez.
  const salvo = searchParams.get("salvo");
  const savedMessage = salvo ? SAVED_MESSAGES[salvo] : undefined;

  const dismissSaved = useCallback(() => {
    router.replace(pagina > 1 ? `/precos?pagina=${pagina}` : "/precos", { scroll: false });
  }, [router, pagina]);

  const { data, isPending, isError, error, refetch, isPlaceholderData } = useQuery({
    queryKey: ["precos", pagina],
    queryFn: () => listPrecos({ pagina, tamanhoPagina: PAGE_SIZE }),
    placeholderData: keepPreviousData,
  });

  // Página fora do intervalo (ex.: registros removidos): volta para a última existente.
  useEffect(() => {
    if (data && data.totalPages > 0 && pagina > data.totalPages) {
      router.replace(`/precos?pagina=${data.totalPages}`, { scroll: false });
    }
  }, [data, pagina, router]);

  function goToPage(page: number) {
    router.replace(`/precos?pagina=${page}`, { scroll: false });
    tableRef.current?.focus();
  }

  const agora = new Date();

  return (
    <Page>
      {savedMessage && <Toast message={savedMessage} onDismiss={dismissSaved} />}
      <Header>
        <Text variant="heading" as="h1">
          Gestão de Preços
        </Text>
        <Button type="button" onClick={() => router.push("/precos/novo")}>
          Novo preço
        </Button>
      </Header>

      {isError ? (
        <ErrorArea>
          <ErrorBanner role="alert">
            Não foi possível carregar os preços. {error.message}
          </ErrorBanner>
          <Button type="button" variant="secondary" onClick={() => void refetch()}>
            Tentar novamente
          </Button>
        </ErrorArea>
      ) : isPending ? (
        <TableArea $refreshing={false} role="status" aria-label="Carregando preços">
          <SkeletonRows>
            {Array.from({ length: SKELETON_ROWS }, (_, index) => (
              <Skeleton key={index} height="20px" />
            ))}
          </SkeletonRows>
        </TableArea>
      ) : data.items.length === 0 ? (
        <EmptyState>
          <Text variant="muted">Nenhuma tabela de preço cadastrada.</Text>
          <Button type="button" onClick={() => router.push("/precos/novo")}>
            Novo preço
          </Button>
        </EmptyState>
      ) : (
        <>
          <TableArea ref={tableRef} tabIndex={-1} $refreshing={isPlaceholderData} aria-busy={isPlaceholderData}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell head>Descrição</TableCell>
                  <TableCell head>Tipo</TableCell>
                  <TableCell head>Vigência</TableCell>
                  <TableCell head>Categorias</TableCell>
                  <TableCell head>Situação</TableCell>
                  <TableCell head align="right">
                    Ações
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.items.map((preco) => {
                  const situacao = SITUACAO_BADGE[getSituacao(preco.ativo, preco.inicioVigencia, preco.fimVigencia, agora)];
                  const detalhe = `/precos/${preco.rotatividadeId}`;

                  return (
                    <TableRow
                      key={preco.rotatividadeId}
                      clickable
                      onClick={() => router.push(ROW_CLICK_TARGET === "editar" ? `${detalhe}/editar` : detalhe)}
                    >
                      <TableCell data-label="Descrição">
                        <Description>{preco.descricao}</Description>
                      </TableCell>
                      <TableCell data-label="Tipo">{getTipoRegraLabel(preco.tipoRegra)}</TableCell>
                      <TableCell data-label="Vigência" numeric>
                        {formatVigencia(preco.inicioVigencia, preco.fimVigencia)}
                      </TableCell>
                      <TableCell data-label="Categorias">
                        <CategoryList>{formatCategorias(preco)}</CategoryList>
                      </TableCell>
                      <TableCell data-label="Situação">
                        <StatusBadge tone={situacao.tone}>{situacao.label}</StatusBadge>
                      </TableCell>
                      <TableCell data-label="Ações" align="right">
                        <RowActions onClick={(event) => event.stopPropagation()}>
                          <Link href={detalhe} aria-label={`Ver ${preco.descricao}`}>
                            Ver
                          </Link>
                          <Link href={`${detalhe}/editar`} aria-label={`Editar ${preco.descricao}`}>
                            Editar
                          </Link>
                        </RowActions>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableArea>
          <Pagination
            page={data.page}
            totalPages={data.totalPages}
            totalRecords={data.totalRecords}
            pageSize={data.pageSize}
            onPageChange={goToPage}
          />
        </>
      )}
    </Page>
  );
}
