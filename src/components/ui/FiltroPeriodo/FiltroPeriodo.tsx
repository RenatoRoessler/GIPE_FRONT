"use client";

import { useState } from "react";
import { Accordion, AccordionItem } from "@/components/ui/Accordion";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { validarPeriodo, type ErrosPeriodo, type Periodo } from "@/lib/periodo";
import { Atalhos, FiltroForm, Raiz } from "./FiltroPeriodo.styles";

export interface AtalhoPeriodo {
  id: string;
  label: string;
  periodo: Periodo;
}

export interface FiltroPeriodoProps {
  // Período aplicado agora (o que a tela mostra).
  periodo: Periodo;
  // Chamado só com um período válido.
  onAplicar: (periodo: Periodo) => void;
  disabled?: boolean;
  // Padrão true: as duas datas são exigidas. Com false, o filtro aceita campos vazios.
  obrigatorio?: boolean;
  // Máximo de dias do período, os dois extremos inclusos.
  maxDias?: number;
  // Períodos prontos. Escolher um aplica na hora; o atalho fica marcado enquanto as datas forem as dele.
  atalhos?: AtalhoPeriodo[];
  rotuloAplicar?: string;
  // As datas ficam num bloco recolhido ("Personalizar período"), para os atalhos aparecerem sozinhos, como no celular.
  recolherCampos?: boolean;
}

export function FiltroPeriodo({
  periodo,
  onAplicar,
  disabled = false,
  obrigatorio = true,
  maxDias,
  atalhos = [],
  rotuloAplicar = "Filtrar",
  recolherCampos = false,
}: FiltroPeriodoProps) {
  const [rascunho, setRascunho] = useState<Periodo>(periodo);
  const [aplicado, setAplicado] = useState<Periodo>(periodo);
  const [erros, setErros] = useState<ErrosPeriodo>({});
  const [camposAbertos, setCamposAbertos] = useState(false);

  // Quando o período aplicado muda por fora (endereço, outro filtro), os campos acompanham.
  if (periodo.de !== aplicado.de || periodo.ate !== aplicado.ate) {
    setAplicado(periodo);
    setRascunho(periodo);
    setErros({});
  }

  function alterar(campo: keyof Periodo, valor: string) {
    setRascunho((atual) => ({ ...atual, [campo]: valor }));
    setErros((atual) => ({ ...atual, [campo]: undefined }));
  }

  function aplicar(proposto: Periodo) {
    const encontrados = validarPeriodo(proposto, { obrigatorio, maxDias });
    setErros(encontrados);
    if (encontrados.de || encontrados.ate) {
      return;
    }
    onAplicar(proposto);
  }

  function escolherAtalho(atalho: AtalhoPeriodo) {
    setRascunho(atalho.periodo);
    aplicar(atalho.periodo);
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    aplicar(rascunho);
  }

  const formulario = (
    <FiltroForm noValidate onSubmit={handleSubmit} aria-label="Filtrar por período">
      <Input label="De" type="date" value={rascunho.de} onChange={(event) => alterar("de", event.target.value)} error={erros.de} disabled={disabled} />
      <Input label="Até" type="date" value={rascunho.ate} onChange={(event) => alterar("ate", event.target.value)} error={erros.ate} disabled={disabled} />
      <Button type="submit" disabled={disabled}>
        {rotuloAplicar}
      </Button>
    </FiltroForm>
  );

  return (
    <Raiz>
      {atalhos.length > 0 && (
        <Atalhos role="group" aria-label="Períodos prontos">
          {atalhos.map((atalho) => {
            const ativo = atalho.periodo.de === rascunho.de && atalho.periodo.ate === rascunho.ate;
            return (
              <Button
                key={atalho.id}
                type="button"
                size="sm"
                variant={ativo ? "primary" : "secondary"}
                aria-pressed={ativo}
                disabled={disabled}
                onClick={() => escolherAtalho(atalho)}
              >
                {atalho.label}
              </Button>
            );
          })}
        </Atalhos>
      )}
      {recolherCampos ? (
        <Accordion>
          <AccordionItem title="Personalizar período" open={camposAbertos} onOpenChange={setCamposAbertos} hasError={Boolean(erros.de || erros.ate)}>
            {formulario}
          </AccordionItem>
        </Accordion>
      ) : (
        formulario
      )}
    </Raiz>
  );
}
