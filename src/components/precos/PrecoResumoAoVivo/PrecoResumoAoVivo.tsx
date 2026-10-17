"use client";

import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { parseMoney } from "@/lib/money";
import { TIPO_REGRA_OPTIONS, type PrecoFormValues } from "@/types/preco";
import { diffPreco, type InfoChange, type PrecoDiff } from "../diff";
import { FaixasPreview } from "../FaixasPreview";
import { formatBRL, formatDataIso, getCategoriaLabel } from "../format";
import { resumoHorarios } from "../resumoHorarios";
import {
  Alterado,
  Caixa,
  Conteudo,
  Item,
  Lista,
  Marca,
  MudancasLista,
  Painel,
  Progresso,
  Segmento,
  SoParaLeitor,
  Titulo,
} from "./PrecoResumoAoVivo.styles";

const ANUNCIO_DEBOUNCE_MS = 600;

export interface PrecoResumoAoVivoProps {
  values: PrecoFormValues;
  // Tabela como foi salva. Quando informada (edição), o painel mostra o que mudou.
  original?: PrecoFormValues;
  // Uma posição por etapa (O básico, Quando vale, Quanto cobra).
  etapasCompletas: readonly [boolean, boolean, boolean];
}

interface Linha {
  chave: string;
  rotulo: string;
  ok: boolean;
  texto: string;
  mudancas?: string[];
}

function faixasValidas(values: PrecoFormValues) {
  return values.faixas
    .map((faixa) => ({ minutosLimite: Number(faixa.minutosLimite), valor: parseMoney(faixa.valor) }))
    .filter((faixa) => faixa.minutosLimite > 0 && Number.isFinite(faixa.valor));
}

function descreverLista(diff: PrecoDiff["horarios"]): string[] {
  return [...diff.adicionadas.map((item) => `+ ${item}`), ...diff.removidas.map((item) => `− ${item}`)];
}

function mudancaInfo(diff: PrecoDiff | null, ...campos: InfoChange["campo"][]): InfoChange[] {
  return diff ? diff.info.filter((change) => campos.includes(change.campo)) : [];
}

function montarLinhas(values: PrecoFormValues, diff: PrecoDiff | null): Linha[] {
  const { info } = values;
  const tipo = TIPO_REGRA_OPTIONS.find((option) => String(option.value) === info.tipoRegra)?.label ?? "—";
  const horarios = resumoHorarios(values.horarios);
  const faixas = faixasValidas(values);
  const valorDiaria = parseMoney(info.valorDiaria);
  const diariaOk = Number.isFinite(valorDiaria);

  const descreve = (changes: InfoChange[]) => changes.map((change) => `${change.rotulo}: ${change.antes} → ${change.depois}`);

  return [
    {
      chave: "descricao",
      rotulo: "Descrição",
      ok: info.descricao.trim() !== "",
      texto: info.descricao.trim() || "ainda sem nome",
      mudancas: descreve(mudancaInfo(diff, "descricao")),
    },
    {
      chave: "tipo",
      rotulo: "Tipo",
      ok: tipo !== "—",
      texto: `${tipo}${info.ativo ? "" : " · inativa"}`,
      mudancas: descreve(mudancaInfo(diff, "tipoRegra", "ativo")),
    },
    {
      chave: "vigencia",
      rotulo: "Vigência",
      ok: info.inicioVigencia !== "",
      texto: `${formatDataIso(info.inicioVigencia || null)} → ${info.fimVigencia ? formatDataIso(info.fimVigencia) : "sem fim"}`,
      mudancas: descreve(mudancaInfo(diff, "inicioVigencia", "fimVigencia")),
    },
    {
      chave: "categorias",
      rotulo: "Categorias",
      ok: values.categorias.length > 0,
      texto: values.categorias.length > 0 ? values.categorias.map(getCategoriaLabel).join(", ") : "nenhuma",
      mudancas: diff ? descreverLista(diff.categorias) : [],
    },
    {
      chave: "horarios",
      rotulo: "Horários",
      ok: values.horarios.length > 0,
      texto: horarios,
      mudancas: diff ? descreverLista(diff.horarios) : [],
    },
    {
      chave: "faixas",
      rotulo: "Faixas",
      ok: faixas.length > 0 && diariaOk,
      texto: `${faixas.length} ${faixas.length === 1 ? "degrau" : "degraus"} · diária ${diariaOk ? formatBRL(valorDiaria) : "—"}`,
      mudancas: [
        ...(diff ? descreverLista(diff.faixas) : []),
        ...descreve(
          mudancaInfo(
            diff,
            "periodoDiaria",
            "valorDiaria",
            "valorAdicionalDiaria",
            "toleranciaEntradaMinutos",
            "toleranciaAlteracaoFaixaMinutos",
          ),
        ),
      ],
    },
  ];
}

// Painel "Sua tabela": a tabela se forma enquanto o usuário preenche, com a placa tarifária logo abaixo.
export function PrecoResumoAoVivo({ values, original, etapasCompletas }: PrecoResumoAoVivoProps) {
  const diff = original ? diffPreco(original, values) : null;
  const linhas = montarLinhas(values, diff);
  const completas = etapasCompletas.filter(Boolean).length;

  // Anuncia o andamento depois de uma pausa na digitação, não a cada tecla.
  const anuncio = useDebouncedValue(`Resumo atualizado: ${completas} de 3 etapas completas.`, ANUNCIO_DEBOUNCE_MS);

  const { info } = values;
  return (
    <Painel aria-label="Resumo ao vivo da tabela">
      <Caixa>
        <Titulo>Sua tabela</Titulo>
        <Progresso aria-hidden="true">
          {etapasCompletas.map((completa, index) => (
            <Segmento key={index} $completo={completa} />
          ))}
        </Progresso>
        <Lista>
          {linhas.map((linha) => {
            const alterada = Boolean(linha.mudancas && linha.mudancas.length > 0);
            return (
              <Item key={linha.chave}>
                <Marca $ok={linha.ok} aria-hidden="true">
                  {linha.ok ? "✓" : "○"}
                </Marca>
                <Conteudo>
                  <strong>{linha.rotulo}:</strong> {linha.texto}
                  <SoParaLeitor as="span">{linha.ok ? " (preenchido)" : " (pendente)"}</SoParaLeitor>
                  {alterada && <Alterado>Alterado</Alterado>}
                  {alterada && (
                    <MudancasLista aria-label={`Alterações em ${linha.rotulo}`}>
                      {linha.mudancas?.map((mudanca) => (
                        <li key={mudanca}>{mudanca}</li>
                      ))}
                    </MudancasLista>
                  )}
                </Conteudo>
              </Item>
            );
          })}
        </Lista>
        <SoParaLeitor role="status" aria-live="polite">
          {anuncio}
        </SoParaLeitor>
      </Caixa>

      <FaixasPreview
        faixas={faixasValidas(values)}
        diaria={{
          periodo: Number(info.periodoDiaria),
          valor: parseMoney(info.valorDiaria),
          adicional: parseMoney(info.valorAdicionalDiaria),
        }}
      />
    </Painel>
  );
}
