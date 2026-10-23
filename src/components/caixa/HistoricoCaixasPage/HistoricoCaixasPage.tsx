"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { ErroSemPermissao } from "@/components/layout/ErroSemPermissao";
import { Button } from "@/components/ui/Button";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { Input } from "@/components/ui/Input";
import { Link } from "@/components/ui/Link";
import { Pagination } from "@/components/ui/Pagination";
import { Skeleton } from "@/components/ui/Skeleton";
import { Table, TableBody, TableCell, TableHead, TableRow } from "@/components/ui/Table";
import { Text } from "@/components/ui/Text";
import { isForbiddenError } from "@/lib/api/errors";
import { periodoSchema } from "@/lib/schemas/caixa";
import { Page, TitleGroup, VisuallyHidden } from "../Caixa.styles";
import { Diferenca } from "../Diferenca";
import { formatDateTime, formatMoeda } from "../format";
import { HISTORICO_PAGE_SIZE, useHistoricoCaixas } from "../useHistoricoCaixas";
import { Estado, Esqueletos, FiltroForm } from "./HistoricoCaixasPage.styles";
import { historicoUrl, lerData, lerPagina } from "./historicoUrl";

interface FiltroPeriodoProps {
  de: string;
  ate: string;
  disabled: boolean;
  onAplicar: (de: string, ate: string) => void;
}

// Datas opcionais; só impede data inicial depois da final, sem chamar a API.
function FiltroPeriodoCaixas({ de, ate, disabled, onAplicar }: FiltroPeriodoProps) {
  const [rascunho, setRascunho] = useState({ de, ate });
  const [erro, setErro] = useState<string | undefined>();

  function submeter(event: React.FormEvent) {
    event.preventDefault();
    const resultado = periodoSchema.safeParse({ dataInicio: rascunho.de, dataFim: rascunho.ate });
    if (!resultado.success) {
      setErro(resultado.error.issues[0]?.message);
      return;
    }
    setErro(undefined);
    onAplicar(rascunho.de, rascunho.ate);
  }

  function limpar() {
    setRascunho({ de: "", ate: "" });
    setErro(undefined);
    onAplicar("", "");
  }

  return (
    <FiltroForm noValidate onSubmit={submeter} aria-label="Filtrar por período">
      <Input label="De" type="date" value={rascunho.de} onChange={(event) => setRascunho((atual) => ({ ...atual, de: event.target.value }))} error={erro} disabled={disabled} />
      <Input label="Até" type="date" value={rascunho.ate} onChange={(event) => setRascunho((atual) => ({ ...atual, ate: event.target.value }))} disabled={disabled} />
      <Button type="submit" disabled={disabled}>
        Filtrar
      </Button>
      {(de || ate) && (
        <Button type="button" variant="secondary" onClick={limpar} disabled={disabled}>
          Limpar período
        </Button>
      )}
    </FiltroForm>
  );
}

// Caixas já fechados (Administrador e Gerente): período e página ficam na URL.
export function HistoricoCaixasPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const de = lerData(searchParams.get("de"));
  const ate = lerData(searchParams.get("ate"));
  const pagina = lerPagina(searchParams.get("pagina"));
  const { data, isPending, isError, error, isFetching, refetch } = useHistoricoCaixas({ dataInicio: de, dataFim: ate, pagina });

  function ir(proximo: { de: string; ate: string; pagina: number }) {
    router.replace(historicoUrl(proximo), { scroll: false });
  }

  function conteudo() {
    if (isError && data === undefined) {
      if (isForbiddenError(error)) {
        return <ErroSemPermissao />;
      }
      return (
        <Estado>
          <ErrorBanner role="alert">{error.message}</ErrorBanner>
          <Button type="button" variant="secondary" onClick={() => void refetch()} disabled={isFetching}>
            Tentar novamente
          </Button>
        </Estado>
      );
    }

    if (isPending || data === undefined) {
      return (
        <Esqueletos role="status" aria-busy="true">
          <VisuallyHidden>Carregando caixas anteriores…</VisuallyHidden>
          {[0, 1, 2, 3].map((indice) => (
            <Skeleton key={indice} height="44px" />
          ))}
        </Esqueletos>
      );
    }

    if (data.items.length === 0) {
      return (
        <Estado>
          <Text variant="muted">{de || ate ? "Nenhum caixa fechado nesse período." : "Ainda não há caixas fechados."}</Text>
        </Estado>
      );
    }

    const comDiferenca = data.items.some((caixa) => caixa.totalDiferenca !== undefined && caixa.totalDiferenca !== null);

    return (
      <>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell head>Aberto em</TableCell>
              <TableCell head>Fechado em</TableCell>
              <TableCell head>Abriu</TableCell>
              <TableCell head>Fechou</TableCell>
              <TableCell head align="right">
                Entradas
              </TableCell>
              <TableCell head align="right">
                Saídas
              </TableCell>
              <TableCell head align="right">
                Fechamento
              </TableCell>
              {comDiferenca && (
                <TableCell head align="right">
                  Diferença
                </TableCell>
              )}
              <TableCell head align="right">
                Extrato
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.items.map((caixa) => (
              <TableRow key={caixa.caixaId}>
                <TableCell data-label="Aberto em">{formatDateTime(caixa.dataHoraAbertura)}</TableCell>
                <TableCell data-label="Fechado em">{formatDateTime(caixa.dataHoraFechamento ?? null)}</TableCell>
                <TableCell data-label="Abriu">{caixa.abriu || "—"}</TableCell>
                <TableCell data-label="Fechou">{caixa.fechou || "—"}</TableCell>
                <TableCell align="right" numeric data-label="Entradas">
                  {formatMoeda(caixa.valorTotalEntrada)}
                </TableCell>
                <TableCell align="right" numeric data-label="Saídas">
                  {formatMoeda(caixa.valorTotalSaida)}
                </TableCell>
                <TableCell align="right" numeric data-label="Fechamento">
                  {formatMoeda(caixa.valorTotalFechamento)}
                </TableCell>
                {comDiferenca && (
                  <TableCell align="right" numeric data-label="Diferença">
                    <Diferenca value={caixa.totalDiferenca ?? null} />
                  </TableCell>
                )}
                <TableCell align="right" data-label="Extrato">
                  <Link href={`/caixa/historico/${caixa.caixaId}`} aria-label={`Ver extrato do caixa aberto em ${formatDateTime(caixa.dataHoraAbertura)}`}>
                    Ver extrato
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {data.totalPages > 1 && (
          <Pagination
            page={data.page}
            totalPages={data.totalPages}
            totalRecords={data.totalRecords}
            pageSize={data.pageSize || HISTORICO_PAGE_SIZE}
            onPageChange={(proxima) => ir({ de, ate, pagina: proxima })}
          />
        )}
      </>
    );
  }

  return (
    <Page>
      <TitleGroup>
        <Text variant="heading" as="h1">
          Caixas anteriores
        </Text>
        <Link href="/caixa">Voltar ao caixa</Link>
      </TitleGroup>
      <FiltroPeriodoCaixas key={`${de}|${ate}`} de={de} ate={ate} disabled={isFetching && !isError} onAplicar={(novoDe, novoAte) => ir({ de: novoDe, ate: novoAte, pagina: 1 })} />
      {conteudo()}
    </Page>
  );
}
