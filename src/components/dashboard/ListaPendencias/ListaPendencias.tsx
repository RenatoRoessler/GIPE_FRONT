"use client";

import type { ReactNode } from "react";
import type { IconePendencia, Pendencia } from "../apresentacao";
import { PainelDashboard } from "../PainelDashboard";
import { TextoOculto } from "../shared.styles";
import { Contagem, Icone, Item, Lista, LinhaFixa, LinhaLink, Resumo, Seta, Texto, Titulo, type TomLinha } from "./ListaPendencias.styles";

export interface ListaPendenciasProps {
  itens: Pendencia[];
}

function Traco({ children }: { children: ReactNode }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {children}
    </svg>
  );
}

// Um desenho por tipo de pendência: o formato, e não só a cor, distingue uma da outra.
function IconeDaPendencia({ icone }: { icone: IconePendencia | "check" }) {
  switch (icone) {
    case "alerta":
      return (
        <Traco>
          <path d="M12 3l10 18H2L12 3zM12 10v5M12 18.5v.01" />
        </Traco>
      );
    case "caixa":
      return (
        <Traco>
          <rect x="3" y="6" width="18" height="12" rx="2" />
          <circle cx="12" cy="12" r="2.5" />
        </Traco>
      );
    case "relogio":
      return (
        <Traco>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 2" />
        </Traco>
      );
    case "agenda":
      return (
        <Traco>
          <rect x="3" y="5" width="18" height="16" rx="2" />
          <path d="M3 10h18M8 3v4M16 3v4" />
        </Traco>
      );
    case "doc":
      return (
        <Traco>
          <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5zM14 3v5h5M9 13h6M9 17h6" />
        </Traco>
      );
    case "check":
      return (
        <Traco>
          <path d="M5 12.5l4.5 4.5L19 7.5" />
        </Traco>
      );
  }
}

function Conteudo({ pendencia, link }: { pendencia: Pendencia; link: boolean }) {
  const tom: TomLinha = pendencia.tom;
  return (
    <>
      <Icone $tom={tom} aria-hidden="true">
        <IconeDaPendencia icone={pendencia.icone} />
      </Icone>
      <Texto>
        <Titulo>{pendencia.titulo}</Titulo> <Resumo>{pendencia.resumo}</Resumo>
      </Texto>{" "}
      <Contagem $tom={tom}>
        <TextoOculto>Quantidade:</TextoOculto> {pendencia.quantidade}
      </Contagem>
      {link && (
        <Seta aria-hidden="true">
          <Traco>
            <path d="M9 5l7 7-7 7" />
          </Traco>
        </Seta>
      )}
    </>
  );
}

// "Precisa da sua atenção": as pendências do momento, da mais grave à menos. Cada uma leva à tela em que se resolve (quando o
// usuário tem acesso a ela). Sem nenhuma, mostra "Tudo em dia".
export function ListaPendencias({ itens }: ListaPendenciasProps) {
  return (
    <PainelDashboard titulo="Precisa da sua atenção">
      <Lista>
        {itens.length === 0 ? (
          <Item>
            <LinhaFixa>
              <Icone $tom="ok" aria-hidden="true">
                <IconeDaPendencia icone="check" />
              </Icone>
              <Texto>
                <Titulo>Tudo em dia</Titulo> <Resumo>Nenhuma pendência no momento</Resumo>
              </Texto>
            </LinhaFixa>
          </Item>
        ) : (
          itens.map((pendencia) => (
            <Item key={pendencia.id}>
              {pendencia.href === null ? (
                <LinhaFixa>
                  <Conteudo pendencia={pendencia} link={false} />
                </LinhaFixa>
              ) : (
                <LinhaLink href={pendencia.href}>
                  <Conteudo pendencia={pendencia} link />
                </LinhaLink>
              )}
            </Item>
          ))
        )}
      </Lista>
    </PainelDashboard>
  );
}
