"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { OptionGroup } from "@/components/ui/OptionGroup";
import { Text } from "@/components/ui/Text";
import { Toast } from "@/components/ui/Toast";
import { useToast } from "@/hooks/useToast";
import type { SituacaoFiltro } from "@/types/conveniada";
import { Header, Page } from "../Conveniadas.styles";
import { ConveniadasList } from "../ConveniadasList";
import { mensagemCadastro, parseCadastroParam } from "../mensagens";
import { LISTA_URL, parseSituacao, SITUACOES, situacaoUrl } from "../situacao";

export const NOVA_URL = `${LISTA_URL}/nova`;

export function ConveniadasPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const situacao = parseSituacao(searchParams.get("situacao"));
  const cadastro = searchParams.get("cadastro");
  const { toast, showToast, dismissToast } = useToast();

  // O cadastro volta para cá com o resultado na URL: mostra a mensagem uma vez e limpa o parâmetro.
  useEffect(() => {
    const resultado = parseCadastroParam(cadastro);
    if (!resultado) {
      return;
    }
    showToast(mensagemCadastro(resultado));
    router.replace(situacaoUrl(parseSituacao(searchParams.get("situacao"))), { scroll: false });
  }, [cadastro, router, searchParams, showToast]);

  function changeSituacao(next: string) {
    router.replace(situacaoUrl(next as SituacaoFiltro), { scroll: false });
  }

  return (
    <Page>
      <Header>
        <Text variant="heading" as="h1">
          Empresas conveniadas
        </Text>
        <Button type="button" onClick={() => router.push(NOVA_URL)}>
          Nova conveniada
        </Button>
      </Header>
      <OptionGroup
        legend="Situação do convênio"
        options={[...SITUACOES]}
        value={situacao}
        onChange={changeSituacao}
        columns={3}
      />
      <ConveniadasList situacao={situacao} onNova={() => router.push(NOVA_URL)} onVerTodos={() => changeSituacao("todos")} />
      {toast && <Toast message={toast.message} variant={toast.variant} onDismiss={dismissToast} />}
    </Page>
  );
}
