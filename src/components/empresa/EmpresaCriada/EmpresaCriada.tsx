"use client";

import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/Button";
import { Text } from "@/components/ui/Text";
import { useLogout } from "@/hooks/useLogout";
import { Acoes, NomeEmpresa, Painel, Titulo } from "./EmpresaCriada.styles";

export interface EmpresaCriadaProps {
  // Razão social da empresa que acabou de ser criada.
  nome: string;
  // Volta para "Minha empresa", sem encerrar a sessão.
  onVoltar: () => void;
}

// Mostrado no lugar do formulário depois de criar a empresa: o acesso a ela é entrando de novo e escolhendo-a no login.
export function EmpresaCriada({ nome, onVoltar }: EmpresaCriadaProps) {
  const logout = useLogout();
  const tituloRef = useRef<HTMLHeadingElement>(null);

  // O foco vai para o painel, para o leitor de tela anunciar o resultado.
  useEffect(() => {
    tituloRef.current?.focus();
  }, []);

  return (
    <Painel role="status" aria-labelledby="empresa-criada-titulo">
      <Titulo id="empresa-criada-titulo" ref={tituloRef} tabIndex={-1}>
        Empresa criada
      </Titulo>
      <NomeEmpresa>{nome}</NomeEmpresa>
      <Text>Para entrar nela, saia e faça login de novo. Você vai escolher em qual empresa quer entrar.</Text>
      <Acoes>
        <Button type="button" onClick={logout}>
          Sair e escolher a empresa
        </Button>
        <Button type="button" variant="secondary" onClick={onVoltar}>
          Voltar para Minha empresa
        </Button>
      </Acoes>
    </Painel>
  );
}
