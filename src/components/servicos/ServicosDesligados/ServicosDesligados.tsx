"use client";

import { useConfiguracao } from "@/components/configuracoes/useConfiguracao";
import { InfoCard } from "@/components/ui/InfoCard";
import { Link } from "@/components/ui/Link";
import { useCan } from "@/hooks/useCan";
import { AREA } from "@/lib/permissoes";

// Sem o interruptor de serviços ligado na configuração, o back recusa acrescentar serviço a um veículo. O módulo abre
// mesmo assim (catálogo e fila continuam acessíveis) e este aviso diz por que não dá para acrescentar.
export function ServicosDesligados() {
  const { configuracao, carregada } = useConfiguracao();
  const podeConfigurar = useCan(AREA.Configuracoes);

  if (!carregada || configuracao.servicos) {
    return null;
  }

  return (
    <InfoCard title="Os serviços estão desligados nesta empresa">
      Os veículos no pátio não podem receber serviços até que sejam ligados.
      {podeConfigurar ? (
        <>
          {" "}
          <Link href="/configuracoes">Ligar em Configurações</Link>
        </>
      ) : (
        " Peça a um administrador ou gerente para ligar em Configurações."
      )}
    </InfoCard>
  );
}
