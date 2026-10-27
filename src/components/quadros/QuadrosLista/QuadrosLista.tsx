"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ErroSemPermissao } from "@/components/layout/ErroSemPermissao";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { KeyBoardGrid } from "@/components/ui/KeyBoardGrid";
import { Modal } from "@/components/ui/Modal";
import { Skeleton } from "@/components/ui/Skeleton";
import { Text } from "@/components/ui/Text";
import { Toast } from "@/components/ui/Toast";
import { useToast } from "@/hooks/useToast";
import { useCan } from "@/hooks/useCan";
import { ApiError, isForbiddenError } from "@/lib/api/errors";
import { AREA } from "@/lib/permissoes";
import type { QuadroChaves } from "@/types/quadroChaves";
import { contarLivres, contarPosicoes, linhasDaGrade, rotuloDoGancho } from "../gancho";
import { useExcluirPosicao, useInativarQuadro } from "../useQuadrosMutations";
import { useQuadros } from "../useQuadros";
import {
  Acoes,
  EmptyState,
  ErrorArea,
  Header,
  Lista,
  Page,
  QuadroCard,
  QuadroNome,
  QuadroResumo,
  QuadroTopo,
  SkeletonList,
} from "../Quadros.styles";

const NOVO_QUADRO_HREF = "/quadros-chaves/novo";

type Pendencia =
  | { kind: "inativar"; quadro: QuadroChaves }
  | { kind: "excluir"; quadro: QuadroChaves; patioQuadroChaveId: number }
  // Bloqueio do back (chave de veículo no pátio): a mensagem diz quais placas.
  | { kind: "bloqueio"; titulo: string; mensagem: string }
  | null;

function resumo(quadro: QuadroChaves): string {
  const total = contarPosicoes(quadro);
  const livres = contarLivres(quadro);
  return `${total} ${total === 1 ? "gancho" : "ganchos"} · ${livres} ${livres === 1 ? "livre" : "livres"}`;
}

export function QuadrosLista() {
  const router = useRouter();
  const podeGerenciar = useCan(AREA.QuadroChaves);
  const { data, isPending, isError, error, refetch, isFetching } = useQuadros();
  const inativar = useInativarQuadro();
  const excluir = useExcluirPosicao();
  const { toast, showToast, dismissToast } = useToast();
  const [pendencia, setPendencia] = useState<Pendencia>(null);
  const [expandido, setExpandido] = useState<number | null>(null);

  if (isError && isForbiddenError(error)) {
    return <ErroSemPermissao />;
  }

  function falhou(err: unknown, titulo: string) {
    const mensagem = err instanceof Error ? err.message : "Ocorreu um erro inesperado.";
    // 400: a ação foi recusada por regra de negócio (chave de veículo no pátio).
    if (err instanceof ApiError && err.kind === "validation") {
      setPendencia({ kind: "bloqueio", titulo, mensagem });
      return;
    }
    setPendencia(null);
    showToast(mensagem, "error");
  }

  function confirmar() {
    if (pendencia?.kind === "inativar") {
      const { quadro } = pendencia;
      inativar.mutate(quadro.patioQuadroId, {
        onSuccess: () => {
          setPendencia(null);
          showToast(`Quadro ${quadro.nome} inativado.`);
        },
        onError: (err) => falhou(err, "Não foi possível inativar o quadro"),
      });
    } else if (pendencia?.kind === "excluir") {
      const rotulo = rotuloDoGancho(pendencia.quadro, pendencia.patioQuadroChaveId) ?? "";
      excluir.mutate(pendencia.patioQuadroChaveId, {
        onSuccess: () => {
          setPendencia(null);
          showToast(`Gancho ${rotulo} excluído.`);
        },
        onError: (err) => falhou(err, "Não foi possível excluir o gancho"),
      });
    }
  }

  return (
    <Page>
      <Header>
        <div>
          <Text variant="heading" as="h1">
            Quadros de chaves
          </Text>
          <Text variant="muted">Onde as chaves ficam penduradas no pátio.</Text>
        </div>
        {podeGerenciar && (
          <Button type="button" onClick={() => router.push(NOVO_QUADRO_HREF)}>
            Novo quadro
          </Button>
        )}
      </Header>

      {isPending && (
        <SkeletonList role="status" aria-label="Carregando">
          <Skeleton height="120px" radius="18px" />
          <Skeleton height="120px" radius="18px" />
        </SkeletonList>
      )}

      {isError && (
        <ErrorArea>
          <ErrorBanner role="alert">Não foi possível carregar os quadros. {error.message}</ErrorBanner>
          <Button type="button" variant="secondary" onClick={() => void refetch()} disabled={isFetching}>
            Tentar novamente
          </Button>
        </ErrorArea>
      )}

      {data && data.length === 0 && (
        <EmptyState>
          <Text variant="muted">
            Nenhum quadro cadastrado. Cadastre o quadro da parede para saber onde cada chave fica.
          </Text>
          {podeGerenciar && (
            <Button type="button" onClick={() => router.push(NOVO_QUADRO_HREF)}>
              Criar primeiro quadro
            </Button>
          )}
        </EmptyState>
      )}

      {data && data.length > 0 && (
        <Lista>
          {data.map((quadro) => {
            const aberto = expandido === quadro.patioQuadroId;
            return (
              <QuadroCard key={quadro.patioQuadroId} aria-label={quadro.nome}>
                <QuadroTopo>
                  <QuadroNome>{quadro.nome}</QuadroNome>
                  <QuadroResumo>{resumo(quadro)}</QuadroResumo>
                </QuadroTopo>
                <Acoes>
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    aria-expanded={aberto}
                    onClick={() => setExpandido(aberto ? null : quadro.patioQuadroId)}
                  >
                    {aberto ? "Ocultar quadro" : "Ver quadro"}
                  </Button>
                  {podeGerenciar && (
                    <>
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        onClick={() => router.push(`/quadros-chaves/${quadro.patioQuadroId}/posicoes`)}
                      >
                        Adicionar posições
                      </Button>
                      <Button type="button" size="sm" variant="danger" onClick={() => setPendencia({ kind: "inativar", quadro })}>
                        Inativar
                      </Button>
                    </>
                  )}
                </Acoes>
                {aberto && (
                  <>
                    <KeyBoardGrid
                      linhas={linhasDaGrade(quadro)}
                      modo="escolher"
                      aria-label={`Ganchos do quadro ${quadro.nome}`}
                      // Ganchos livres abrem a exclusão; os ocupados não são selecionáveis (o back também recusa).
                      onSelect={
                        podeGerenciar
                          ? (id) => setPendencia({ kind: "excluir", quadro, patioQuadroChaveId: Number(id) })
                          : undefined
                      }
                    />
                    {podeGerenciar && <Text variant="muted">Toque em um item livre para excluí-lo.</Text>}
                  </>
                )}
              </QuadroCard>
            );
          })}
        </Lista>
      )}

      {pendencia?.kind === "inativar" && (
        <ConfirmDialog
          title={`Inativar quadro ${pendencia.quadro.nome}?`}
          message="O quadro some da escolha de gancho e o nome fica livre para outro quadro."
          confirmLabel={inativar.isPending ? "Inativando…" : "Inativar"}
          cancelLabel="Cancelar"
          onConfirm={confirmar}
          onCancel={() => setPendencia(null)}
        />
      )}
      {pendencia?.kind === "excluir" && (
        <ConfirmDialog
          title={`Excluir o gancho ${rotuloDoGancho(pendencia.quadro, pendencia.patioQuadroChaveId) ?? ""}?`}
          message={`O gancho deixa de existir no quadro ${pendencia.quadro.nome}.`}
          confirmLabel={excluir.isPending ? "Excluindo…" : "Excluir"}
          cancelLabel="Cancelar"
          onConfirm={confirmar}
          onCancel={() => setPendencia(null)}
        />
      )}
      {pendencia?.kind === "bloqueio" && (
        <Modal
          open
          title={pendencia.titulo}
          onClose={() => setPendencia(null)}
          fullScreenOnMobile={false}
          footer={
            <Button type="button" onClick={() => setPendencia(null)} autoFocus>
              Entendi
            </Button>
          }
        >
          <Text variant="muted" role="alert">
            {pendencia.mensagem}
          </Text>
        </Modal>
      )}

      {toast && <Toast message={toast.message} variant={toast.variant} onDismiss={dismissToast} />}
    </Page>
  );
}
