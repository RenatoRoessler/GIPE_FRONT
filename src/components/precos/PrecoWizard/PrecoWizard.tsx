"use client";

import { useQuery } from "@tanstack/react-query";
import { useState, useSyncExternalStore } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { Link } from "@/components/ui/Link";
import { Skeleton } from "@/components/ui/Skeleton";
import { Stepper } from "@/components/ui/Stepper";
import { Text } from "@/components/ui/Text";
import { ApiError } from "@/lib/api/errors";
import { createPreco, getPreco, updatePreco } from "@/lib/api/services/preco";
import { getSituacao, toPrecoFormValues } from "@/lib/api/services/preco.mapper";
import type { PrecoFormValues } from "@/types/preco";
import { novoPrecoFormValues } from "../novoPreco";
import { Header, Page, StateBox, TitleGroup } from "./PrecoWizard.styles";
import { PrecoWizardForm } from "./PrecoWizardForm";

const STEPS = ["O básico", "Quando vale", "Quanto cobra"];
const SKELETON_FIELDS = 6;

export interface PrecoWizardProps {
  // Com `id`, edita a tabela existente; sem `id`, cadastra uma nova.
  id?: number;
}

const subscribeNada = () => () => undefined;

// A data de hoje só existe no navegador (o servidor pode estar em outro fuso): o formulário aparece depois da hidratação.
function NovoPrecoWizard() {
  const [initial] = useState(() => novoPrecoFormValues());
  const noNavegador = useSyncExternalStore(subscribeNada, () => true, () => false);

  if (!noNavegador) {
    return null;
  }
  return <PrecoWizardForm title="Novo preço" initial={initial} onSave={createPreco} savedFlag="criado" />;
}

export function PrecoWizard({ id }: PrecoWizardProps) {
  return id === undefined ? <NovoPrecoWizard /> : <EditPrecoWizard id={id} />;
}

function EditPrecoWizard({ id }: { id: number }) {
  const { data, isPending, isError, error, refetch } = useQuery({
    queryKey: ["preco", id],
    queryFn: () => getPreco(id),
    refetchOnWindowFocus: false,
    // Sem cache entre aberturas: o formulário lê os valores iniciais uma única vez, então não pode partir de dados antigos.
    gcTime: 0,
  });

  if (isPending) {
    return (
      <Page>
        <Card maxWidth="1120px" role="status" aria-label="Carregando tabela de preço">
          <Header>
            <TitleGroup>
              <Text variant="heading" as="h1">
                Editar preço
              </Text>
            </TitleGroup>
            <Stepper steps={STEPS} currentStep={1} />
          </Header>
          <StateBox>
            {Array.from({ length: SKELETON_FIELDS }, (_, index) => (
              <Skeleton key={index} height="40px" />
            ))}
          </StateBox>
        </Card>
      </Page>
    );
  }

  if (isError) {
    const notFound = error instanceof ApiError && error.kind === "not_found";

    return (
      <Page>
        <StateBox>
          {notFound ? (
            <Text variant="muted">Tabela de preço não encontrada.</Text>
          ) : (
            <>
              <ErrorBanner role="alert">Não foi possível carregar a tabela de preço. {error.message}</ErrorBanner>
              <Button type="button" variant="secondary" onClick={() => void refetch()}>
                Tentar novamente
              </Button>
            </>
          )}
          <Link href="/precos">Voltar para a listagem</Link>
        </StateBox>
      </Page>
    );
  }

  const initial: PrecoFormValues = toPrecoFormValues(data);

  return (
    <PrecoWizardForm
      mode="edit"
      title="Editar preço"
      nome={data.descricao}
      situacao={getSituacao(data.ativo, data.inicioVigencia, data.fimVigencia, new Date())}
      initial={initial}
      onSave={(values) => updatePreco(id, values)}
      savedFlag="atualizado"
      invalidateKeys={[["preco", id]]}
      savedPrecoId={id}
    />
  );
}
