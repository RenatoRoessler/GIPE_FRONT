"use client";

import { useState } from "react";
import { Accordion, AccordionItem, type AccordionMark } from "@/components/ui/Accordion";
import { Button } from "@/components/ui/Button";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import type { PrecoSecaoId, SecoesPreco } from "@/lib/schemas/preco";
import { parseMoney } from "@/lib/money";
import type { ConveniadaOpcao } from "@/types/conveniada";
import { TIPO_REGRA, type PrecoFormValues } from "@/types/preco";
import { diffPreco } from "../diff";
import { GradeHorarios } from "../GradeHorarios";
import { horariosForaDaGrade } from "../grade";
import { PrecoBasicoFields } from "../PrecoBasicoFields";
import { PrecoCategoriasStepFields } from "../PrecoCategoriasStepFields";
import { PrecoCobrancaFields } from "../PrecoCobrancaFields";
import { PrecoFaixasStepFields } from "../PrecoFaixasStepFields";
import { PrecoHorariosStepFields } from "../PrecoHorariosStepFields";
import { estadoDaSecao, idDaSecao, mudancasDaSecao, resumoDaSecao, SECOES, type MudancaSecao } from "../secoes";
import { Section, SectionTitle } from "../shared/FormSection.styles";
import { AjusteFino, Antes, Conteudo, Continuar, Depois, ErrosSecao, Mudancas } from "./PrecoSecoes.styles";
import type { PrecoForms } from "./usePrecoForms";

// Quantas mudanças aparecem no resumo da seção fechada; o restante vira "(+N)".
const MUDANCAS_VISIVEIS = 2;

export interface PrecoSecoesProps {
  forms: PrecoForms;
  // Edição: tabela como foi salva, para o "antes → depois" e a etiqueta "Alterado". Sem ela é um cadastro novo.
  original?: PrecoFormValues;
  // Seção aberta (só uma por vez) e como abrir ou fechar; `null` fecha todas.
  aberta: PrecoSecaoId | null;
  onAbrir: (id: PrecoSecaoId | null) => void;
  mensagens: SecoesPreco;
  // Só depois de visitada uma seção incompleta passa a mostrar pendência.
  visitadas: ReadonlySet<PrecoSecaoId>;
  // Seção da última tentativa de salvar que falhou na validação.
  falhaSecao: PrecoSecaoId | null;
  // Falso enquanto os degraus e a diária ainda são o modelo padrão do cadastro novo.
  faixasEditadas: boolean;
  disabled: boolean;
  convenios: { data?: ConveniadaOpcao[]; erro?: string; estado: "carregando" | "pronto" | "erro" };
}

function ResumoAlterado({ mudancas }: { mudancas: MudancaSecao[] }) {
  const visiveis = mudancas.slice(0, MUDANCAS_VISIVEIS);
  const restantes = mudancas.length - visiveis.length;
  return (
    <Mudancas>
      {visiveis.map((mudanca, index) => (
        <span key={`${mudanca.rotulo}-${index}`}>
          {mudanca.antes !== undefined && mudanca.depois !== undefined ? (
            <>
              {mudanca.rotulo}: <Antes>{mudanca.antes}</Antes> → <Depois>{mudanca.depois}</Depois>
            </>
          ) : mudanca.depois !== undefined ? (
            <>
              {mudanca.rotulo} adicionado: <Depois>{mudanca.depois}</Depois>
            </>
          ) : (
            <>
              {mudanca.rotulo} removido: <Antes>{mudanca.antes}</Antes>
            </>
          )}
        </span>
      ))}
      {restantes > 0 && <span>(+{restantes})</span>}
    </Mudancas>
  );
}

// As quatro seções do cadastro em acordeão, uma aberta por vez. Os painéis recolhidos continuam montados,
// então valores e erros dos campos se preservam entre seções.
export function PrecoSecoes({
  forms,
  original,
  aberta,
  onAbrir,
  mensagens,
  visitadas,
  falhaSecao,
  faixasEditadas,
  disabled,
  convenios,
}: PrecoSecoesProps) {
  const { infoForm, horariosForm, faixasForm, categoriasForm, values } = forms;
  const isEdit = original !== undefined;
  const diff = original ? diffPreco(original, values) : null;
  // O ajuste fino já abre quando a tabela tem horários que a grade não desenha (minutos, inativos, períodos).
  const [ajusteFinoAberto, setAjusteFinoAberto] = useState(() => horariosForaDaGrade(values.horarios).length > 0);

  function conteudoDa(id: PrecoSecaoId) {
    switch (id) {
      case "basico":
        return (
          <PrecoBasicoFields
            form={infoForm}
            disabled={disabled}
            convenios={convenios.data ?? []}
            conveniosErro={convenios.erro}
            conveniosState={convenios.estado}
          />
        );
      case "categorias":
        return <PrecoCategoriasStepFields form={categoriasForm} disabled={disabled} />;
      case "horarios":
        return (
          <>
            <GradeHorarios form={horariosForm} disabled={disabled} />
            <AjusteFino open={ajusteFinoAberto} onToggle={(event) => setAjusteFinoAberto(event.currentTarget.open)}>
              <summary>Ajuste fino: minutos exatos, horários inativos e períodos específicos</summary>
              <PrecoHorariosStepFields form={horariosForm} disabled={disabled} />
            </AjusteFino>
          </>
        );
      case "cobranca":
        return (
          <>
            <Section>
              <SectionTitle>Faixas de valores</SectionTitle>
              <PrecoFaixasStepFields
                form={faixasForm}
                disabled={disabled}
                showPercentual={values.info.tipoRegra === String(TIPO_REGRA.Convenio)}
                diariaValor={parseMoney(values.info.valorDiaria)}
              />
            </Section>
            <PrecoCobrancaFields form={infoForm} disabled={disabled} />
          </>
        );
    }
  }

  return (
    <Accordion>
      {SECOES.map((secao, index) => {
        const estado = estadoDaSecao({
          mensagens: mensagens[secao.id],
          visitada: visitadas.has(secao.id),
          aberta: aberta === secao.id,
          falhou: falhaSecao === secao.id,
        });
        const mudancas = diff ? mudancasDaSecao(secao.id, diff) : [];
        const marca: AccordionMark = estado === "pendente" ? index + 1 : estado;
        const proxima = SECOES[index + 1];
        const mensagensDoAviso = falhaSecao === secao.id ? mensagens[secao.id] : [];

        return (
          <AccordionItem
            key={secao.id}
            id={idDaSecao(secao.id)}
            title={secao.titulo}
            marca={marca}
            etiqueta={mudancas.length > 0 ? "Alterado" : undefined}
            summary={
              mudancas.length > 0 ? (
                <ResumoAlterado mudancas={mudancas} />
              ) : (
                resumoDaSecao(secao.id, values, { faixasEditadas: isEdit || faixasEditadas })
              )
            }
            open={aberta === secao.id}
            onOpenChange={(open) => onAbrir(open ? secao.id : null)}
            hasError={estado === "erro"}
          >
            <Conteudo>
              {mensagensDoAviso.length > 0 && (
                <ErrorBanner role="alert">
                  Há campos a corrigir em {secao.titulo}.
                  <ErrosSecao>
                    {mensagensDoAviso.map((mensagem, posicao) => (
                      <li key={`${mensagem}-${posicao}`}>{mensagem}</li>
                    ))}
                  </ErrosSecao>
                </ErrorBanner>
              )}
              {conteudoDa(secao.id)}
              {!isEdit && proxima && (
                <Continuar>
                  <Button type="button" variant="secondary" disabled={disabled} onClick={() => onAbrir(proxima.id)}>
                    Continuar
                  </Button>
                </Continuar>
              )}
            </Conteudo>
          </AccordionItem>
        );
      })}
    </Accordion>
  );
}
