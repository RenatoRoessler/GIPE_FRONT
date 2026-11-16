"use client";

import { formatTime } from "@/components/caixa/format";
import { PlateDisplay } from "@/components/ui/PlateDisplay";
import { STATUS_SERVICO, type ItemFila } from "@/types/servico";
import { atrasado as passouDaPrevisao } from "../fila";
import { IconeLava } from "../Catalogo/icones";
import { FilaTempo } from "../FilaTempo";
import { acaoDeStatus, acaoSecundaria, podeCancelar, type AcaoDeStatus } from "../status";
import { Acao, Acoes, Cartao, Detalhe, Discreta, Entrada, Identificacao, Mais, NomeServico, Prisma, Topo } from "./FilaCard.styles";

export interface FilaCardProps {
  item: ItemFila;
  // Só quem opera o pátio cancela.
  podeCancelarServico: boolean;
  // O instante de referência (ms), de `useAgora`, para os tempos e o atraso.
  agora: number;
  // Quantos outros serviços o mesmo veículo tem na fila.
  outros?: number;
  onAcao: (item: ItemFila, acao: AcaoDeStatus) => void;
  onCancelar: (item: ItemFila) => void;
}

// Um serviço da fila: a placa identifica o veículo, o tempo diz onde o serviço está e há uma ação principal por status. Voltar
// um passo e cancelar são discretos; cancelar só existe enquanto o serviço não foi iniciado.
export function FilaCard({ item, podeCancelarServico, agora, outros = 0, onAcao, onCancelar }: FilaCardProps) {
  const acao = acaoDeStatus(item.status);
  const secundaria = acaoSecundaria(item.status);
  const atrasado = passouDaPrevisao(item, agora);
  const veiculo = [item.modelo, item.cor, item.categoria].filter(Boolean).join(" · ");

  return (
    <Cartao $atrasado={atrasado} $tom={item.status === STATUS_SERVICO.Pronto ? "pronto" : item.status === STATUS_SERVICO.EmExecucao ? "andamento" : "neutro"} aria-label={`${item.nomeServico}, placa ${item.placa}`}>
      <Topo>
        <Identificacao>
          <PlateDisplay value={item.placa} size="sm" />
          {item.prisma && <Prisma aria-label={`Prisma ${item.prisma}`}>P {item.prisma}</Prisma>}
        </Identificacao>
        {item.entradaEm && <Entrada>entrou {formatTime(item.entradaEm)}</Entrada>}
      </Topo>
      <NomeServico>
        <IconeLava aria-hidden="true" />
        {item.nomeServico}
        {outros > 0 && <Mais>+{outros} no carro</Mais>}
      </NomeServico>
      {veiculo && <Detalhe>{veiculo}</Detalhe>}
      <FilaTempo item={item} agora={agora} />
      <Acoes>
        {acao && (
          <Acao variant={acao.correcao ? "secondary" : "primary"} data-acao-card={item.patioServicoId} onClick={() => onAcao(item, acao)}>
            {acao.rotulo}
          </Acao>
        )}
        {secundaria && (
          <Discreta type="button" aria-label={secundaria.rotulo} onClick={() => onAcao(item, secundaria)}>
            Voltar
          </Discreta>
        )}
        {podeCancelarServico && podeCancelar(item.status) && (
          <Discreta type="button" $perigo onClick={() => onCancelar(item)}>
            Cancelar serviço
          </Discreta>
        )}
      </Acoes>
    </Cartao>
  );
}
