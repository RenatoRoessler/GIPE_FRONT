"use client";

import { toServicoPayload, type ServicoFormValues } from "@/lib/schemas/servico";
import { CATEGORIA_ROTULO, CATEGORIAS_SERVICO, type Servico } from "@/types/servico";
import { formatCentavos } from "../format";
import { faixaDeDuracao, faixaDeGratis } from "./cartao";
import { IconeLava } from "./icones";
import { Previa } from "./ServicoFormDesktop.styles";

export interface PreviaDoServicoProps {
  valores: ServicoFormValues;
}

// O que o formulário diz, no formato do catálogo, para reaproveitar as faixas do cartão.
function servicoDoFormulario(valores: ServicoFormValues): Servico {
  const payload = toServicoPayload(valores);
  return {
    id: 0,
    nome: payload.nome,
    descricao: payload.descricao,
    duracaoMinutos: null,
    tempoPermitidoMinutos: null,
    ativo: true,
    precos: payload.precos.map((preco) => ({
      categoria: preco.categoria,
      descricao: CATEGORIA_ROTULO[preco.categoria],
      valorCentavos: Math.round(preco.valor * 100),
      duracaoMinutos: preco.duracaoMinutos ?? null,
      tempoPermitidoMinutos: preco.tempoPermitidoMinutos ?? null,
    })),
  };
}

// "Como aparece ao lançar no carro": o cartão azul-noite que mostra, ao vivo, o serviço como o operador o verá.
export function PreviaDoServico({ valores }: PreviaDoServicoProps) {
  const servico = servicoDoFormulario(valores);
  const centavos = servico.precos.map((preco) => preco.valorCentavos);
  const minimo = centavos.length > 0 ? Math.min(...centavos) : null;
  const maximo = centavos.length > 0 ? Math.max(...centavos) : null;
  const partes = [faixaDeDuracao(servico) || null, faixaDeGratis(servico) || "cobra permanência"].filter(Boolean).join(" · ");
  const naoAparece = CATEGORIAS_SERVICO.filter((id) => !valores.categorias[id].recebe).map((id) => CATEGORIA_ROTULO[id]);

  return (
    <Previa role="region" aria-labelledby="previa-do-servico">
      <span className="rotulo" id="previa-do-servico">
        Como aparece ao lançar no carro
      </span>
      <div className="linha">
        <div className="ico">
          <IconeLava />
        </div>
        <div style={{ minWidth: 0 }}>
          <h3>{servico.nome || "Nome do serviço"}</h3>
          <p>{partes}</p>
        </div>
        <div className="v">
          {minimo === null ? (
            "—"
          ) : minimo === maximo ? (
            formatCentavos(minimo)
          ) : (
            <>
              <small>a partir de</small>
              {formatCentavos(minimo)}
            </>
          )}
        </div>
      </div>
      {naoAparece.length > 0 && <p>Não aparece para: {naoAparece.join(", ")}</p>}
    </Previa>
  );
}
