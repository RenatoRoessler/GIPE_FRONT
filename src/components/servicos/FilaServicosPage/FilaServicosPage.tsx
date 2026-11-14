"use client";

import { Skeleton } from "@/components/ui/Skeleton";
import { FilaServicos } from "../FilaServicos";
import { Esqueleto, Tela, Titulo } from "../PaginaServicos.styles";
import { ServicosDesligados } from "../ServicosDesligados";

// Esqueleto no formato do conteúdo; também serve de reserva do Suspense da rota.
export function FilaServicosEsqueleto() {
  return (
    <Tela>
      <Titulo>Fila de serviços</Titulo>
      <Esqueleto role="status" aria-label="Carregando a fila de serviços">
        <Skeleton height="44px" width="240px" />
        <Skeleton height="96px" radius="14px" />
        <Skeleton height="96px" radius="14px" />
      </Esqueleto>
    </Tela>
  );
}

// A fila de quem executa os serviços dos veículos no pátio (Lavador, Manobrista e Caixa), na rota /servicos. O catálogo
// tem a sua própria página; aqui não há abas.
export function FilaServicosPage() {
  return (
    <Tela>
      <Titulo>Fila de serviços</Titulo>
      <ServicosDesligados />
      <FilaServicos />
    </Tela>
  );
}
