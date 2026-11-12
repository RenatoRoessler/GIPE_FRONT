"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useRef, useState, type KeyboardEvent } from "react";
import { ErroSemPermissao } from "@/components/layout/ErroSemPermissao";
import { BackButton } from "@/components/ui/BackButton";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Skeleton } from "@/components/ui/Skeleton";
import { Toast } from "@/components/ui/Toast";
import { useCan } from "@/hooks/useCan";
import { useIsMobile } from "@/hooks/useMediaQuery";
import { useToast } from "@/hooks/useToast";
import { ApiError } from "@/lib/api/errors";
import { AREA } from "@/lib/permissoes";
import type { Servico } from "@/types/servico";
import { ehSituacao, filtrarServicos, lerServicoDaUrl, SITUACOES, type SituacaoFiltro } from "../catalogo";
import { PARAM_ABA, PARAM_SERVICO } from "../params";
import { ServicoDetalhe } from "../ServicoDetalhe";
import { ServicoFormModal } from "../ServicoFormModal";
import { ServicoListItem } from "../ServicoListItem";
import { useServicoMutations, useServicos } from "../useServicos";
import {
  Barra,
  ColunaDetalhe,
  ColunaLista,
  Contagem,
  EsqueletoLista,
  Estado,
  Filtros,
  Itens,
  Moldura,
  Voltar,
} from "./ServicosMasterDetail.styles";

function contar(total: number): string {
  return total === 1 ? "1 serviço" : `${total} serviços`;
}

// Catálogo em lista e detalhe. A seleção fica no endereço (`?servico=`) para o botão Voltar e os links funcionarem; sem
// seleção, a tela larga mostra o primeiro da lista e o celular mostra só a lista.
export function ServicosMasterDetail() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const celular = useIsMobile();
  const servicos = useServicos();
  const { inativar } = useServicoMutations();
  const podeEditar = useCan(AREA.ServicosCatalogo);
  const { toast, showToast, dismissToast } = useToast();
  // Formulário aberto: `null` fechado, `"novo"` cadastro ou o serviço em edição. `inativando` é o serviço a confirmar.
  const [formulario, setFormulario] = useState<"novo" | Servico | null>(null);
  const [inativando, setInativando] = useState<Servico | null>(null);

  const [situacao, setSituacao] = useState<SituacaoFiltro>("ativos");
  const [q, setQ] = useState("");
  const itensRef = useRef<HTMLDivElement>(null);

  const idNaUrl = lerServicoDaUrl(searchParams.get(PARAM_SERVICO));
  const todos = servicos.data ?? [];
  const filtrados = filtrarServicos(todos, { situacao, q });
  const urlDaAba = `${pathname}?${PARAM_ABA}=catalogo`;

  // A seleção do endereço vale mesmo fora do filtro (um serviço inativo aberto por link). Sem ela, a tela larga abre o primeiro.
  const idSelecionado = idNaUrl ?? (celular ? null : (filtrados[0]?.id ?? null));
  const selecionado = idSelecionado === null ? undefined : todos.find((servico) => servico.id === idSelecionado);
  const naoExiste = servicos.isSuccess && idNaUrl !== null && selecionado === undefined;

  function selecionar(id: number) {
    router.push(`${urlDaAba}&${PARAM_SERVICO}=${id}`, { scroll: false });
  }

  function voltarParaLista() {
    router.replace(urlDaAba, { scroll: false });
  }

  function salvo(mensagem: string, gravado: Servico | null) {
    setFormulario(null);
    showToast(mensagem);
    // O serviço gravado fica selecionado, também na tela larga e depois de um cadastro.
    if (gravado) selecionar(gravado.id);
  }

  function confirmarInativacao() {
    const alvo = inativando;
    if (!alvo) return;
    inativar.mutate(alvo.id, {
      onSuccess: () => showToast("Serviço inativado."),
      onError: (erro) => showToast(erro.message, "error"),
      onSettled: () => setInativando(null),
    });
  }

  function limparBusca() {
    setQ("");
    setSituacao("todos");
  }

  // Setas movem o foco entre os itens; Enter ou Espaço seleciona, como em qualquer botão.
  function aoTeclar(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
    const botoes = Array.from(itensRef.current?.querySelectorAll<HTMLButtonElement>("button") ?? []);
    const atual = botoes.indexOf(document.activeElement as HTMLButtonElement);
    if (atual === -1) return;
    event.preventDefault();
    botoes[atual + (event.key === "ArrowDown" ? 1 : -1)]?.focus();
  }

  if (servicos.isError) {
    const erro = servicos.error;
    if (erro instanceof ApiError && erro.kind === "forbidden") {
      return <ErroSemPermissao />;
    }
    return (
      <Estado>
        <ErrorBanner role="alert">{erro.message}</ErrorBanner>
        <Button variant="secondary" onClick={() => void servicos.refetch()}>
          Tentar novamente
        </Button>
      </Estado>
    );
  }

  const lista = (
    <ColunaLista aria-label="Lista de serviços">
      <Filtros>
        <Input
          label="Buscar serviço"
          type="search"
          value={q}
          placeholder="Buscar serviço"
          autoComplete="off"
          onChange={(event) => setQ(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Escape") setQ("");
          }}
        />
        <Select
          label="Situação"
          hideLabel
          value={situacao}
          onChange={(event) => {
            if (ehSituacao(event.target.value)) setSituacao(event.target.value);
          }}
        >
          {SITUACOES.map((item) => (
            <option key={item.id} value={item.id}>
              {item.label}
            </option>
          ))}
        </Select>
        {servicos.isSuccess && (
          <Contagem aria-live="polite">{contar(filtrados.length)}</Contagem>
        )}
      </Filtros>

      <Itens ref={itensRef} onKeyDown={aoTeclar}>
        {servicos.isPending ? (
          <EsqueletoLista role="status" aria-label="Carregando o catálogo">
            {Array.from({ length: 8 }, (_, indice) => (
              <Skeleton key={indice} height="56px" radius="10px" />
            ))}
          </EsqueletoLista>
        ) : todos.length === 0 ? (
          <Estado>
            <p>Nenhum serviço cadastrado.</p>
            {podeEditar && <Button onClick={() => setFormulario("novo")}>Novo serviço</Button>}
          </Estado>
        ) : filtrados.length === 0 ? (
          <Estado>
            <p>Nenhum serviço encontrado.</p>
            <Button variant="secondary" size="sm" onClick={limparBusca}>
              Limpar busca
            </Button>
          </Estado>
        ) : (
          filtrados.map((servico) => (
            <ServicoListItem key={servico.id} servico={servico} selecionado={servico.id === idSelecionado} onSelecionar={selecionar} />
          ))
        )}
      </Itens>
    </ColunaLista>
  );

  function conteudoDoDetalhe() {
    if (servicos.isPending) {
      return (
        <EsqueletoLista role="status" aria-label="Carregando o serviço">
          <Skeleton height="32px" width="60%" />
          <Skeleton height="96px" radius="14px" />
          <Skeleton height="180px" radius="14px" />
        </EsqueletoLista>
      );
    }
    if (naoExiste) {
      return (
        <Estado>
          <p>Este serviço não existe mais.</p>
          <Button variant="secondary" size="sm" onClick={voltarParaLista}>
            Ver os serviços
          </Button>
        </Estado>
      );
    }
    if (selecionado) {
      return (
        <ServicoDetalhe
          servico={selecionado}
          acoes={
            podeEditar && (
              <>
                <Button variant="secondary" size="sm" onClick={() => setFormulario(selecionado)}>
                  Editar
                </Button>
                {selecionado.ativo && (
                  <Button variant="secondary" size="sm" onClick={() => setInativando(selecionado)}>
                    Inativar
                  </Button>
                )}
              </>
            )
          }
        />
      );
    }
    return (
      <Estado>
        <p>Selecione um serviço para ver os detalhes.</p>
      </Estado>
    );
  }

  // Celular: uma coluna por vez, a lista ou o detalhe do serviço escolhido com o botão de voltar.
  const emDetalheNoCelular = celular && idNaUrl !== null;

  return (
    <>
      {podeEditar && !emDetalheNoCelular && (
        <Barra>
          <Button onClick={() => setFormulario("novo")}>Novo serviço</Button>
        </Barra>
      )}
      {celular ? (
        <Moldura>
          {emDetalheNoCelular ? (
            <ColunaDetalhe aria-label="Detalhe do serviço">
              <Voltar>
                <BackButton onClick={voltarParaLista}>Serviços</BackButton>
              </Voltar>
              {conteudoDoDetalhe()}
            </ColunaDetalhe>
          ) : (
            lista
          )}
        </Moldura>
      ) : (
        <Moldura>
          {lista}
          <ColunaDetalhe aria-label="Detalhe do serviço">{conteudoDoDetalhe()}</ColunaDetalhe>
        </Moldura>
      )}

      {formulario !== null && (
        <ServicoFormModal servico={formulario === "novo" ? undefined : formulario} onClose={() => setFormulario(null)} onSaved={salvo} />
      )}
      {inativando && (
        <ConfirmDialog
          title={`Inativar ${inativando.nome}?`}
          message="Ele deixa de aparecer ao acrescentar serviços a veículos. Os veículos que já o têm continuam com ele e o histórico é mantido."
          confirmLabel="Inativar"
          cancelLabel="Cancelar"
          onConfirm={confirmarInativacao}
          onCancel={() => setInativando(null)}
        />
      )}
      {toast && <Toast message={toast.message} variant={toast.variant} onDismiss={dismissToast} />}
    </>
  );
}
