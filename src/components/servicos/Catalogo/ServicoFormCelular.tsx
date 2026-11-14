"use client";

import { useRef, useState } from "react";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { parseMoney } from "@/lib/money";
import { CATEGORIA_ROTULO, type Servico } from "@/types/servico";
import { formatCentavos, textoDoComprovante } from "../format";
import { MODELOS_DE_SERVICO, aplicarModelo as modeloParaValores } from "../modelos";
import { Mono } from "./Catalogo.styles";
import { CATEGORIAS_NA_TELA } from "./cartao";
import { detalheDaRevisao, problemaDoPasso2, progressoDasCategorias, resumoDaCategoria, validarServico } from "./formulario";
import { FolhaDaCategoria } from "./FolhaDaCategoria";
import { IconeDaCategoria, IconeOk, IconeSeta, IconeVolta, IconeX } from "./icones";
import {
  Ajuda,
  AreaDeTexto,
  Barra,
  BotaoCelular,
  BotaoDoTopo,
  Campo,
  CategoriaBotao,
  Categorias,
  Chip,
  Chips,
  Cliente,
  Contador,
  Entrada,
  Erro,
  Link,
  LinhaDaRevisao,
  Principal,
  Progresso,
  Revisao,
  Tela,
  Titulo,
  Topo,
  TopoLinha,
  type EstadoDaCategoria,
} from "./ServicoFormCelular.styles";
import type { useServicoForm } from "./useServicoForm";

export interface ServicoFormCelularProps {
  servico?: Servico;
  form: ReturnType<typeof useServicoForm>;
  salvando: boolean;
  erroDoBack?: string;
  podeInativar: boolean;
  nomeRepetido: (nome: string) => boolean;
  // Grava o serviço; devolve se deu certo (a página mostra o erro do back).
  onSalvar: () => Promise<boolean>;
  onVoltar: () => void;
  onInativar: () => void;
  onAviso: (texto: string) => void;
}

type Passo = 1 | 2 | 3;

// O cadastro do serviço no celular, em tela cheia e três passos, como no protótipo: o serviço (nome e modelo), as categorias
// (cada uma numa folha que sobe) e a revisão, com o que o cliente vê no comprovante.
export function ServicoFormCelular({ servico, form, salvando, erroDoBack, podeInativar, nomeRepetido, onSalvar, onVoltar, onInativar, onAviso }: ServicoFormCelularProps) {
  const { valores, erros } = form;
  const editando = servico !== undefined;
  const [passo, setPasso] = useState<Passo>(1);
  const [editandoCategoria, setEditandoCategoria] = useState<number | null>(null);
  const [problema, setProblema] = useState<string | null>(null);
  const [categoriaDoCliente, setCategoriaDoCliente] = useState<number | null>(null);
  const nomeRef = useRef<HTMLInputElement>(null);
  const telaRef = useRef<HTMLDivElement>(null);

  const irPara = (proximo: Passo) => {
    setPasso(proximo);
    telaRef.current?.scrollTo({ top: 0 });
  };

  function voltar() {
    if (passo > 1) irPara((passo - 1) as Passo);
    else onVoltar();
  }

  function proximoDoPasso1() {
    const resultado = validarServico(valores, { nomeRepetido: nomeRepetido(valores.nome) });
    if (resultado.nome) {
      form.definirErros({ ...erros, nome: resultado.nome });
      nomeRef.current?.focus();
      return;
    }
    irPara(2);
  }

  function proximoDoPasso2() {
    const texto = problemaDoPasso2(valores);
    setProblema(texto);
    if (texto) return;
    setCategoriaDoCliente((atual) => atual ?? CATEGORIAS_NA_TELA.find((id) => valores.categorias[id].recebe) ?? null);
    irPara(3);
  }

  async function salvar() {
    const resultado = validarServico(valores, { nomeRepetido: nomeRepetido(valores.nome) });
    if (resultado.nome) {
      form.definirErros(resultado);
      irPara(1);
      return;
    }
    if (resultado.preco || resultado.duracao) {
      form.definirErros(resultado);
      setProblema(problemaDoPasso2(valores) ?? resultado.preco ?? resultado.duracao ?? null);
      irPara(2);
      return;
    }
    await onSalvar();
  }

  const progresso = progressoDasCategorias(valores);

  function estadoDa(id: number): EstadoDaCategoria {
    const linha = valores.categorias[id];
    if (!linha.recebe) return "fora";
    if (linha.valor.trim() === "") return problema ? "falta" : "normal";
    return "pronta";
  }

  function passoUm() {
    return (
      <>
        <Titulo>
          <Mono as="span">Passo 1 · Serviço</Mono>
          <h2>{editando ? "Serviço" : "Que serviço é esse?"}</h2>
        </Titulo>
        {!editando && (
          <Campo>
            <span className="lbl">Começar por um modelo</span>
            <Chips>
              {MODELOS_DE_SERVICO.map((modelo) => (
                <Chip
                  key={modelo.nome}
                  type="button"
                  onClick={() => {
                    form.aplicarModelo(modeloParaValores(modelo));
                    onAviso(`Modelo aplicado: ${modelo.nome}`);
                  }}
                >
                  {modelo.nome}
                </Chip>
              ))}
            </Chips>
            <Ajuda>O modelo já preenche as categorias com valores de exemplo. Ajuste no próximo passo.</Ajuda>
          </Campo>
        )}
        <Campo>
          <label htmlFor="servico-nome">Nome</label>
          <Entrada
            ref={nomeRef}
            id="servico-nome"
            maxLength={100}
            placeholder="Lavagem completa"
            autoComplete="off"
            value={valores.nome}
            $invalido={Boolean(erros.nome)}
            aria-invalid={erros.nome ? true : undefined}
            aria-describedby={erros.nome ? "servico-nome-erro" : undefined}
            onChange={(event) => form.mudarNome(event.target.value)}
          />
          {erros.nome && <Erro id="servico-nome-erro">{erros.nome}</Erro>}
        </Campo>
        <Campo>
          <label htmlFor="servico-descricao">
            Descrição <span className="opc">(opcional)</span>
          </label>
          <AreaDeTexto
            id="servico-descricao"
            maxLength={255}
            placeholder="Externa, aspiração e pretinho nos pneus"
            value={valores.descricao}
            onChange={(event) => form.mudarDescricao(event.target.value)}
          />
          <Ajuda>Aparece no comprovante do cliente · {valores.descricao.length}/255</Ajuda>
        </Campo>
        {editando && podeInativar && (
          <Link type="button" $perigo onClick={onInativar}>
            Inativar serviço
          </Link>
        )}
      </>
    );
  }

  function passoDois() {
    return (
      <>
        <Titulo>
          <Mono as="span">Passo 2 · Categorias</Mono>
          <h2>Valor e tempos de cada carro</h2>
          <p className="sub">Toque numa categoria para definir. Desligue a que não recebe o serviço.</p>
        </Titulo>
        <Contador>
          <span>
            {progresso.prontas} de {progresso.ligadas} prontas
          </span>
          {progresso.semValor > 0 ? <span className="perigo">{progresso.semValor} sem valor</span> : <span className="ok">Tudo certo</span>}
        </Contador>
        <Categorias>
          {CATEGORIAS_NA_TELA.map((id) => {
            const estado = estadoDa(id);
            return (
              <CategoriaBotao key={id} type="button" $estado={estado} onClick={() => setEditandoCategoria(id)}>
                <span className="cico">
                  <IconeDaCategoria categoria={id} />
                </span>
                <span className="txt">
                  <strong>{CATEGORIA_ROTULO[id]}</strong>
                  <span className="res">{resumoDaCategoria(valores.categorias[id])}</span>
                </span>
                <IconeSeta className="seta" />
              </CategoriaBotao>
            );
          })}
        </Categorias>
        {problema && <Erro role="alert">{problema}</Erro>}
      </>
    );
  }

  function passoTres() {
    const linhas = CATEGORIAS_NA_TELA.map((id) => ({ id, linha: valores.categorias[id] })).filter(({ linha }) => linha.recebe && Number.isFinite(parseMoney(linha.valor)));
    const doCliente = linhas.find(({ id }) => id === categoriaDoCliente) ?? linhas[0];
    const reais = doCliente ? parseMoney(doCliente.linha.valor) : Number.NaN;
    const texto = textoDoComprovante({
      duracaoMinutos: Number(doCliente?.linha.duracao) || null,
      tempoPermitidoMinutos: Number(doCliente?.linha.gratis) || null,
    });

    return (
      <>
        <Titulo>
          <Mono as="span">Passo 3 · Revisão</Mono>
          <h2>{valores.nome.trim()}</h2>
          {valores.descricao.trim() && <p className="sub">{valores.descricao.trim()}</p>}
        </Titulo>
        <Revisao>
          {CATEGORIAS_NA_TELA.map((id) => {
            const linha = valores.categorias[id];
            const atende = linha.recebe && Number.isFinite(parseMoney(linha.valor));
            return atende ? (
              <LinhaDaRevisao key={id}>
                <b>{CATEGORIA_ROTULO[id]}</b>
                <span className="v">{formatCentavos(Math.round(parseMoney(linha.valor) * 100))}</span>
                <small>{detalheDaRevisao(linha)}</small>
              </LinhaDaRevisao>
            ) : (
              <LinhaDaRevisao key={id} $fora>
                <b>{CATEGORIA_ROTULO[id]}</b>
                <span className="v">Não faz</span>
              </LinhaDaRevisao>
            );
          })}
          <Link type="button" style={{ paddingBottom: 0 }} onClick={() => irPara(2)}>
            Alterar categorias
          </Link>
        </Revisao>
        {doCliente && (
          <Cliente aria-labelledby="comprovante-do-cliente">
            <span className="rotulo" id="comprovante-do-cliente">
              O que o cliente vê no comprovante
            </span>
            <div className="seg" role="group" aria-label="Categoria do carro">
              {linhas.map(({ id }) => (
                <button key={id} type="button" className={id === doCliente.id ? "on" : undefined} aria-pressed={id === doCliente.id} onClick={() => setCategoriaDoCliente(id)}>
                  {CATEGORIA_ROTULO[id]}
                </button>
              ))}
            </div>
            <div className="msg">
              <h4>{valores.nome.trim()}</h4>
              <span className="v">{Number.isFinite(reais) ? formatCentavos(Math.round(reais * 100)) : ""}</span>
              <p>{texto.previsao}</p>
              <p>{texto.permanencia}</p>
            </div>
          </Cliente>
        )}
      </>
    );
  }

  const emEdicao = editandoCategoria === null ? null : valores.categorias[editandoCategoria];
  const semValorNasOutras = editandoCategoria === null ? 0 : progresso.semValor - (emEdicao && emEdicao.recebe && emEdicao.valor.trim() === "" ? 1 : 0);

  return (
    <Tela ref={telaRef} role="dialog" aria-modal="true" aria-label={editando ? "Editar serviço" : "Novo serviço"}>
      <Topo>
        <TopoLinha>
          <BotaoDoTopo type="button" aria-label={passo > 1 ? "Voltar ao passo anterior" : "Voltar para a lista"} onClick={voltar}>
            <IconeVolta />
          </BotaoDoTopo>
          <h1>{editando ? "Editar serviço" : "Novo serviço"}</h1>
          <span className="passo">{passo} de 3</span>
          <BotaoDoTopo type="button" aria-label="Fechar sem salvar" onClick={onVoltar}>
            <IconeX />
          </BotaoDoTopo>
        </TopoLinha>
        <Progresso aria-hidden="true">
          <span className={passo >= 1 ? "on" : undefined} />
          <span className={passo >= 2 ? "on" : undefined} />
          <span className={passo >= 3 ? "on" : undefined} />
        </Progresso>
      </Topo>
      <Principal>
        {erroDoBack && <ErrorBanner role="alert">{erroDoBack}</ErrorBanner>}
        {passo === 1 && passoUm()}
        {passo === 2 && passoDois()}
        {passo === 3 && passoTres()}
      </Principal>
      <Barra>
        {passo === 1 && (
          <BotaoCelular type="button" $tipo="primario" onClick={proximoDoPasso1}>
            Próximo: categorias
            <IconeSeta />
          </BotaoCelular>
        )}
        {passo === 2 && (
          <BotaoCelular type="button" $tipo="primario" onClick={proximoDoPasso2}>
            Revisar
            <IconeSeta />
          </BotaoCelular>
        )}
        {passo === 3 && (
          <BotaoCelular type="button" $tipo="primario" disabled={salvando} onClick={() => void salvar()}>
            <IconeOk />
            {salvando ? "Salvando..." : editando ? "Salvar alterações" : "Cadastrar serviço"}
          </BotaoCelular>
        )}
      </Barra>
      {editandoCategoria !== null && emEdicao && (
        <FolhaDaCategoria
          categoria={editandoCategoria}
          valores={emEdicao}
          semValor={semValorNasOutras}
          onFechar={() => setEditandoCategoria(null)}
          onSalvar={(novos, repetir) => {
            const receberam = form.gravarCategoria(editandoCategoria, novos, repetir);
            setProblema(null);
            setEditandoCategoria(null);
            if (receberam > 0) onAviso(`Usado em mais ${receberam} ${receberam === 1 ? "categoria" : "categorias"}`);
          }}
        />
      )}
    </Tela>
  );
}
