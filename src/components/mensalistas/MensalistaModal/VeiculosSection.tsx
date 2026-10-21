"use client";

import { useStore } from "@tanstack/react-form";
import { useEffect, useRef, useState } from "react";
import { withForm } from "@/components/form";
import { Accordion, AccordionItem } from "@/components/ui/Accordion";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import type { TipoCategoria } from "@/types/preco";
import { IconButton } from "../Mensalistas.styles";
import { RemoveIcon } from "../RemoveIcon";
import {
  EMPTY_MENSALISTA_VALUES,
  novoVeiculo,
  resumoVeiculo,
  tituloVeiculo,
  veiculoVazio,
} from "./mensalistaForm";
import { VeiculoItem } from "./VeiculoItem";
import { EmptyBox, Section, SectionHeader, SectionTitle } from "./Veiculos.styles";

type FieldMeta = { isTouched: boolean; errors: unknown[] };

// Para onde o foco vai depois de adicionar ou remover um veículo.
type Foco = { tipo: "placa"; uid: string } | { tipo: "item"; uid: string } | { tipo: "adicionar" } | null;

export const VeiculosSection = withForm({
  defaultValues: EMPTY_MENSALISTA_VALUES,
  props: {} as {
    juridica: boolean;
    categoriaTipo: TipoCategoria | null;
    disabled?: boolean;
    onLerPlaca: (index: number) => void;
    // Pede para abrir o veículo e focar a placa (ex.: erro do servidor naquela placa).
    revelar?: { uid: string; vez: number } | null;
  },
  render: function Render({ form, juridica, categoriaTipo, disabled = false, onLerPlaca, revelar = null }) {
    const veiculos = useStore(form.store, (state) => state.values.veiculos);
    const fieldMeta = useStore(form.store, (state) => state.fieldMeta) as Record<string, FieldMeta>;
    const tentativas = useStore(form.store, (state) => state.submissionAttempts);

    const [abertos, setAbertos] = useState<ReadonlySet<string>>(new Set());
    const [removendo, setRemovendo] = useState<string | null>(null);
    const [foco, setFoco] = useState<Foco>(null);
    const itens = useRef(new Map<string, HTMLDivElement>());
    const adicionarRef = useRef<HTMLButtonElement>(null);

    function temErro(meta: Record<string, FieldMeta>, index: number): boolean {
      const prefixo = `veiculos[${index}]`;
      return Object.entries(meta).some(
        ([nome, meta]) =>
          (nome === prefixo || nome.startsWith(`${prefixo}.`) || nome.startsWith(`${prefixo}[`)) &&
          meta.isTouched &&
          meta.errors.length > 0,
      );
    }

    const itemTemErro = (index: number) => temErro(fieldMeta, index);

    // Tentou salvar com erros: um frame depois da validação, abre os veículos que têm algo a corrigir.
    useEffect(() => {
      if (tentativas === 0) {
        return;
      }
      const frame = requestAnimationFrame(() => {
        if (form.state.isValid) {
          return;
        }
        const meta = form.state.fieldMeta as Record<string, FieldMeta>;
        const comErro = form.state.values.veiculos.filter((_, index) => temErro(meta, index)).map((item) => item.uid);
        if (comErro.length > 0) {
          setAbertos((atuais) => new Set([...atuais, ...comErro]));
        }
      });
      return () => cancelAnimationFrame(frame);
    }, [tentativas, form]);

    useEffect(() => {
      if (!revelar) {
        return;
      }
      setAbertos((atuais) => new Set([...atuais, revelar.uid]));
      setFoco({ tipo: "placa", uid: revelar.uid });
    }, [revelar]);

    useEffect(() => {
      if (!foco) {
        return;
      }
      if (foco.tipo === "adicionar") {
        adicionarRef.current?.focus();
      } else if (foco.tipo === "placa") {
        itens.current.get(foco.uid)?.querySelector("input")?.focus();
      } else {
        itens.current.get(foco.uid)?.querySelector("button")?.focus();
      }
      setFoco(null);
    }, [foco]);

    function adicionar() {
      const novo = novoVeiculo({ juridica, categoriaTipo });
      // Os anteriores sem erro se recolhem; o novo entra aberto.
      const comErro = veiculos.filter((_, index) => itemTemErro(index)).map((item) => item.uid);
      setAbertos(new Set([...comErro, novo.uid]));
      form.pushFieldValue("veiculos", novo);
      setFoco({ tipo: "placa", uid: novo.uid });
    }

    function remover(uid: string) {
      const index = veiculos.findIndex((veiculo) => veiculo.uid === uid);
      if (index < 0) {
        return;
      }
      const anterior = veiculos[index - 1]?.uid;
      form.removeFieldValue("veiculos", index);
      setAbertos((atuais) => new Set([...atuais].filter((aberto) => aberto !== uid)));
      setFoco(anterior ? { tipo: "item", uid: anterior } : { tipo: "adicionar" });
    }

    function pedirRemocao(uid: string) {
      const veiculo = veiculos.find((item) => item.uid === uid);
      if (!veiculo) {
        return;
      }
      if (veiculoVazio(veiculo)) {
        remover(uid);
        return;
      }
      setRemovendo(uid);
    }

    function alternar(uid: string, aberto: boolean) {
      setAbertos((atuais) => {
        const proximos = new Set(atuais);
        if (aberto) {
          proximos.add(uid);
        } else {
          proximos.delete(uid);
        }
        return proximos;
      });
    }

    const veiculoRemovendo = veiculos.find((veiculo) => veiculo.uid === removendo);

    return (
      <Section aria-label="Veículos">
        <SectionHeader>
          <SectionTitle>{`Veículos (${veiculos.length})`}</SectionTitle>
          {veiculos.length > 0 && (
            <Button ref={adicionarRef} type="button" variant="secondary" size="sm" onClick={adicionar} disabled={disabled}>
              Adicionar veículo
            </Button>
          )}
        </SectionHeader>

        {veiculos.length === 0 ? (
          <EmptyBox>
            <span>Nenhum veículo. O mensalista pode ser salvo sem veículos.</span>
            <Button ref={adicionarRef} type="button" variant="secondary" onClick={adicionar} disabled={disabled}>
              Adicionar veículo
            </Button>
          </EmptyBox>
        ) : (
          <Accordion>
            {veiculos.map((veiculo, index) => (
              <div
                key={veiculo.uid}
                ref={(element) => {
                  if (element) {
                    itens.current.set(veiculo.uid, element);
                  } else {
                    itens.current.delete(veiculo.uid);
                  }
                }}
              >
                <AccordionItem
                  title={tituloVeiculo(veiculo)}
                  summary={resumoVeiculo(veiculo)}
                  open={abertos.has(veiculo.uid)}
                  onOpenChange={(aberto) => alternar(veiculo.uid, aberto)}
                  hasError={itemTemErro(index)}
                  action={
                    <IconButton
                      type="button"
                      aria-label={`Remover veículo ${veiculo.placa || index + 1}`}
                      title="Remover veículo"
                      disabled={disabled}
                      onClick={() => pedirRemocao(veiculo.uid)}
                    >
                      <RemoveIcon />
                    </IconButton>
                  }
                >
                  <VeiculoItem
                    form={form}
                    index={index}
                    juridica={juridica}
                    categoriaTipo={categoriaTipo}
                    disabled={disabled}
                    onLerPlaca={onLerPlaca}
                  />
                </AccordionItem>
              </div>
            ))}
          </Accordion>
        )}

        {veiculoRemovendo && (
          <ConfirmDialog
            title={veiculoRemovendo.placa ? `Remover o veículo ${veiculoRemovendo.placa}?` : "Remover este veículo?"}
            message="Ele sai do cadastro quando você salvar."
            confirmLabel="Remover"
            cancelLabel="Manter"
            onConfirm={() => {
              remover(veiculoRemovendo.uid);
              setRemovendo(null);
            }}
            onCancel={() => setRemovendo(null)}
          />
        )}
      </Section>
    );
  },
});
