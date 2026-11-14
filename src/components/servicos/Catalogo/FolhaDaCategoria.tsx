"use client";

import { useId, useRef, useState } from "react";
import type { CategoriaFormValues } from "@/lib/schemas/servico";
import { CATEGORIA_ROTULO } from "@/types/servico";
import { EXEMPLOS_DA_CATEGORIA } from "../catalogo";
import { tempoCurto } from "./cartao";
import { mascararValor, soMinutos } from "./formulario";
import { Folha } from "./Folha";
import { AcoesDaFolha, CabecalhoDaCategoria, Faz, InterruptorGrande, Marcar, Outro, Valor } from "./Folha.styles";
import { IconeDaCategoria, IconeX } from "./icones";
import { Ajuda, BotaoCelular, Campo, Chip, Chips, Erro } from "./ServicoFormCelular.styles";

// As opções rápidas do protótipo, em minutos; no tempo grátis, 0 é "Nenhum".
export const DURACOES_RAPIDAS = [15, 30, 45, 60, 90, 120, 180, 240] as const;
export const GRATIS_RAPIDOS = [0, 30, 60, 120, 180, 240] as const;

export interface FolhaDaCategoriaProps {
  categoria: number;
  valores: CategoriaFormValues;
  // Quantas outras categorias ligadas ainda estão sem valor: com elas, a folha oferece usar o mesmo valor.
  semValor: number;
  // Grava a categoria; `repetir` diz que o mesmo valor vai para as outras sem valor.
  onSalvar: (valores: CategoriaFormValues, repetir: boolean) => void;
  onFechar: () => void;
}

const tem = (texto: string) => texto.trim() !== "";

// A edição de uma categoria no celular, numa folha que sobe: faz ou não o serviço, valor em destaque, quanto leva e quanto
// tempo é grátis no pátio. Edita um rascunho: só "Salvar" grava e "Fechar" descarta.
export function FolhaDaCategoria({ categoria, valores, semValor, onSalvar, onFechar }: FolhaDaCategoriaProps) {
  const tituloId = useId();
  const valorRef = useRef<HTMLInputElement>(null);
  const [rascunho, setRascunho] = useState(valores);
  const [erro, setErro] = useState<string | undefined>();
  const [repetir, setRepetir] = useState(false);
  const nome = CATEGORIA_ROTULO[categoria];
  const exemplos = EXEMPLOS_DA_CATEGORIA[categoria];
  const mudar = (parcial: Partial<CategoriaFormValues>) => setRascunho((atual) => ({ ...atual, ...parcial }));

  const duracaoFora = tem(rascunho.duracao) && !DURACOES_RAPIDAS.some((minutos) => minutos === Number(rascunho.duracao));
  const gratisFora = tem(rascunho.gratis) && Number(rascunho.gratis) > 0 && !GRATIS_RAPIDOS.some((minutos) => minutos === Number(rascunho.gratis));

  function salvar() {
    if (rascunho.recebe) {
      if (!tem(rascunho.valor)) {
        setErro("Informe o valor ou desligue a categoria");
        valorRef.current?.focus();
        return;
      }
      if (tem(rascunho.duracao) && Number(rascunho.duracao) === 0) {
        setErro("A duração precisa ser maior que zero");
        return;
      }
    }
    onSalvar(rascunho, rascunho.recebe && repetir && semValor > 0);
  }

  return (
    <Folha tituloId={tituloId} onFechar={onFechar}>
      <CabecalhoDaCategoria>
        <span className="cico">
          <IconeDaCategoria categoria={categoria} />
        </span>
        <div className="nome">
          <h3 id={tituloId}>{nome}</h3>
          {exemplos && <small>{exemplos}</small>}
        </div>
        <button type="button" className="fechar" aria-label="Fechar" onClick={onFechar}>
          <IconeX />
        </button>
      </CabecalhoDaCategoria>

      <Faz>
        <span>Faz este serviço</span>
        <InterruptorGrande
          type="button"
          role="switch"
          aria-checked={rascunho.recebe}
          aria-label={`${nome} recebe este serviço`}
          onClick={() => {
            mudar({ recebe: !rascunho.recebe });
            setErro(undefined);
          }}
        />
      </Faz>

      {rascunho.recebe ? (
        <>
          <Campo>
            <label htmlFor={`${tituloId}-valor`}>Valor</label>
            <Valor>
              <span>R$</span>
              <input
                ref={valorRef}
                id={`${tituloId}-valor`}
                inputMode="numeric"
                autoComplete="off"
                placeholder="0,00"
                data-foco-inicial
                value={rascunho.valor}
                onChange={(event) => {
                  setErro(undefined);
                  mudar({ valor: mascararValor(event.target.value) });
                }}
              />
            </Valor>
            {erro && <Erro role="alert">{erro}</Erro>}
          </Campo>

          <Campo role="group" aria-labelledby={`${tituloId}-dur`}>
            <span className="lbl" id={`${tituloId}-dur`}>
              Quanto tempo leva <span className="opc">(previsão)</span>
            </span>
            <Chips>
              {DURACOES_RAPIDAS.map((minutos) => (
                <Chip key={minutos} type="button" $marcado={Number(rascunho.duracao) === minutos && tem(rascunho.duracao)} aria-pressed={Number(rascunho.duracao) === minutos && tem(rascunho.duracao)} onClick={() => mudar({ duracao: String(minutos) })}>
                  {tempoCurto(minutos)}
                </Chip>
              ))}
            </Chips>
            <Outro>
              <span>Outro:</span>
              <input inputMode="numeric" autoComplete="off" placeholder="min" aria-label="Duração em minutos" value={duracaoFora ? rascunho.duracao : ""} onChange={(event) => mudar({ duracao: soMinutos(event.target.value) })} />
              <span>min</span>
            </Outro>
          </Campo>

          <Campo role="group" aria-labelledby={`${tituloId}-grat`}>
            <span className="lbl" id={`${tituloId}-grat`}>
              Tempo grátis no pátio
            </span>
            <Chips>
              {GRATIS_RAPIDOS.map((minutos) => {
                const marcado = minutos === 0 ? !tem(rascunho.gratis) || Number(rascunho.gratis) === 0 : Number(rascunho.gratis) === minutos;
                return (
                  <Chip key={minutos} type="button" $marcado={marcado} aria-pressed={marcado} onClick={() => mudar({ gratis: minutos === 0 ? "" : String(minutos) })}>
                    {minutos === 0 ? "Nenhum" : tempoCurto(minutos)}
                  </Chip>
                );
              })}
            </Chips>
            <Outro>
              <span>Outro:</span>
              <input inputMode="numeric" autoComplete="off" placeholder="min" aria-label="Tempo grátis em minutos" value={gratisFora ? rascunho.gratis : ""} onChange={(event) => mudar({ gratis: soMinutos(event.target.value) })} />
              <span>min</span>
            </Outro>
            <Ajuda>Enquanto espera o serviço, o carro não paga estacionamento. Passou disso, cobra a tabela normal.</Ajuda>
          </Campo>

          {semValor > 0 && (
            <Marcar>
              <input type="checkbox" checked={repetir} onChange={(event) => setRepetir(event.target.checked)} />
              Usar também nas {semValor} categorias sem valor
            </Marcar>
          )}
        </>
      ) : (
        <Ajuda>{nome} não vai aparecer quando o operador for lançar este serviço no carro.</Ajuda>
      )}

      <AcoesDaFolha>
        <BotaoCelular type="button" onClick={onFechar}>
          Fechar
        </BotaoCelular>
        <BotaoCelular type="button" $tipo="primario" onClick={salvar}>
          Salvar
        </BotaoCelular>
      </AcoesDaFolha>
    </Folha>
  );
}
