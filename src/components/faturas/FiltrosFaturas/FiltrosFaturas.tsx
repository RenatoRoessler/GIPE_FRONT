"use client";

import { nomeExibido } from "@/components/conveniadas/format";
import { OptionGroup } from "@/components/ui/OptionGroup";
import { Select } from "@/components/ui/Select";
import { useIsMobile } from "@/hooks/useMediaQuery";
import type { Conveniada } from "@/types/conveniada";
import type { FaturaFiltros, SituacaoFatura } from "@/types/fatura";
import { Filtros } from "../Faturas.styles";
import { BotaoTexto, LinhaFiltrando } from "../FaturasMobile.styles";
import { SITUACOES_FATURA } from "../situacao";
import { SEM_FILTROS } from "../url";

// "" representa "Todas" nos grupos de opção, que trabalham com texto.
const TODAS = "";

export interface FiltrosFaturasProps {
  filtros: FaturaFiltros;
  conveniadas: Conveniada[];
  // Quem recebe os filtros novos decide o resto; trocar um filtro aqui já volta à primeira página.
  onChange: (proximo: FaturaFiltros) => void;
}

export function FiltrosFaturas({ filtros, conveniadas, onChange }: FiltrosFaturasProps) {
  const celular = useIsMobile();

  function mudarConveniada(valor: string) {
    onChange({ ...filtros, empresaConveniadaId: valor === TODAS ? null : Number(valor), pagina: 1 });
  }

  function mudarSituacao(valor: string) {
    onChange({ ...filtros, situacao: valor === TODAS ? null : (Number(valor) as SituacaoFatura), pagina: 1 });
  }

  const opcoesSituacao = SITUACOES_FATURA.map((opcao) => ({ value: opcao.value === null ? TODAS : String(opcao.value), label: opcao.label }));

  // No celular, a linha "Filtrando: Abertas · Auto Peças Sul" diz o que está ativo e oferece limpar.
  const comFiltro = filtros.situacao !== null || filtros.empresaConveniadaId !== null;
  const situacaoAtiva = SITUACOES_FATURA.find((opcao) => opcao.value !== null && opcao.value === filtros.situacao)?.label;
  const conveniadaAtiva = conveniadas.find((conveniada) => conveniada.empresaConveniadaId === filtros.empresaConveniadaId);
  const ativos = [situacaoAtiva, conveniadaAtiva ? nomeExibido(conveniadaAtiva) : undefined].filter(Boolean);

  return (
    <>
      <Filtros>
        <Select
          label="Conveniada"
          hideLabel={celular}
          value={filtros.empresaConveniadaId === null ? TODAS : String(filtros.empresaConveniadaId)}
          onChange={(evento) => mudarConveniada(evento.target.value)}
        >
          <option value={TODAS}>{celular ? "Todas as conveniadas" : "Todas"}</option>
          {conveniadas.map((conveniada) => (
            <option key={conveniada.empresaConveniadaId} value={conveniada.empresaConveniadaId}>
              {nomeExibido(conveniada)}
              {conveniada.ativo ? "" : " (encerrado)"}
            </option>
          ))}
        </Select>
        <OptionGroup
          legend="Situação"
          options={opcoesSituacao}
          value={filtros.situacao === null ? TODAS : String(filtros.situacao)}
          onChange={mudarSituacao}
          columns={SITUACOES_FATURA.length}
          mobileColumns={2}
        />
      </Filtros>
      {celular && comFiltro && (
        <LinhaFiltrando>
          <span>Filtrando: {ativos.join(" · ")}</span>
          <BotaoTexto type="button" onClick={() => onChange(SEM_FILTROS)}>
            Limpar
          </BotaoTexto>
        </LinhaFiltrando>
      )}
    </>
  );
}
