"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Pagination } from "@/components/ui/Pagination";
import { Skeleton } from "@/components/ui/Skeleton";
import { Table, TableBody, TableCell, TableHead, TableRow } from "@/components/ui/Table";
import { Text } from "@/components/ui/Text";
import type { ToastVariant } from "@/components/ui/Toast";
import { formatDocumentoAuto } from "@/lib/documento";
import { buscaEhTexto } from "../agenda";
import type { Mensalista, SituacaoMensalista as Situacao } from "@/types/mensalista";
import { LISTA_URL } from "../aba";
import { EditIcon } from "../EditIcon";
import { PagamentoIcon } from "../PagamentoIcon";
import { ViewIcon } from "../ViewIcon";
import {
  formatCategoria,
  formatCelular,
  formatDocumentoMensalista,
  formatValor,
  formatVencimento,
} from "../format";
import { podeRegistrarPagamento } from "../pagamento";
import { ListError } from "../ListError";
import { SituacaoMensalista } from "../SituacaoMensalista";
import { derivarSituacao } from "../situacao";
import { useContratosMensalistas } from "../useContratosMensalistas";
import { useReenviarContrato } from "../useReenviarContrato";
import { VeiculosResumo } from "../VeiculosResumo";
import {
  EmptyState,
  IconButton,
  ListaRow,
  NomeLink,
  Primary,
  RowActions,
  SearchBox,
  SkeletonRows,
  SubText,
  TableArea,
  Toolbar,
  VerFichaIcone,
} from "../Mensalistas.styles";
import { MENSALISTAS_PAGE_SIZE } from "../useMensalistas";
import { useMensalistasDaLista } from "../useMensalistasDaLista";
import { useTiposMensalidade } from "../useTiposMensalidade";

const SKELETON_ROWS = 8;

export interface MensalistasListProps {
  onNovo: () => void;
  onEditar: (mensalista: Mensalista) => void;
  // Abre a ficha (veículos, condutores e contrato) do mensalista.
  onVerFicha: (mensalista: Mensalista) => void;
  // Abre o pagamento, levando a situação já derivada da linha.
  onReceberPagamento: (mensalista: Mensalista, situacao: Situacao) => void;
  onToast: (message: string, variant?: ToastVariant) => void;
  // Leva o usuário à aba de tipos (sem tipo ativo não dá para cadastrar mensalistas).
  onCriarTipo: () => void;
}

function parsePage(value: string | null): number {
  const page = Number(value);
  return Number.isInteger(page) && page >= 1 ? page : 1;
}

export function MensalistasList({
  onNovo,
  onEditar,
  onVerFicha,
  onReceberPagamento,
  onToast,
  onCriarTipo,
}: MensalistasListProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pagina = parsePage(searchParams.get("pagina"));
  const tableRef = useRef<HTMLDivElement>(null);
  // O termo fica só em estado local: o documento do cliente não vai para a URL.
  const [busca, setBusca] = useState("");

  const { data, isPending, isError, error, refetch, isFetching, isPlaceholderData, buscando, modoTexto } = useMensalistasDaLista(
    pagina,
    busca,
  );
  const { data: tipos } = useTiposMensalidade();
  const semTipoAtivo = tipos !== undefined && !tipos.some((tipo) => tipo.ativo);
  const contratos = useContratosMensalistas(data?.items ?? []);
  const { reenviar, reenviandoId } = useReenviarContrato({
    onSuccess: ({ email }) =>
      onToast(`Novo link enviado para ${email}. Vale por 7 dias; o link anterior deixa de funcionar.`),
    onError: (message) => onToast(message, "error"),
  });
  const agora = new Date();

  // Página fora do intervalo (ex.: registros removidos): volta para a última existente.
  useEffect(() => {
    if (data && data.totalPages > 0 && pagina > data.totalPages) {
      router.replace(`${LISTA_URL}&pagina=${data.totalPages}`, { scroll: false });
    }
  }, [data, pagina, router]);

  function goToPage(page: number) {
    router.replace(page > 1 ? `${LISTA_URL}&pagina=${page}` : LISTA_URL, { scroll: false });
    tableRef.current?.focus();
  }

  function changeBusca(value: string) {
    // Documento ganha a máscara; nome e placa ficam como digitados.
    setBusca(buscaEhTexto(value) ? value : formatDocumentoAuto(value));
    // Resultado novo: volta ao início da lista.
    if (pagina > 1) {
      router.replace(LISTA_URL, { scroll: false });
    }
  }

  const novoLabel = "Novo mensalista";
  const toolbar = (
    <Toolbar>
      <SearchBox>
        <Input
          label="Buscar por nome, placa, CPF ou CNPJ"
          value={busca}
          onChange={(event) => changeBusca(event.target.value)}
          inputMode="text"
          autoComplete="off"
          placeholder="Nome, placa ou início do documento"
        />
      </SearchBox>
      <Button type="button" onClick={semTipoAtivo ? onCriarTipo : onNovo}>
        {semTipoAtivo ? "Criar tipo de mensalidade" : novoLabel}
      </Button>
    </Toolbar>
  );

  if (isError) {
    return (
      <>
        {toolbar}
        <ListError error={error ?? new Error("Erro desconhecido.")} what="os mensalistas" onRetry={() => void refetch()} retrying={isFetching} />
      </>
    );
  }

  if (isPending || !data) {
    return (
      <>
        {/* Quem está buscando não pode perder o campo enquanto o conjunto completo chega (busca por nome ou placa). */}
        {busca !== "" && toolbar}
        <TableArea $refreshing={false} role="status" aria-label="Carregando mensalistas">
          <SkeletonRows>
            {Array.from({ length: SKELETON_ROWS }, (_, index) => (
              <Skeleton key={index} height="20px" />
            ))}
          </SkeletonRows>
        </TableArea>
      </>
    );
  }

  if (data.items.length === 0) {
    // Busca sem resultado: a barra de busca continua visível.
    if (buscando) {
      return (
        <>
          {toolbar}
          <EmptyState>
            <Text variant="muted">
              {modoTexto ? "Nenhum mensalista com esse nome ou placa." : "Nenhum mensalista com esse documento."}
            </Text>
            <Button type="button" variant="secondary" onClick={() => setBusca("")}>
              Limpar busca
            </Button>
          </EmptyState>
        </>
      );
    }

    return (
      <EmptyState>
        <Text variant="muted">Nenhum mensalista cadastrado.</Text>
        {semTipoAtivo && (
          <Text variant="muted">Crie um tipo de mensalidade antes de cadastrar mensalistas.</Text>
        )}
        <Button type="button" onClick={semTipoAtivo ? onCriarTipo : onNovo}>
          {semTipoAtivo ? "Criar tipo de mensalidade" : novoLabel}
        </Button>
      </EmptyState>
    );
  }

  return (
    <>
      {toolbar}
      <TableArea ref={tableRef} tabIndex={-1} $refreshing={isPlaceholderData} aria-busy={isPlaceholderData}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell head>Nome</TableCell>
              <TableCell head>Situação</TableCell>
              <TableCell head>Veículos</TableCell>
              <TableCell head>Documento</TableCell>
              <TableCell head>Tipo</TableCell>
              <TableCell head align="right">
                Mensalidade
              </TableCell>
              <TableCell head>Vencimento</TableCell>
              <TableCell head align="right">
                Ações
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.items.map((mensalista) => {
              const situacao = derivarSituacao(mensalista, contratos.get(mensalista.mensalistaId), agora);
              const pagamento = podeRegistrarPagamento(situacao);
              // Quem aguarda o 1º pagamento já tem o botão na célula de situação; as demais linhas liberadas ganham o ícone.
              const iconeDePagamento = pagamento.pode && situacao.kind !== "aguardando-pagamento";
              return (
              <ListaRow key={mensalista.mensalistaId}>
                <TableCell data-label="Nome">
                  <NomeLink type="button" onClick={() => onVerFicha(mensalista)}>
                    {mensalista.nome}
                  </NomeLink>
                  <SubText>{mensalista.email}</SubText>
                  <SubText>{formatCelular(mensalista.celular)}</SubText>
                </TableCell>
                <TableCell data-label="Situação">
                  <SituacaoMensalista
                    situacao={situacao}
                    nome={mensalista.nome}
                    onReenviar={() => reenviar(mensalista.mensalistaId)}
                    onReceberPagamento={() => onReceberPagamento(mensalista, situacao)}
                    reenviando={reenviandoId === mensalista.mensalistaId}
                  />
                </TableCell>
                <TableCell data-label="Veículos">
                  <VeiculosResumo
                    veiculos={mensalista.veiculos}
                    nome={mensalista.nome}
                    onAbrir={() => onVerFicha(mensalista)}
                  />
                </TableCell>
                <TableCell data-label="Documento" numeric>
                  {formatDocumentoMensalista(mensalista)}
                </TableCell>
                <TableCell data-label="Tipo">
                  <Primary>{mensalista.tipoMensal}</Primary>
                  <SubText>{formatCategoria(mensalista.categoria)}</SubText>
                </TableCell>
                <TableCell data-label="Mensalidade" align="right" numeric>
                  {formatValor(mensalista.valorMensalidade)}
                </TableCell>
                <TableCell data-label="Vencimento">{formatVencimento(mensalista.diaVencimento)}</TableCell>
                <TableCell data-label="Ações" align="right">
                  <RowActions>
                    <VerFichaIcone
                      type="button"
                      aria-label={`Ver ficha de ${mensalista.nome}`}
                      title="Ver ficha"
                      onClick={() => onVerFicha(mensalista)}
                    >
                      <ViewIcon />
                    </VerFichaIcone>
                    {iconeDePagamento && (
                      <IconButton
                        type="button"
                        aria-label={`Registrar pagamento de ${mensalista.nome}`}
                        title="Registrar pagamento"
                        onClick={() => onReceberPagamento(mensalista, situacao)}
                      >
                        <PagamentoIcon />
                      </IconButton>
                    )}
                    <IconButton
                      type="button"
                      aria-label={`Editar ${mensalista.nome}`}
                      title="Editar"
                      onClick={() => onEditar(mensalista)}
                    >
                      <EditIcon />
                    </IconButton>
                  </RowActions>
                </TableCell>
              </ListaRow>
              );
            })}
          </TableBody>
        </Table>
      </TableArea>
      <Pagination
        page={data.page}
        totalPages={data.totalPages}
        totalRecords={data.totalRecords}
        pageSize={MENSALISTAS_PAGE_SIZE}
        onPageChange={goToPage}
      />
    </>
  );
}
