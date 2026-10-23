"use client";

import { AuthCard, Footer } from "@/components/ui/AuthCard";
import { Button } from "@/components/ui/Button";
import { Link } from "@/components/ui/Link";
import { Text } from "@/components/ui/Text";
import { formatCNPJ } from "@/lib/cnpj";
import type { EmpresaOpcao } from "@/types/auth";
import { Detalhe, Lista, Nome, Opcao } from "./EscolherEmpresa.styles";

export interface EscolherEmpresaProps {
  empresas: EmpresaOpcao[];
  onEscolher: (empresaId: string) => void;
  // Descarta a etapa e volta ao formulário de login.
  onVoltar: () => void;
  // Empresa que está sendo aberta agora; null quando nenhuma.
  pendenteId?: string | null;
  // Mensagem de erro da última tentativa.
  error?: string | null;
  // A escolha venceu (ou foi recusada): não adianta tentar de novo, só voltar ao login.
  expirada?: boolean;
}

// Quem tem mais de uma empresa escolhe em qual entrar. Um toque na empresa já entra.
export function EscolherEmpresa({ empresas, onEscolher, onVoltar, pendenteId = null, error = null, expirada = false }: EscolherEmpresaProps) {
  const entrando = pendenteId !== null;

  return (
    <AuthCard title="Escolha a empresa" subtitle="Você tem acesso a mais de uma empresa. Em qual quer entrar agora?">
      {error && (
        <Text variant="error" role="alert">
          {error}
        </Text>
      )}
      {expirada ? (
        <Button type="button" onClick={onVoltar}>
          Voltar ao login
        </Button>
      ) : (
        <>
          <Lista aria-label="Empresas disponíveis">
            {empresas.map((empresa) => {
              const cnpj = formatCNPJ(empresa.cnpj);
              return (
                <li key={empresa.id}>
                  <Opcao
                    type="button"
                    onClick={() => onEscolher(empresa.id)}
                    disabled={entrando}
                    aria-label={`Entrar em ${empresa.nome}${cnpj ? `, CNPJ ${cnpj}` : ""}`}
                    aria-busy={pendenteId === empresa.id}
                  >
                    <Nome>{empresa.nome}</Nome>
                    <Detalhe>{pendenteId === empresa.id ? "Entrando…" : [cnpj || "CNPJ não informado", empresa.perfilDescricao].filter(Boolean).join(" · ")}</Detalhe>
                  </Opcao>
                </li>
              );
            })}
          </Lista>
          <Footer>
            <Link href="/login" onClick={(event) => { event.preventDefault(); onVoltar(); }}>
              Voltar
            </Link>
          </Footer>
        </>
      )}
    </AuthCard>
  );
}
