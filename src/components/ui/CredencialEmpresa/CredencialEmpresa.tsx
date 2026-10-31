"use client";

import { useTheme } from "styled-components";
import { StripeBar } from "@/components/ui/StripeBar";
import {
  Abrir,
  Campo,
  Cartao,
  Corpo,
  CredencialVariant,
  Dia,
  Dias,
  Pagamentos,
  Rotulo,
  Selo,
  Selos,
  Valor,
  fundoCredencial,
} from "./CredencialEmpresa.styles";

export interface CredencialDia {
  sigla: string;
  nome: string;
  estado: "aberto" | "24h" | "fechado";
}

// Campo vazio (`undefined`) vira traço apagado: nunca um valor falso.
export interface CredencialDados {
  nome?: string;
  cnpj?: string;
  tipo?: string;
  vagasCarro?: number;
  vagasMoto?: number;
  dias: CredencialDia[];
  pagamentos: string[];
}

export interface CredencialEmpresaProps {
  dados: CredencialDados;
  variant?: CredencialVariant;
  // Só na variante compacta: abre a credencial completa.
  onAbrir?: () => void;
}

const TRACO = "—";

const ESTADO_TEXTO = { aberto: "aberto", "24h": "aberto 24 horas", fechado: "fechado" } as const;

export function CredencialEmpresa({ dados, variant = "completa", onAbrir }: CredencialEmpresaProps) {
  const theme = useTheme();
  const { nome, cnpj, tipo, vagasCarro, vagasMoto, dias, pagamentos } = dados;
  const nomeExibido = nome ?? (variant === "compacta" ? "Sua empresa" : TRACO);

  if (variant === "compacta") {
    return (
      <Cartao $variant={variant} aria-label="Credencial resumida">
        <Corpo $variant={variant}>
          <Campo>
            <Rotulo>Sua credencial</Rotulo>
            <Valor $vazio={!nome}>{nomeExibido}</Valor>
          </Campo>
          {onAbrir && (
            <Abrir type="button" onClick={onAbrir}>
              Ver credencial
            </Abrir>
          )}
        </Corpo>
      </Cartao>
    );
  }

  return (
    <Cartao $variant={variant} aria-label="Resumo da credencial">
      <StripeBar fundo={fundoCredencial(theme)} />
      <Corpo $variant={variant}>
        <Campo>
          <Rotulo>Empresa</Rotulo>
          <Valor $vazio={!nome} $destaque>
            {nomeExibido}
          </Valor>
        </Campo>
        <Campo>
          <Rotulo>CNPJ</Rotulo>
          <Valor $vazio={!cnpj}>{cnpj ?? TRACO}</Valor>
        </Campo>
        <Campo>
          <Rotulo>Tipo</Rotulo>
          <Valor $vazio={!tipo}>{tipo ?? TRACO}</Valor>
        </Campo>
        <Campo>
          <Rotulo>Capacidade</Rotulo>
          <Selos>
            <Selo $vazio={vagasCarro === undefined}>{vagasCarro === undefined ? "— CARROS" : `${vagasCarro} CARROS`}</Selo>
            <Selo $vazio={vagasMoto === undefined}>{vagasMoto === undefined ? "— MOTOS" : `${vagasMoto} MOTOS`}</Selo>
          </Selos>
        </Campo>
        <Campo>
          <Rotulo>Funcionamento</Rotulo>
          <Dias>
            {dias.map((dia) => (
              <Dia key={dia.nome} $estado={dia.estado} aria-label={`${dia.nome}: ${ESTADO_TEXTO[dia.estado]}`}>
                {dia.estado === "24h" ? "24" : dia.sigla}
              </Dia>
            ))}
          </Dias>
        </Campo>
        <Pagamentos>Pagamentos: {pagamentos.length > 0 ? pagamentos.join(" · ") : TRACO}</Pagamentos>
      </Corpo>
    </Cartao>
  );
}
