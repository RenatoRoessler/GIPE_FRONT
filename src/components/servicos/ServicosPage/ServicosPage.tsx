"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCurrentUser } from "@/contexts/CurrentUserContext";
import { useCan } from "@/hooks/useCan";
import { AREA } from "@/lib/permissoes";
import { PERFIL_USUARIO } from "@/types/usuario";
import { Skeleton } from "@/components/ui/Skeleton";
import { Tabs } from "@/components/ui/Tabs";
import { FilaServicos } from "../FilaServicos";
import { PARAM_ABA } from "../params";
import { ServicosDesligados } from "../ServicosDesligados";
import { ServicosMasterDetail } from "../ServicosMasterDetail";
import { Esqueleto, Tela, Titulo } from "./ServicosPage.styles";

export { PARAM_ABA };

export type AbaServicos = "fila" | "catalogo";

const ABAS: { id: AbaServicos; label: string }[] = [
  { id: "fila", label: "Fila" },
  { id: "catalogo", label: "Catálogo" },
];

// Aba pedida no endereço, se existir e o perfil puder vê-la; senão a padrão do perfil. Quem mantém o catálogo
// (Administrador e Gerente) abre nele; os demais abrem na fila. O Lavador só tem a fila.
export function abaDaUrl(valor: string | null, { podeVerCatalogo, abrePeloCatalogo }: { podeVerCatalogo: boolean; abrePeloCatalogo: boolean }): AbaServicos {
  if (!podeVerCatalogo) return "fila";
  if (valor === "fila" || valor === "catalogo") return valor;
  return abrePeloCatalogo ? "catalogo" : "fila";
}

// Esqueleto no formato do conteúdo; também serve de reserva do Suspense da página.
export function ServicosEsqueleto() {
  return (
    <Tela>
      <Titulo>Serviços</Titulo>
      <Esqueleto role="status" aria-label="Carregando os serviços">
        <Skeleton height="44px" width="240px" />
        <Skeleton height="96px" radius="14px" />
        <Skeleton height="96px" radius="14px" />
      </Esqueleto>
    </Tela>
  );
}

// Fila de quem executa e catálogo de quem mantém os preços, na mesma rota. A aba fica no endereço (`?aba=`), para o
// botão Voltar do navegador funcionar.
export function ServicosPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user } = useCurrentUser();
  const abrePeloCatalogo = useCan(AREA.ServicosCatalogo);

  const podeVerCatalogo = user?.perfil !== PERFIL_USUARIO.Lavador;
  const aba = abaDaUrl(searchParams.get(PARAM_ABA), { podeVerCatalogo, abrePeloCatalogo });
  const abas = podeVerCatalogo ? ABAS : ABAS.filter((item) => item.id === "fila");

  function trocarAba(id: string) {
    // Cada aba tem a sua seleção e o seu filtro: trocar de aba não leva os do endereço junto.
    router.replace(`${pathname}?${PARAM_ABA}=${id}`, { scroll: false });
  }

  return (
    <Tela>
      <Titulo>Serviços</Titulo>
      <ServicosDesligados />
      {abas.length > 1 ? (
        <Tabs tabs={abas} value={aba} onChange={trocarAba} aria-label="Serviços">
          {aba === "fila" ? <FilaServicos /> : <ServicosMasterDetail />}
        </Tabs>
      ) : (
        <FilaServicos />
      )}
    </Tela>
  );
}
