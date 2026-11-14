"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { ErroSemPermissao } from "@/components/layout/ErroSemPermissao";
import { Button } from "@/components/ui/Button";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { Skeleton } from "@/components/ui/Skeleton";
import { useCan } from "@/hooks/useCan";
import { ApiError } from "@/lib/api/errors";
import { AREA } from "@/lib/permissoes";
import { AVISOS_DO_CATALOGO, type AvisoDoCatalogoId } from "../Catalogo/ServicoFormPagina";
import { AvisoDoCatalogo } from "../Catalogo/AvisoDoCatalogo";
import { CatalogoLista } from "../Catalogo/CatalogoLista";
import { URL_DO_NOVO_SERVICO, urlDoServico } from "../Catalogo/rotas";
import { Esqueleto, Tela } from "../PaginaServicos.styles";
import { ServicosDesligados } from "../ServicosDesligados";
import { useServicos } from "../useServicos";

// Esqueleto no formato do conteúdo; também serve de reserva do Suspense da rota.
export function CatalogoServicosEsqueleto() {
  return (
    <Tela style={{ maxWidth: 760 }}>
      <Esqueleto role="status" aria-label="Carregando o catálogo de serviços">
        <Skeleton height="56px" width="240px" />
        <Skeleton height="48px" radius="12px" />
        <Skeleton height="40px" width="320px" radius="999px" />
        <Skeleton height="200px" radius="16px" />
      </Esqueleto>
    </Tela>
  );
}

function avisoDaUrl(valor: string | null): string | null {
  return valor !== null && valor in AVISOS_DO_CATALOGO ? AVISOS_DO_CATALOGO[valor as AvisoDoCatalogoId] : null;
}

// O catálogo de serviços (`/servicos/catalogo`): a lista de serviços ativos, como no protótipo. Um clique num serviço abre o
// cadastro dele; "Novo serviço" abre o cadastro em branco. Só Administrador e Gerente cadastram e editam.
export function CatalogoServicosPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const podeCadastrar = useCan(AREA.ServicosCatalogo);
  const servicos = useServicos(true);
  const [aviso, setAviso] = useState<string | null>(() => avisoDaUrl(searchParams.get("aviso")));

  // O aviso que veio do cadastro ("?aviso=criado") sai do endereço, para não voltar ao atualizar a página.
  useEffect(() => {
    if (searchParams.get("aviso") !== null) router.replace(pathname, { scroll: false });
  }, [pathname, router, searchParams]);

  const fecharAviso = useCallback(() => setAviso(null), []);

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
  if (servicos.isPending) return <CatalogoServicosEsqueleto />;

  return (
    <Tela style={{ maxWidth: 760 }}>
      <ServicosDesligados />
      <CatalogoLista servicos={servicos.data} podeCadastrar={podeCadastrar} onNovo={() => router.push(URL_DO_NOVO_SERVICO)} onEditar={(id) => router.push(urlDoServico(id))} />
      {aviso && <AvisoDoCatalogo texto={aviso} onFechar={fecharAviso} />}
    </Tela>
  );
}
