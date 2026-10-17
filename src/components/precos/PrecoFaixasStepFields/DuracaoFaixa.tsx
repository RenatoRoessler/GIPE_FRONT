"use client";

import { Input } from "@/components/ui/Input";
import { Text } from "@/components/ui/Text";
import { Duracao } from "./PrecoFaixasStepFields.styles";

const SO_DIGITOS = /\D/g;

export interface DuracaoFaixaProps {
  // Limite da faixa em minutos, como texto (o formato guardado no formulário).
  value: string;
  onChange: (minutos: string) => void;
  onBlur: () => void;
  // Número da faixa (a partir de 1), usado nos rótulos.
  numero: number;
  error?: string;
  disabled?: boolean;
}

function dividir(value: string): { horas: string; minutos: string } {
  if (!/^\d+$/.test(value)) {
    return { horas: "", minutos: "" };
  }
  const total = Number(value);
  return { horas: String(Math.floor(total / 60)), minutos: String(total % 60) };
}

// Limite de tempo em horas e minutos; grava a soma em minutos. Passar de 59 minutos vira horas.
export function DuracaoFaixa({ value, onChange, onBlur, numero, error, disabled }: DuracaoFaixaProps) {
  const atual = dividir(value);

  function alterar(campo: "horas" | "minutos", texto: string) {
    const digitos = texto.replace(SO_DIGITOS, "");
    const outro = campo === "horas" ? atual.minutos : atual.horas;
    if (digitos === "" && outro === "") {
      onChange("");
      return;
    }
    const horas = Number((campo === "horas" ? digitos : atual.horas) || 0);
    const minutos = Number((campo === "minutos" ? digitos : atual.minutos) || 0);
    onChange(String(horas * 60 + minutos));
  }

  return (
    <div>
      <Duracao>
        <Input
          label={`Horas — faixa ${numero}`}
          inputMode="numeric"
          value={atual.horas}
          onChange={(evento) => alterar("horas", evento.target.value)}
          onBlur={onBlur}
          disabled={disabled}
          aria-invalid={Boolean(error)}
        />
        <Input
          label={`Minutos — faixa ${numero}`}
          inputMode="numeric"
          value={atual.minutos}
          onChange={(evento) => alterar("minutos", evento.target.value)}
          onBlur={onBlur}
          disabled={disabled}
          aria-invalid={Boolean(error)}
        />
      </Duracao>
      {error && (
        <Text variant="error" role="alert">
          {error}
        </Text>
      )}
    </div>
  );
}
