"use client";

import { useCallback, useState } from "react";
import type { CategoriaFormValues, ServicoFormValues } from "@/lib/schemas/servico";
import { CATEGORIA_ROTULO, type Servico } from "@/types/servico";
import type { ValoresDoModelo } from "../modelos";
import { repetirPrimeiraLinha } from "../ServicoFormModal/repetir";
import { valoresIniciais } from "../ServicoFormModal/valores";
import { ErrosDoServico, repetirParaAsSemValor, SEM_ERROS, temErros, validarServico } from "./formulario";

export interface ResultadoDoRepetir {
  // A mensagem do aviso (Toast, quando deu certo; texto do erro da seção, quando não).
  mensagem: string;
  ok: boolean;
}

function copiadoPara(origem: number, quantidade: number): string {
  if (quantidade === 0) return "Todas as categorias já têm valor";
  return `Copiado de ${CATEGORIA_ROTULO[origem]} para ${quantidade} ${quantidade === 1 ? "categoria" : "categorias"}`;
}

// O estado do cadastro de um serviço, igual nos dois formatos (página única e três passos): valores, erros da última
// tentativa de salvar e as ações que os dois usam. Erro some do campo quando ele é mexido, como no protótipo.
export function useServicoForm(servico: Servico | undefined, nomeRepetido: (nome: string) => boolean) {
  const [valores, setValores] = useState<ServicoFormValues>(() => valoresIniciais(servico));
  const [erros, setErros] = useState<ErrosDoServico>(SEM_ERROS);

  const mudarNome = useCallback((nome: string) => {
    setValores((atual) => ({ ...atual, nome }));
    setErros((atual) => (atual.nome ? { ...atual, nome: undefined } : atual));
  }, []);

  const mudarDescricao = useCallback((descricao: string) => setValores((atual) => ({ ...atual, descricao })), []);

  const mudarCategoria = useCallback((id: number, parcial: Partial<CategoriaFormValues>) => {
    setValores((atual) => ({ ...atual, categorias: { ...atual.categorias, [id]: { ...atual.categorias[id], ...parcial } } }));
    setErros((atual) => {
      if (!atual.valor[id] && !atual.tempo[id]) return atual;
      const valor = { ...atual.valor };
      const tempo = { ...atual.tempo };
      if ("valor" in parcial) delete valor[id];
      if ("duracao" in parcial) delete tempo[id];
      const proximo: ErrosDoServico = { ...atual, valor, tempo };
      if (Object.keys(valor).length === 0) proximo.preco = undefined;
      if (Object.keys(tempo).length === 0) proximo.duracao = undefined;
      return proximo;
    });
  }, []);

  // Ligar ou desligar uma categoria zera os erros da tela, como no protótipo.
  const alternarCategoria = useCallback((id: number) => {
    setValores((atual) => ({ ...atual, categorias: { ...atual.categorias, [id]: { ...atual.categorias[id], recebe: !atual.categorias[id].recebe } } }));
    setErros(SEM_ERROS);
  }, []);

  // Escolher um modelo preenche nome, descrição e as categorias; o resto continua editável.
  const aplicarModelo = useCallback((modelo: ValoresDoModelo) => {
    setValores((atual) => ({ ...atual, nome: modelo.nome, descricao: modelo.descricao, categorias: modelo.categorias }));
    setErros(SEM_ERROS);
  }, []);

  // "Repetir a 1ª linha nas vazias". Sem nenhum valor para repetir, o aviso fica na seção.
  const repetirPrimeira = useCallback((): ResultadoDoRepetir => {
    const resultado = repetirPrimeiraLinha(valores);
    if (!resultado.ok) {
      setErros((atual) => ({ ...atual, preco: "Preencha o valor de uma categoria para repetir nas outras" }));
      return { mensagem: "Preencha o valor de uma categoria para repetir nas outras", ok: false };
    }
    setValores(resultado.valores);
    setErros(SEM_ERROS);
    return { mensagem: copiadoPara(resultado.origem, resultado.copiadas), ok: true };
  }, [valores]);

  // Grava o que a folha da categoria editou; com `repetir`, o mesmo valor vai para as outras sem valor. Devolve quantas receberam.
  const gravarCategoria = useCallback(
    (id: number, novos: CategoriaFormValues, repetir: boolean): number => {
      const atual: ServicoFormValues = { ...valores, categorias: { ...valores.categorias, [id]: novos } };
      const proximo = repetir && novos.recebe ? repetirParaAsSemValor(atual, id) : atual;
      const receberam = repetir && novos.recebe ? Object.keys(proximo.categorias).filter((chave) => proximo.categorias[Number(chave)] !== atual.categorias[Number(chave)]).length : 0;
      setValores(proximo);
      setErros(SEM_ERROS);
      return receberam;
    },
    [valores],
  );

  // Valida tudo e guarda os erros para a tela. Devolve se pode salvar.
  const validar = useCallback((): boolean => {
    const resultado = validarServico(valores, { nomeRepetido: nomeRepetido(valores.nome) });
    setErros(resultado);
    return !temErros(resultado);
  }, [valores, nomeRepetido]);

  const definirErros = useCallback((proximos: ErrosDoServico) => setErros(proximos), []);

  return { valores, erros, mudarNome, mudarDescricao, mudarCategoria, alternarCategoria, aplicarModelo, repetirPrimeira, gravarCategoria, validar, definirErros };
}
