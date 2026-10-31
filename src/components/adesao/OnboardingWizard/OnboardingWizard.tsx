"use client";

import { ReactNode } from "react";
import { AdesaoShell } from "@/components/adesao/AdesaoShell";
import { AdminUserStepFields } from "@/components/adesao/AdminUserStepFields";
import { BusinessHoursStepFields } from "@/components/adesao/BusinessHoursStepFields";
import { CompanyStepFields, GrupoEmpresa } from "@/components/adesao/CompanyStepFields";
import { ConferirStep } from "@/components/adesao/ConferirStep";
import { useAdesaoWizard } from "@/components/adesao/useAdesaoWizard";
import { PagamentosFields } from "@/components/empresa/PagamentosFields";
import { Accordion, AccordionItem } from "@/components/ui/Accordion";
import { Button } from "@/components/ui/Button";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { BlocoAcoes, ErroAcoes, Form } from "./OnboardingWizard.styles";

const FORM_ID = "adesao-form";

const TITULOS = [
  "Dados da empresa",
  "Quando a empresa funciona?",
  "Usuário titular",
  "Confira os dados",
];

const DESCRICOES = [
  "Conte para a gente sobre a sua empresa.",
  "Defina os dias e horários de atendimento.",
  "Agora crie o usuário titular da conta.",
  "Revise antes de criar a conta. Dá para corrigir qualquer seção.",
];

const TITULO_BLOCO: Record<GrupoEmpresa, string> = {
  identificacao: "Identificação",
  endereco: "Endereço",
  capacidade: "Capacidade e pagamentos",
};

export function OnboardingWizard() {
  const wizard = useAdesaoWizard();
  const { etapa, etapas, dados, enviando } = wizard;
  const ultima = etapa === etapas.length;

  function resumoBloco(grupo: GrupoEmpresa): string | undefined {
    if (!wizard.blocosConcluidos.includes(grupo)) return undefined;
    const { company } = dados;
    if (grupo === "identificacao") return `${company.nomeFantasia} · ${company.cnpj}`;
    if (grupo === "endereco") return `${company.logradouro}, ${company.numero} · ${company.cidade}/${company.estado}`;
    return `${company.quantidadeVagasCarro} carros · ${company.quantidadeVagasMoto} motos`;
  }

  function bloco(grupo: GrupoEmpresa, conteudo: ReactNode, continuar: boolean) {
    return (
      <AccordionItem
        id={`bloco-${grupo}`}
        title={TITULO_BLOCO[grupo]}
        summary={resumoBloco(grupo)}
        open={wizard.blocosAbertos.includes(grupo)}
        onOpenChange={(aberto) => wizard.alternarBloco(grupo, aberto)}
      >
        {conteudo}
        {continuar && (
          <BlocoAcoes>
            <Button type="button" variant="secondary" size="sm" onClick={() => wizard.concluirBloco(grupo)}>
              Continuar
            </Button>
          </BlocoAcoes>
        )}
      </AccordionItem>
    );
  }

  const faltamAviso = wizard.faltam > 0 && (
    <ErrorBanner role="alert">
      {wizard.faltam === 1 ? "Falta 1 campo para corrigir." : `Faltam ${wizard.faltam} campos para corrigir.`}
    </ErrorBanner>
  );

  let conteudo: ReactNode;
  if (etapa === 1) {
    conteudo = (
      <>
        {faltamAviso}
        <Accordion>
          {bloco(
            "identificacao",
            <CompanyStepFields form={wizard.companyForm} grupo="identificacao" />,
            true,
          )}
          {bloco("endereco", <CompanyStepFields form={wizard.companyForm} grupo="endereco" />, true)}
          {bloco(
            "capacidade",
            <>
              <CompanyStepFields form={wizard.companyForm} grupo="capacidade" />
              <PagamentosFields form={wizard.paymentsForm} />
            </>,
            false,
          )}
        </Accordion>
      </>
    );
  } else if (etapa === 2) {
    conteudo = (
      <>
        {faltamAviso}
        <BusinessHoursStepFields form={wizard.hoursForm} />
      </>
    );
  } else if (etapa === 3) {
    conteudo = (
      <>
        {faltamAviso}
        <AdminUserStepFields form={wizard.adminUserForm} />
      </>
    );
  } else {
    const erro = wizard.erroBackend;
    conteudo = (
      <>
        {erro && (
          <ErrorBanner role="alert">
            <ErroAcoes>
              {erro.mensagem}
              {erro.alvo && (
                <Button type="button" variant="secondary" size="sm" onClick={() => wizard.corrigir(erro.alvo!)}>
                  Corrigir {erro.alvo.rotulo}
                </Button>
              )}
            </ErroAcoes>
          </ErrorBanner>
        )}
        <ConferirStep {...dados} onEditar={wizard.editar} />
      </>
    );
  }

  const proximaEtapa = etapas[etapa];
  let rotuloPrincipal = `Próximo: ${proximaEtapa}`;
  if (ultima) rotuloPrincipal = enviando ? "Criando conta…" : "Criar conta";
  else if (wizard.retornoConferencia) rotuloPrincipal = "Voltar para a conferência";

  return (
    <AdesaoShell
      etapas={etapas}
      etapaAtual={etapa}
      onEtapaClick={wizard.irParaEtapa}
      titulo={TITULOS[etapa - 1]}
      descricao={DESCRICOES[etapa - 1]}
      tituloRef={wizard.tituloRef}
      credencial={wizard.credencial}
      secundaria={
        etapa > 1 ? (
          <Button type="button" variant="secondary" onClick={wizard.voltar} disabled={enviando}>
            Voltar
          </Button>
        ) : undefined
      }
      principal={
        <Button type="submit" form={FORM_ID} disabled={enviando}>
          {rotuloPrincipal}
        </Button>
      }
    >
      <Form
        id={FORM_ID}
        // A validação é nossa (erro junto do campo, foco no primeiro inválido); a nativa travaria o envio
        // com campos `required` dentro de blocos recolhidos.
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          event.stopPropagation();
          void (ultima ? wizard.enviar() : wizard.avancar());
        }}
      >
        {conteudo}
      </Form>
    </AdesaoShell>
  );
}
