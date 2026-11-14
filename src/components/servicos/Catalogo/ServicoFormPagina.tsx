"use client";

import { useRouter } from "next/navigation";
import { useCallback, useRef, useState } from "react";
import { ErroSemPermissao } from "@/components/layout/ErroSemPermissao";
import { Button } from "@/components/ui/Button";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { Skeleton } from "@/components/ui/Skeleton";
import { useCan } from "@/hooks/useCan";
import { useIsMobile } from "@/hooks/useMediaQuery";
import { ApiError } from "@/lib/api/errors";
import { AREA } from "@/lib/permissoes";
import { toServicoPayload } from "@/lib/schemas/servico";
import type { Servico } from "@/types/servico";
import { Esqueleto, Tela } from "../PaginaServicos.styles";
import { ServicosDesligados } from "../ServicosDesligados";
import { nomeJaExiste } from "../ServicoFormModal/validarNome";
import { useServicoMutations, useServicos } from "../useServicos";
import { AvisoDoCatalogo } from "./AvisoDoCatalogo";
import { InativarFolha } from "./InativarFolha";
import { URL_DO_CATALOGO } from "./rotas";
import { ServicoFormCelular } from "./ServicoFormCelular";
import { ServicoFormDesktop } from "./ServicoFormDesktop";
import { useServicoForm } from "./useServicoForm";

export const AVISOS_DO_CATALOGO = { criado: "Serviço cadastrado", atualizado: "Serviço atualizado", inativado: "Serviço inativado" } as const;
export type AvisoDoCatalogoId = keyof typeof AVISOS_DO_CATALOGO;

export function ServicoFormEsqueleto() {
  return (
    <Tela>
      <Esqueleto role="status" aria-label="Carregando o serviço">
        <Skeleton height="24px" width="120px" />
        <Skeleton height="48px" width="60%" />
        <Skeleton height="220px" radius="16px" />
        <Skeleton height="420px" radius="16px" />
      </Esqueleto>
    </Tela>
  );
}

interface ConteudoProps {
  servico?: Servico;
  ativos: Servico[];
}

// O formulário já com os dados em mãos: o estado é um só, e trocar de largura (página única ou três passos) não perde o digitado.
function ServicoFormConteudo({ servico, ativos }: ConteudoProps) {
  const router = useRouter();
  const celular = useIsMobile();
  const { criar, atualizar, inativar } = useServicoMutations();
  const mutacao = servico ? atualizar : criar;
  const [aviso, setAviso] = useState<string | null>(null);
  const [inativando, setInativando] = useState(false);
  const raiz = useRef<HTMLDivElement>(null);

  const nomeRepetido = useCallback((nome: string) => nomeJaExiste(nome, ativos, servico?.id), [ativos, servico?.id]);
  const form = useServicoForm(servico, nomeRepetido);
  const fecharAviso = useCallback(() => setAviso(null), []);

  const voltar = () => router.push(URL_DO_CATALOGO);
  const concluir = (id: AvisoDoCatalogoId) => router.push(`${URL_DO_CATALOGO}?aviso=${id}`);

  async function salvar(): Promise<boolean> {
    if (!form.validar()) {
      requestAnimationFrame(() => raiz.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus());
      return false;
    }
    const payload = toServicoPayload(form.valores);
    try {
      if (servico) await atualizar.mutateAsync({ id: servico.id, payload });
      else await criar.mutateAsync(payload);
    } catch {
      // O erro fica em `mutacao.error`, mostrado no topo do formulário.
      return false;
    }
    concluir(servico ? "atualizado" : "criado");
    return true;
  }

  async function confirmarInativacao() {
    if (!servico) return;
    try {
      await inativar.mutateAsync(servico.id);
    } catch (erro) {
      setInativando(false);
      setAviso(erro instanceof ApiError ? erro.message : "Não foi possível inativar o serviço.");
      return;
    }
    concluir("inativado");
  }

  const comum = {
    servico,
    form,
    salvando: mutacao.isPending,
    erroDoBack: mutacao.isError ? mutacao.error.message : undefined,
    podeInativar: true,
    onVoltar: voltar,
    onInativar: () => setInativando(true),
    onAviso: setAviso,
  };

  return (
    <div ref={raiz}>
      {celular ? (
        <ServicoFormCelular {...comum} nomeRepetido={nomeRepetido} onSalvar={salvar} />
      ) : (
        <Tela style={{ maxWidth: 760 }}>
          <ServicosDesligados />
          <ServicoFormDesktop {...comum} onSalvar={() => void salvar()} />
        </Tela>
      )}
      {inativando && servico && (
        <InativarFolha nome={servico.nome} celular={celular} inativando={inativar.isPending} onManter={() => setInativando(false)} onConfirmar={() => void confirmarInativacao()} />
      )}
      {aviso && <AvisoDoCatalogo texto={aviso} onFechar={fecharAviso} />}
    </div>
  );
}

export interface ServicoFormPaginaProps {
  // Sem id, cadastra um serviço novo; com id, edita o serviço.
  id?: number;
}

// A página do cadastro e da edição de um serviço (`/servicos/catalogo/novo` e `/servicos/catalogo/<id>`). Só quem mantém o
// catálogo (Administrador e Gerente) chega aqui; a lista de ativos serve para achar o serviço e para avisar de nome repetido.
export function ServicoFormPagina({ id }: ServicoFormPaginaProps) {
  const router = useRouter();
  const podeEditar = useCan(AREA.ServicosCatalogo);
  const servicos = useServicos(true);

  if (servicos.isError) {
    if (servicos.error instanceof ApiError && servicos.error.kind === "forbidden") return <ErroSemPermissao />;
    return (
      <Tela>
        <ErrorBanner role="alert">{servicos.error.message}</ErrorBanner>
        <Button variant="secondary" onClick={() => void servicos.refetch()}>
          Tentar novamente
        </Button>
      </Tela>
    );
  }
  if (servicos.isPending) return <ServicoFormEsqueleto />;

  if (!podeEditar) {
    return (
      <Tela>
        <ErroSemPermissao />
      </Tela>
    );
  }

  const ativos = servicos.data;
  const servico = id === undefined ? undefined : ativos.find((item) => item.id === id);
  if (id !== undefined && !servico) {
    return (
      <Tela>
        <p>Este serviço não existe mais.</p>
        <Button variant="secondary" onClick={() => router.push(URL_DO_CATALOGO)}>
          Ver os serviços
        </Button>
      </Tela>
    );
  }

  return <ServicoFormConteudo key={id ?? "novo"} servico={servico} ativos={ativos} />;
}
