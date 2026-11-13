"use client";

import { formatTime } from "@/components/caixa/format";
import { formatCentavos } from "@/components/servicos/format";
import { STATUS_ROTULO } from "@/components/servicos/status";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { STATUS_SERVICO, type ServicoDoComprovante } from "@/types/servico";
import { Cabecalho, Icone, Item, Lista, Nome, Secao, Situacao, Texto, Valor } from "./ServicosDoComprovante.styles";

export interface ServicosDoComprovanteProps {
  servicos: ServicoDoComprovante[] | undefined;
}

// "Pronto às 21:40" / "Em andamento · previsão 22:20": o horário só entra quando o back o mandou.
function situacaoDoServico(servico: ServicoDoComprovante): string {
  if (servico.status === STATUS_SERVICO.Pronto) {
    return servico.prontoEm ? `Pronto às ${formatTime(servico.prontoEm)}` : STATUS_ROTULO[servico.status];
  }
  const rotulo = STATUS_ROTULO[servico.status];
  return servico.previsaoEm ? `${rotulo} · previsão ${formatTime(servico.previsaoEm)}` : rotulo;
}

function IconeDoStatus({ pronto }: { pronto: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {pronto ? (
        <path d="M5 12.5l4.5 4.5L19 7.5" />
      ) : (
        <>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 2" />
        </>
      )}
    </svg>
  );
}

// Os serviços do veículo no comprovante do cliente, com o andamento. Sem serviços (ou sem o campo na resposta) não
// mostra nada.
export function ServicosDoComprovante({ servicos }: ServicosDoComprovanteProps) {
  if (!servicos || servicos.length === 0) return null;

  const prontos = servicos.filter((servico) => servico.status === STATUS_SERVICO.Pronto).length;

  return (
    <Secao aria-label="Seus serviços">
      <Cabecalho>
        <h2>Seus serviços</h2>
        <span>
          {prontos} de {servicos.length} prontos
        </span>
      </Cabecalho>
      <ProgressBar value={prontos} max={servicos.length} aria-label="Serviços prontos" />
      <Lista aria-live="polite">
        {servicos.map((servico, indice) => {
          const pronto = servico.status === STATUS_SERVICO.Pronto;
          return (
            <Item key={`${indice}-${servico.nome}`}>
              <Icone $pronto={pronto}>
                <IconeDoStatus pronto={pronto} />
              </Icone>
              <Texto>
                <Nome>{servico.nome}</Nome>
                <Situacao $pronto={pronto}>{situacaoDoServico(servico)}</Situacao>
              </Texto>
              <Valor>{formatCentavos(servico.valorCentavos)}</Valor>
            </Item>
          );
        })}
      </Lista>
    </Secao>
  );
}
