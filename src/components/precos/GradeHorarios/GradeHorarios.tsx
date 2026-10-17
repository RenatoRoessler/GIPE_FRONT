"use client";

import { useStore } from "@tanstack/react-form";
import { useEffect, useRef, type PointerEvent } from "react";
import { withForm } from "@/components/form";
import { Button } from "@/components/ui/Button";
import { DIAS_SEMANA_PRECO, type PrecoHorariosValues } from "@/types/preco";
import {
  copiarSegundaParaTodos,
  gradeDoAtalho,
  gradeParaHorarios,
  gradeVazia,
  horariosForaDaGrade,
  horariosParaGrade,
  HORAS_NA_SEMANA,
  HORAS_NO_DIA,
  totalDeHoras,
  type AtalhoGrade,
  type Grade,
} from "../grade";
import { resumoHorarios } from "../resumoHorarios";
import {
  Amostra,
  Atalhos,
  AtalhosRotulo,
  BotaoEixo,
  BotaoHora,
  Celula,
  Legenda,
  Linha,
  Raiz,
  Resumo,
  ResumoTitulo,
  Rolagem,
  Tabela,
} from "./GradeHorarios.styles";

const DEFAULT_VALUES: PrecoHorariosValues = { horarios: [] };

const ATALHOS: { atalho: AtalhoGrade; rotulo: string }[] = [
  { atalho: "comercial", rotulo: "Comercial (Seg–Sex 8h–18h)" },
  { atalho: "rotativo", rotulo: "Rotativo (Seg–Sex 6h–22h, Sáb 8h–18h)" },
  { atalho: "24h", rotulo: "24 horas" },
  { atalho: "fim-de-semana", rotulo: "Só fim de semana" },
];

// Segunda a domingo, como o gestor pensa a semana; o índice é a posição em DIAS_SEMANA_PRECO (domingo primeiro).
const ORDEM_DOS_DIAS = [1, 2, 3, 4, 5, 6, 0];
const HORAS = Array.from({ length: HORAS_NO_DIA }, (_, hora) => hora);

export const GradeHorarios = withForm({
  defaultValues: DEFAULT_VALUES,
  props: {} as { disabled?: boolean },
  render: function Render({ form, disabled = false }) {
    const horarios = useStore(form.store, (state) => state.values.horarios);
    const grade = horariosParaGrade(horarios);
    const arrastando = useRef(false);
    const pintura = useRef(true);
    // O clique que segue um pointerdown de mouse já foi tratado; o de teclado e o de toque ainda não.
    const cliqueTratado = useRef(false);

    useEffect(() => {
      function parar() {
        arrastando.current = false;
      }
      window.addEventListener("pointerup", parar);
      window.addEventListener("pointercancel", parar);
      return () => {
        window.removeEventListener("pointerup", parar);
        window.removeEventListener("pointercancel", parar);
      };
    }, []);

    // Lê sempre o estado mais recente do formulário e preserva os horários que a grade não desenha.
    function mudar(transformar: (atual: Grade) => Grade) {
      const atuais = form.state.values.horarios;
      form.setFieldValue("horarios", gradeParaHorarios(transformar(horariosParaGrade(atuais)), horariosForaDaGrade(atuais)));
    }

    function definirCelula(dia: number, hora: number, ligada: boolean) {
      mudar((atual) => {
        if (atual[dia][hora] === ligada) {
          return atual;
        }
        const nova = atual.map((linha) => [...linha]);
        nova[dia][hora] = ligada;
        return nova;
      });
    }

    function alternarDia(dia: number) {
      mudar((atual) => {
        const todas = atual[dia].every(Boolean);
        return atual.map((linha, indice) => (indice === dia ? linha.map(() => !todas) : linha));
      });
    }

    function alternarHora(hora: number) {
      mudar((atual) => {
        const todos = atual.every((linha) => linha[hora]);
        return atual.map((linha) => linha.map((ligada, indice) => (indice === hora ? !todos : ligada)));
      });
    }

    function aplicarAtalho(atalho: AtalhoGrade | "limpar" | "copiar") {
      if (atalho === "copiar") {
        mudar(copiarSegundaParaTodos);
      } else if (atalho === "limpar") {
        mudar(gradeVazia);
      } else {
        mudar(() => gradeDoAtalho(atalho));
      }
    }

    function iniciarPintura(dia: number, hora: number, evento: PointerEvent) {
      // Toque rola a grade; ele alterna pelo clique, não pelo arraste.
      if (disabled || evento.pointerType === "touch") {
        return;
      }
      cliqueTratado.current = true;
      arrastando.current = true;
      pintura.current = !horariosParaGrade(form.state.values.horarios)[dia][hora];
      definirCelula(dia, hora, pintura.current);
    }

    function continuarPintura(dia: number, hora: number) {
      if (arrastando.current && !disabled) {
        definirCelula(dia, hora, pintura.current);
      }
    }

    function clicar(dia: number, hora: number) {
      if (cliqueTratado.current) {
        cliqueTratado.current = false;
        return;
      }
      if (!disabled) {
        definirCelula(dia, hora, !horariosParaGrade(form.state.values.horarios)[dia][hora]);
      }
    }

    const total = totalDeHoras(grade);
    const grupos = total === 0 ? [] : resumoHorarios(gradeParaHorarios(grade)).split(" · ");

    return (
      <Raiz>
        <Atalhos role="group" aria-label="Atalhos de horário">
          <AtalhosRotulo>Atalhos:</AtalhosRotulo>
          {ATALHOS.map((item) => (
            <Button key={item.atalho} type="button" variant="secondary" size="sm" disabled={disabled} onClick={() => aplicarAtalho(item.atalho)}>
              {item.rotulo}
            </Button>
          ))}
          <Button type="button" variant="secondary" size="sm" disabled={disabled} onClick={() => aplicarAtalho("copiar")}>
            Copiar segunda para os outros dias
          </Button>
          <Button type="button" variant="secondary" size="sm" disabled={disabled} onClick={() => aplicarAtalho("limpar")}>
            Limpar
          </Button>
        </Atalhos>

        <Rolagem>
          <Tabela role="group" aria-label="Horários de cobrança por dia e hora">
            <Linha>
              <span />
              {HORAS.map((hora) => (
                <BotaoHora key={hora} type="button" disabled={disabled} aria-label={`Alternar ${hora}h em todos os dias`} onClick={() => alternarHora(hora)}>
                  {hora}
                </BotaoHora>
              ))}
            </Linha>
            {ORDEM_DOS_DIAS.map((dia) => {
              const nome = DIAS_SEMANA_PRECO[dia].label;
              return (
                <Linha key={dia}>
                  <BotaoEixo type="button" disabled={disabled} aria-label={`Alternar o dia inteiro: ${nome}`} onClick={() => alternarDia(dia)}>
                    {nome.slice(0, 3)}
                  </BotaoEixo>
                  {HORAS.map((hora) => (
                    <Celula
                      key={hora}
                      type="button"
                      disabled={disabled}
                      aria-pressed={grade[dia][hora]}
                      aria-label={`${nome}, ${String(hora).padStart(2, "0")}h`}
                      onPointerDown={(evento) => iniciarPintura(dia, hora, evento)}
                      onPointerEnter={() => continuarPintura(dia, hora)}
                      onClick={() => clicar(dia, hora)}
                    />
                  ))}
                </Linha>
              );
            })}
          </Tabela>
        </Rolagem>

        <Legenda>
          <span>
            <Amostra $ligada />
            Cobrança
          </span>
          <span>
            <Amostra $ligada={false} />
            Sem cobrança
          </span>
          <span>Clique ou arraste para pintar. O nome do dia e a hora alternam a linha ou a coluna.</span>
        </Legenda>

        <Resumo role="status" aria-live="polite">
          <ResumoTitulo>Resumo do que será gravado</ResumoTitulo>
          {grupos.length === 0 ? <span>Nenhuma hora pintada na grade.</span> : grupos.map((grupo) => <span key={grupo}>{grupo}</span>)}
          <span>
            {total} de {HORAS_NA_SEMANA} horas da semana com cobrança
          </span>
        </Resumo>
      </Raiz>
    );
  },
});
