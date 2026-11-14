"use client";

import { useId } from "react";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { CATEGORIA_ROTULO, type Servico } from "@/types/servico";
import { EXEMPLOS_DA_CATEGORIA } from "../catalogo";
import { MODELOS_DE_SERVICO, aplicarModelo as modeloParaValores } from "../modelos";
import { Botao, Coluna, Cab, Eyebrow } from "./Catalogo.styles";
import { CATEGORIAS_NA_TELA } from "./cartao";
import { mascararValor, soMinutos } from "./formulario";
import { IconeDaCategoria, IconeLixo, IconeOk, IconeVolta } from "./icones";
import { PreviaDoServico } from "./PreviaDoServico";
import {
  Acoes,
  Ajuda,
  AreaDeTexto,
  CabecalhoDasColunas,
  Campo,
  Categorias,
  ComAfixo,
  Contador,
  Copiar,
  Entrada,
  Erro,
  Inativar,
  Interruptor,
  LinhaDaCategoria,
  LinhaDaSecao,
  Modelos,
  NaoFaz,
  Secao,
  TituloDaSecao,
  Voltar,
} from "./ServicoFormDesktop.styles";
import type { useServicoForm } from "./useServicoForm";

export interface ServicoFormDesktopProps {
  // Sem serviço, cadastra; com serviço, edita.
  servico?: Servico;
  form: ReturnType<typeof useServicoForm>;
  salvando: boolean;
  // Erro do back ao gravar (nome repetido, sem permissão...), em texto.
  erroDoBack?: string;
  // Quem pode inativar (Administrador e Gerente) vê "Inativar serviço" na edição.
  podeInativar: boolean;
  onSalvar: () => void;
  onVoltar: () => void;
  onInativar: () => void;
  // Avisos curtos (o "Copiado de Moto para 5 categorias").
  onAviso: (texto: string) => void;
}

// O cadastro do serviço no computador, em página inteira, como no protótipo: dados do serviço, preço e tempos por categoria
// e a prévia de como o serviço aparece ao lançá-lo no carro.
export function ServicoFormDesktop({ servico, form, salvando, erroDoBack, podeInativar, onSalvar, onVoltar, onInativar, onAviso }: ServicoFormDesktopProps) {
  const base = useId();
  const { valores, erros } = form;
  const editando = servico !== undefined;
  const idDoNome = `${base}-nome`;

  function repetir() {
    onAviso(form.repetirPrimeira().mensagem);
  }

  return (
    <Coluna>
      <Voltar type="button" onClick={onVoltar}>
        <IconeVolta />
        Serviços
      </Voltar>
      <Cab>
        <div>
          <Eyebrow>{editando ? `Editar serviço · #${servico.id}` : "Novo serviço"}</Eyebrow>
          <h1>{editando ? servico.nome : "O que o seu lava-rápido faz?"}</h1>
        </div>
      </Cab>

      {erroDoBack && <ErrorBanner role="alert">{erroDoBack}</ErrorBanner>}

      <Secao aria-labelledby={`${base}-t1`}>
        <TituloDaSecao>
          <span className="n">1</span>
          <h2 id={`${base}-t1`}>Dados do serviço</h2>
        </TituloDaSecao>
        {!editando && (
          <Campo>
            <Ajuda>Comece por um modelo e ajuste o que precisar</Ajuda>
            <Modelos>
              {MODELOS_DE_SERVICO.map((modelo) => (
                <button key={modelo.nome} type="button" disabled={salvando} onClick={() => form.aplicarModelo(modeloParaValores(modelo))}>
                  {modelo.nome}
                </button>
              ))}
            </Modelos>
          </Campo>
        )}
        <Campo>
          <label htmlFor={idDoNome}>Nome do serviço</label>
          <Entrada
            id={idDoNome}
            maxLength={100}
            placeholder="Lavagem completa"
            autoComplete="off"
            value={valores.nome}
            disabled={salvando}
            $invalido={Boolean(erros.nome)}
            aria-invalid={erros.nome ? true : undefined}
            aria-describedby={erros.nome ? `${idDoNome}-erro` : undefined}
            onChange={(event) => form.mudarNome(event.target.value)}
          />
          {erros.nome && <Erro id={`${idDoNome}-erro`}>{erros.nome}</Erro>}
        </Campo>
        <Campo>
          <label htmlFor={`${base}-desc`}>
            Descrição <span className="opc">(opcional)</span>
          </label>
          <AreaDeTexto
            id={`${base}-desc`}
            maxLength={255}
            rows={2}
            placeholder="Externa, aspiração e pretinho nos pneus"
            value={valores.descricao}
            disabled={salvando}
            onChange={(event) => form.mudarDescricao(event.target.value)}
          />
          <Contador>{valores.descricao.length}/255</Contador>
          <Ajuda>Aparece no recibo do cliente, junto com o valor.</Ajuda>
        </Campo>
      </Secao>

      <Secao aria-labelledby={`${base}-t2`}>
        <TituloDaSecao>
          <span className="n">2</span>
          <h2 id={`${base}-t2`}>Preço e tempos por categoria</h2>
        </TituloDaSecao>
        <LinhaDaSecao>
          <Ajuda>Preencha cada categoria que recebe o serviço. Desligue a que não recebe.</Ajuda>
          <Copiar type="button" disabled={salvando} onClick={repetir}>
            Repetir a 1ª linha nas vazias
          </Copiar>
        </LinhaDaSecao>
        <Categorias role="group" aria-label="Preço e tempos por categoria">
          <CabecalhoDasColunas aria-hidden="true">
            <span />
            <div>
              <span>Valor</span>
              <span>Duração</span>
              <span>Grátis no pátio</span>
            </div>
            <span />
          </CabecalhoDasColunas>
          {CATEGORIAS_NA_TELA.map((id) => {
            const linha = valores.categorias[id];
            const nome = CATEGORIA_ROTULO[id];
            const idValor = `${base}-valor-${id}`;
            return (
              <LinhaDaCategoria key={id} $fora={!linha.recebe}>
                <label className="nome" htmlFor={idValor}>
                  <IconeDaCategoria categoria={id} />
                  <div>
                    {nome}
                    <small>{linha.recebe ? (EXEMPLOS_DA_CATEGORIA[id] ?? "") : "Não recebe este serviço"}</small>
                  </div>
                </label>
                <div className="vals">
                  {linha.recebe ? (
                    <>
                      <ComAfixo $lado="prefixo">
                        <span>R$</span>
                        <Entrada
                          id={idValor}
                          $altura={44}
                          inputMode="numeric"
                          autoComplete="off"
                          placeholder="0,00"
                          aria-label={nome}
                          value={linha.valor}
                          disabled={salvando}
                          $invalido={Boolean(erros.valor[id])}
                          aria-invalid={erros.valor[id] ? true : undefined}
                          onChange={(event) => form.mudarCategoria(id, { valor: mascararValor(event.target.value) })}
                        />
                      </ComAfixo>
                      <ComAfixo $lado="sufixo">
                        <Entrada
                          $altura={44}
                          inputMode="numeric"
                          autoComplete="off"
                          placeholder="—"
                          aria-label={`Duração para ${nome} em minutos`}
                          value={linha.duracao}
                          disabled={salvando}
                          $invalido={Boolean(erros.tempo[id])}
                          aria-invalid={erros.tempo[id] ? true : undefined}
                          onChange={(event) => form.mudarCategoria(id, { duracao: soMinutos(event.target.value) })}
                        />
                        <span>min</span>
                      </ComAfixo>
                      <ComAfixo $lado="sufixo">
                        <Entrada
                          $altura={44}
                          inputMode="numeric"
                          autoComplete="off"
                          placeholder="0"
                          aria-label={`Permanência grátis para ${nome} em minutos`}
                          value={linha.gratis}
                          disabled={salvando}
                          onChange={(event) => form.mudarCategoria(id, { gratis: soMinutos(event.target.value) })}
                        />
                        <span>min</span>
                      </ComAfixo>
                    </>
                  ) : (
                    <NaoFaz>Não faz</NaoFaz>
                  )}
                </div>
                <Interruptor type="button" role="switch" aria-checked={linha.recebe} aria-label={`${nome} recebe este serviço`} disabled={salvando} onClick={() => form.alternarCategoria(id)} />
              </LinhaDaCategoria>
            );
          })}
        </Categorias>
        {erros.duracao && <Erro>{erros.duracao}</Erro>}
        {erros.preco && <Erro role="alert">{erros.preco}</Erro>}
        <Ajuda>
          Duração: previsão para o lavador. Grátis no pátio: enquanto o carro espera o serviço, a permanência não é cobrada; passou disso, ou com 0, cobra o
          avulso normal.
        </Ajuda>
      </Secao>

      <PreviaDoServico valores={valores} />

      {editando && podeInativar && (
        <Inativar type="button" disabled={salvando} onClick={onInativar}>
          <IconeLixo />
          Inativar serviço
        </Inativar>
      )}

      <Acoes>
        <Botao type="button" disabled={salvando} onClick={onVoltar}>
          Cancelar
        </Botao>
        <Botao type="button" $tipo="primario" disabled={salvando} onClick={onSalvar}>
          <IconeOk />
          {salvando ? "Salvando..." : editando ? "Salvar alterações" : "Cadastrar serviço"}
        </Botao>
      </Acoes>
    </Coluna>
  );
}
