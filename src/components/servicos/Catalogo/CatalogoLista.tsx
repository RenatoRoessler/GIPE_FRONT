"use client";

import { useState } from "react";
import { useIsMobile } from "@/hooks/useMediaQuery";
import { normalizarBusca } from "../catalogo";
import { formatCentavos } from "../format";
import type { Servico } from "@/types/servico";
import { categoriasQueNaoFaz, faixaDeDuracao, faixaDeGratis, faixaDePreco, metaDoCartaoMobile, pilulasDasCategorias, quantosTemGratis, textoDaFaixaDePreco } from "./cartao";
import {
  Botao,
  Busca,
  Cab,
  Cartao,
  CartaoInfo,
  CartaoPreco,
  CartaoTopo,
  Chip,
  Coluna,
  Etiqueta,
  Eyebrow,
  Flutuante,
  Icone,
  Lista,
  Resumo,
  SrApenas,
  Vazio,
} from "./Catalogo.styles";
import { CabecalhoCelular, CartaoCelular, ColunaCelular, Corpo, ListaCelular, Meta, Pilula, Pilulas, PrecoCelular } from "./CatalogoLista.styles";
import { IconeBusca, IconeLava, IconeMais, IconeP, IconeRelogio } from "./icones";

export interface CatalogoListaProps {
  servicos: Servico[];
  // Quem cadastra (Administrador e Gerente) vê "Novo serviço".
  podeCadastrar: boolean;
  onNovo: () => void;
  onEditar: (id: number) => void;
}

// Busca no nome e na descrição, sem acento nem diferença de caixa.
export function filtrarPorTexto(servicos: Servico[], texto: string): Servico[] {
  const busca = normalizarBusca(texto);
  if (busca === "") return servicos;
  return servicos.filter((servico) => normalizarBusca(servico.nome).includes(busca) || normalizarBusca(servico.descricao ?? "").includes(busca));
}

function CartaoDoComputador({ servico, onEditar }: { servico: Servico; onEditar: (id: number) => void }) {
  const faixa = faixaDePreco(servico);
  const duracao = faixaDeDuracao(servico);
  const gratis = faixaDeGratis(servico);
  const naoFaz = categoriasQueNaoFaz(servico);

  return (
    <Cartao type="button" onClick={() => onEditar(servico.id)}>
      <CartaoTopo>
        <Icone>
          <IconeLava />
        </Icone>
        <div>
          <h3>{servico.nome}</h3>
          <p>{servico.descricao || "Sem descrição"}</p>
        </div>
      </CartaoTopo>
      <CartaoInfo>
        {duracao && (
          <Etiqueta>
            <IconeRelogio />
            {duracao}
          </Etiqueta>
        )}
        {gratis ? (
          <Etiqueta $tipo="gratis">
            <IconeP />
            {gratis}
          </Etiqueta>
        ) : (
          <Etiqueta>
            <IconeP />
            Cobra permanência
          </Etiqueta>
        )}
        {naoFaz.length > 0 && <Etiqueta $tipo="fora">Não faz: {naoFaz.join(", ")}</Etiqueta>}
      </CartaoInfo>
      {faixa && (
        <CartaoPreco>
          <small>{faixa.unico ? "Preço único" : "Por categoria"}</small>
          <span className="v">{textoDaFaixaDePreco(faixa)}</span>
        </CartaoPreco>
      )}
    </Cartao>
  );
}

function CartaoDoCelular({ servico, onEditar }: { servico: Servico; onEditar: (id: number) => void }) {
  const faixa = faixaDePreco(servico);
  return (
    <CartaoCelular type="button" onClick={() => onEditar(servico.id)}>
      <Icone $tamanho={44}>
        <IconeLava />
      </Icone>
      <Corpo>
        <h3>{servico.nome}</h3>
        <Meta>{metaDoCartaoMobile(servico)}</Meta>
        <Pilulas aria-label="Categorias">
          {pilulasDasCategorias(servico).map((pilula) => (
            <Pilula key={pilula.categoria} $fora={!pilula.atende}>
              {pilula.rotulo}
              {!pilula.atende && <SrApenas> (não faz)</SrApenas>}
            </Pilula>
          ))}
        </Pilulas>
      </Corpo>
      {faixa && (
        <PrecoCelular>
          {!faixa.unico && <small>a partir de</small>}
          {formatCentavos(faixa.minimoCentavos)}
        </PrecoCelular>
      )}
    </CartaoCelular>
  );
}

// A lista do catálogo, como no protótipo: cartões com o que importa de cada serviço (tempos, o que não faz, preço) e um
// clique abre o cadastro. No computador, grade de duas colunas com resumo; no celular, cartões em coluna e o botão flutuante.
export function CatalogoLista({ servicos, podeCadastrar, onNovo, onEditar }: CatalogoListaProps) {
  const celular = useIsMobile();
  const [texto, setTexto] = useState("");
  const itens = filtrarPorTexto(servicos, texto);
  const vazio = servicos.length === 0;

  const busca = (
    <Busca $celular={celular}>
      <IconeBusca />
      <SrApenas>Buscar serviço</SrApenas>
      <input type="search" placeholder={celular ? "Buscar serviço" : "Buscar por nome ou descrição"} value={texto} onChange={(event) => setTexto(event.target.value)} />
    </Busca>
  );

  const semResultado = (
    <Vazio style={{ gridColumn: "1 / -1" }}>
      <h3>Nenhum serviço com “{texto}”</h3>
      <p>Confira a grafia ou cadastre um serviço novo.</p>
    </Vazio>
  );

  const primeiroCadastro = (
    <Vazio>
      <Icone>
        <IconeLava />
      </Icone>
      <h3>Cadastre o primeiro serviço</h3>
      <p>Lavagem, polimento, higienização: o que você cadastrar aqui aparece para lançar no carro que está no pátio.</p>
      {podeCadastrar && (
        <Botao type="button" $tipo="primario" onClick={onNovo}>
          <IconeMais />
          Novo serviço
        </Botao>
      )}
    </Vazio>
  );

  if (celular) {
    return (
      <ColunaCelular>
        <CabecalhoCelular>
          <Eyebrow>Lava-rápido</Eyebrow>
          <h2>Serviços</h2>
          <p>{servicos.length} ativos · toque para editar</p>
        </CabecalhoCelular>
        {vazio ? (
          primeiroCadastro
        ) : (
          <>
            {busca}
            <ListaCelular>
              {itens.length === 0 ? semResultado : itens.map((servico) => <CartaoDoCelular key={servico.id} servico={servico} onEditar={onEditar} />)}
            </ListaCelular>
          </>
        )}
        {podeCadastrar && (
          <Flutuante type="button" onClick={onNovo}>
            <IconeMais />
            Novo serviço
          </Flutuante>
        )}
      </ColunaCelular>
    );
  }

  return (
    <Coluna>
      <Cab>
        <div>
          <Eyebrow>Lava-rápido</Eyebrow>
          <h1>Serviços</h1>
        </div>
        {podeCadastrar && (
          <Botao type="button" $tipo="primario" onClick={onNovo}>
            <IconeMais />
            Novo serviço
          </Botao>
        )}
      </Cab>
      {vazio ? (
        primeiroCadastro
      ) : (
        <>
          {busca}
          <Resumo aria-label="Resumo do catálogo">
            <Chip>{servicos.length} ativos</Chip>
            <Chip>{quantosTemGratis(servicos)} com tempo grátis no pátio</Chip>
          </Resumo>
          <Lista>{itens.length === 0 ? semResultado : itens.map((servico) => <CartaoDoComputador key={servico.id} servico={servico} onEditar={onEditar} />)}</Lista>
        </>
      )}
    </Coluna>
  );
}
