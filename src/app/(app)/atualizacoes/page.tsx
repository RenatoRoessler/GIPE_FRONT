import type { Metadata } from "next";
import { ChangelogList } from "@/components/atualizacoes/ChangelogList";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { Text } from "@/components/ui/Text";
import { getChangelog } from "@/lib/changelog";

export const metadata: Metadata = {
  title: "Atualizações — GIPE",
};

export default function AtualizacoesPage() {
  const { complete, entries } = getChangelog();

  return (
    <>
      <Text variant="heading" as="h1">
        Atualizações
      </Text>
      <Text variant="muted">
        A versão conta todas as alterações do sistema; aqui aparecem as novidades e correções.
      </Text>
      {!complete && (
        <ErrorBanner role="alert">
          Não foi possível determinar a versão e o histórico completo desta publicação.
        </ErrorBanner>
      )}
      <ChangelogList entries={entries} />
    </>
  );
}
