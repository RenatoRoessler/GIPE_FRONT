"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/Button";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { Input } from "@/components/ui/Input";
import { KeyBoardGrid, type KeyBoardLinha } from "@/components/ui/KeyBoardGrid";
import { NumberStepper } from "@/components/ui/NumberStepper";
import { Skeleton } from "@/components/ui/Skeleton";
import { Text } from "@/components/ui/Text";
import { Toast } from "@/components/ui/Toast";
import { useToast } from "@/hooks/useToast";
import { acrescentarPosicoes, criarQuadro } from "@/lib/api/services/quadroChaves";
import { QUADRO_SEM_GANCHO_MESSAGE, quadroFormSchema } from "@/lib/schemas/quadroChaves";
import type { QuadroChaves } from "@/types/quadroChaves";
import {
  diffAcrescimo,
  gerarPayload,
  MAX_COLUNAS,
  MAX_LINHAS,
  rotuloGancho,
  rotulosLinhas,
  totalEmUso,
} from "../gancho";
import { QUADROS_QUERY_KEY } from "../quadrosKeys";
import { useQuadros } from "../useQuadros";
import { Dimensoes, FormPage, LinkButton, Page, PreviaTitulo, PreviaTopo, Rodape } from "../Quadros.styles";

const LISTA_HREF = "/quadros-chaves";
const LINHAS_INICIAIS = 3;
const COLUNAS_INICIAIS = 4;

export interface QuadroFormProps {
  // Com o id, acrescenta posições a um quadro existente; sem ele, cria um quadro novo.
  patioQuadroId?: number;
}

type Valores = { nome: string; linhas: number; colunas: number; foraDeUso: string[] };

function rotulosExistentes(quadro: QuadroChaves): Set<string> {
  return new Set(quadro.linhas.flatMap((linha) => linha.colunas.map((posicao) => rotuloGancho(linha.linha.toUpperCase(), posicao.coluna))));
}

// Ao acrescentar, o quadro começa no tamanho atual e as posições que ele não tem (fora de uso de antes) seguem fora de uso:
// salvar sem mexer em nada não recria ganchos.
function valoresDoQuadro(quadro: QuadroChaves): Valores {
  const linhas = Math.max(quadro.linhas.length, 1);
  const colunas = Math.max(1, ...quadro.linhas.flatMap((linha) => linha.colunas.map((posicao) => posicao.coluna)));
  const existentes = rotulosExistentes(quadro);
  const foraDeUso = rotulosLinhas(linhas).flatMap((linha) =>
    Array.from({ length: colunas }, (_, i) => rotuloGancho(linha, i + 1)).filter((rotulo) => !existentes.has(rotulo)),
  );
  return { nome: quadro.nome, linhas, colunas, foraDeUso };
}

const VALORES_NOVOS: Valores = { nome: "", linhas: LINHAS_INICIAIS, colunas: COLUNAS_INICIAIS, foraDeUso: [] };

export function QuadroForm({ patioQuadroId }: QuadroFormProps) {
  const { data, isPending, isError, error } = useQuadros();

  if (patioQuadroId === undefined) {
    return <Formulario />;
  }
  if (isPending) {
    return (
      <Page role="status" aria-label="Carregando">
        <Skeleton height="32px" width="240px" />
        <Skeleton height="240px" radius="18px" />
      </Page>
    );
  }
  const quadro = data?.find((item) => item.patioQuadroId === patioQuadroId);
  if (isError || !quadro) {
    return (
      <Page>
        <Text variant="heading" as="h1">
          Adicionar posições
        </Text>
        <ErrorBanner role="alert">
          {isError ? `Não foi possível carregar o quadro. ${error.message}` : "Quadro não encontrado ou inativo."}
        </ErrorBanner>
      </Page>
    );
  }
  return <Formulario quadro={quadro} />;
}

function Formulario({ quadro }: { quadro?: QuadroChaves }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { toast, showToast, dismissToast } = useToast();
  const acrescentando = quadro !== undefined;
  const [valores, setValores] = useState<Valores>(() => (quadro ? valoresDoQuadro(quadro) : VALORES_NOVOS));
  const [erroServidor, setErroServidor] = useState<string | null>(null);
  const [erroNome, setErroNome] = useState<string | null>(null);
  const [tentou, setTentou] = useState(false);

  const existentes = quadro ? rotulosExistentes(quadro) : null;
  const novos = quadro ? diffAcrescimo(quadro, valores).reduce((soma, linha) => soma + linha.colunas.length, 0) : 0;
  const total = acrescentando ? novos : totalEmUso(valores);

  const parsed = quadroFormSchema.safeParse(valores);
  const erros: Partial<Record<"nome" | "linhas" | "colunas" | "foraDeUso", string>> = {};
  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      const campo = issue.path[0] as keyof typeof erros;
      erros[campo] ??= issue.message;
    }
  }
  // Ao acrescentar, "nenhum gancho em uso" não se aplica: o que vale é haver posição nova.
  if (acrescentando) {
    delete erros.foraDeUso;
  }
  const semNovidade = acrescentando && novos === 0;
  const invalido = Object.keys(erros).length > 0 || semNovidade;

  const mutation = useMutation({
    mutationFn: async (enviar: Valores) =>
      quadro
        ? acrescentarPosicoes(quadro.patioQuadroId, diffAcrescimo(quadro, enviar))
        : criarQuadro({ nome: enviar.nome.trim(), linhas: gerarPayload(enviar) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUADROS_QUERY_KEY }),
  });

  function atualizar(parcial: Partial<Valores>) {
    setValores((atual) => ({ ...atual, ...parcial }));
    setErroServidor(null);
    setErroNome(null);
  }

  function alternar(id: string | number) {
    const rotulo = String(id);
    atualizar({
      foraDeUso: valores.foraDeUso.includes(rotulo)
        ? valores.foraDeUso.filter((item) => item !== rotulo)
        : [...valores.foraDeUso, rotulo],
    });
  }

  function falhou(err: unknown) {
    const mensagem = err instanceof Error ? err.message : "Ocorreu um erro inesperado.";
    // O back recusa nome vazio, grande demais ou já usado com 400 e a mensagem cita o nome.
    if (/nome/i.test(mensagem)) {
      setErroNome(mensagem);
    } else {
      setErroServidor(mensagem);
    }
  }

  function salvar(depois: "lista" | "outro") {
    setTentou(true);
    if (invalido) {
      return;
    }
    mutation.mutate(valores, {
      onSuccess: () => {
        if (depois === "outro") {
          showToast(`Quadro ${valores.nome.trim()} salvo.`);
          setValores(VALORES_NOVOS);
          setTentou(false);
        } else {
          router.push(LISTA_HREF);
        }
      },
      onError: falhou,
    });
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    salvar("lista");
  }

  const linhasGrade: KeyBoardLinha[] = rotulosLinhas(valores.linhas).map((linha) => ({
    rotulo: linha,
    ganchos: Array.from({ length: valores.colunas }, (_, i) => {
      const rotulo = rotuloGancho(linha, i + 1);
      return {
        id: rotulo,
        coluna: i + 1,
        rotulo,
        estado: valores.foraDeUso.includes(rotulo) ? ("fora" as const) : ("livre" as const),
        bloqueado: existentes?.has(rotulo) ?? false,
      };
    }),
  }));

  const enviando = mutation.isPending;
  const mostrarErros = tentou;

  return (
    <FormPage onSubmit={handleSubmit} noValidate>
      <div>
        <Text variant="heading" as="h1">
          {acrescentando ? "Adicionar posições" : "Configurar quadro"}
        </Text>
        <Text variant="muted">Mais › Quadros de chaves</Text>
      </div>

      <Input
        label="Nome do quadro"
        value={valores.nome}
        maxLength={100}
        readOnly={acrescentando}
        disabled={enviando}
        onChange={(event) => atualizar({ nome: event.target.value })}
        error={erroNome ?? (mostrarErros ? erros.nome : undefined)}
        placeholder="Ex.: Recepção"
      />

      <Dimensoes>
        <NumberStepper
          label="Linhas"
          value={valores.linhas}
          min={1}
          max={MAX_LINHAS}
          hint={`A–${rotulosLinhas(valores.linhas).at(-1)}`}
          disabled={enviando}
          onChange={(linhas) => atualizar({ linhas })}
        />
        <NumberStepper
          label="Colunas"
          value={valores.colunas}
          min={1}
          max={MAX_COLUNAS}
          hint={`1–${valores.colunas}`}
          disabled={enviando}
          onChange={(colunas) => atualizar({ colunas })}
        />
      </Dimensoes>
      {erros.colunas && <ErrorBanner role="alert">{erros.colunas}</ErrorBanner>}

      <PreviaTopo>
        <PreviaTitulo>
          {acrescentando
            ? `Prévia · ${total} ${total === 1 ? "novo gancho" : "novos ganchos"}`
            : `Prévia · ${total} ${total === 1 ? "gancho" : "ganchos"}`}
        </PreviaTitulo>
        <Text variant="muted">Toque para marcar fora de uso</Text>
      </PreviaTopo>
      <KeyBoardGrid linhas={linhasGrade} modo="configurar" onToggle={alternar} aria-label="Prévia do quadro" />
      {!acrescentando && erros.foraDeUso && <Text variant="error" role="alert">{QUADRO_SEM_GANCHO_MESSAGE}.</Text>}
      {semNovidade && <Text variant="muted">Aumente linhas ou colunas, ou religue um gancho, para acrescentar posições.</Text>}

      {erroServidor && <ErrorBanner role="alert">{erroServidor}</ErrorBanner>}

      <Rodape>
        {!acrescentando && (
          <LinkButton type="button" disabled={enviando} onClick={() => salvar("outro")}>
            + Adicionar outro quadro
          </LinkButton>
        )}
        <Button type="submit" disabled={enviando || (!acrescentando && Boolean(erros.foraDeUso))}>
          {enviando ? "Salvando…" : acrescentando ? "Salvar posições" : "Salvar quadro"}
        </Button>
      </Rodape>

      {toast && <Toast message={toast.message} variant={toast.variant} onDismiss={dismissToast} />}
    </FormPage>
  );
}
