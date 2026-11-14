"use client";

import { useEffect } from "react";
import { Aviso } from "./Catalogo.styles";
import { IconeOk } from "./icones";

export interface AvisoDoCatalogoProps {
  texto: string;
  onFechar: () => void;
}

// O aviso curto do protótipo ("Serviço cadastrado"): caixa azul-noite com a barra amarela, some sozinha em instantes.
export function AvisoDoCatalogo({ texto, onFechar }: AvisoDoCatalogoProps) {
  useEffect(() => {
    const timer = setTimeout(onFechar, 2600);
    return () => clearTimeout(timer);
  }, [texto, onFechar]);

  return (
    <Aviso role="status">
      <IconeOk />
      {texto}
    </Aviso>
  );
}
