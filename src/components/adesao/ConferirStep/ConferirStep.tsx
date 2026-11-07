"use client";

import { Fragment, ReactNode } from "react";
import { Checkbox } from "@/components/ui/Checkbox";
import { Link } from "@/components/ui/Link";
import { formatCEP } from "@/lib/cep";
import { descreverCondicao, descreverDuracao, formatarReais } from "@/lib/planos";
import {
  AceiteData,
  AdminUserData,
  BusinessHoursData,
  CompanyData,
  DIAS_SEMANA,
  MEIOS_PAGAMENTO,
  PaymentsData,
  TIPO_EMPRESA_LABEL,
} from "@/types/adesao";
import { DOCUMENTOS_ACEITE } from "@/lib/termos";
import { PlanoAdesao, TipoPlanoAdesao } from "@/types/plano";
import type { GrupoEmpresa } from "../CompanyStepFields";
import { ETAPA, type EtapaEditavel } from "../etapas";
import {
  Apoio,
  Detalhe,
  Editar,
  FraseTeste,
  Garantia,
  Garantias,
  Lista,
  LinhaAceite,
  Oculto,
  Riscado,
  Secao,
  SecaoCabecalho,
  SecaoTeste,
  SecaoTitulo,
  Secoes,
  Termo,
} from "./ConferirStep.styles";

export interface ConferirStepProps {
  // Tipo do plano enviado. Trial mostra o resumo do teste grátis no lugar do plano pago.
  plano: number;
  // Dados do plano pago escolhido (vêm do back-end); sem eles o bloco do plano não aparece.
  dadosDoPlano?: PlanoAdesao;
  // Dados do teste, só para a duração; sem eles o texto fica sem número.
  planoTeste?: PlanoAdesao;
  // Falso quando a etapa Plano não existe no fluxo (teste grátis vindo do site): não há para onde voltar.
  planoEditavel?: boolean;
  company: CompanyData;
  hours: BusinessHoursData;
  payments: PaymentsData;
  adminUser: AdminUserData;
  // Leva o usuário de volta à etapa (e, na empresa, ao bloco) para corrigir; nada é perdido.
  onEditar: (etapa: EtapaEditavel, bloco?: GrupoEmpresa) => void;
  aceite: AceiteData;
  // Mensagem de cada aceite pendente, mostrada junto da caixa.
  erroAceite?: Partial<Record<keyof AceiteData, string>>;
  onAceitar: (documento: keyof AceiteData, aceito: boolean) => void;
  // Durante o envio as caixas não mudam.
  desabilitado?: boolean;
}

// A senha nunca é exibida: só o tamanho fixo de uma máscara.
const SENHA_MASCARADA = "••••••••";

function horarioDoDia(dia: BusinessHoursData["horarios"][number]) {
  if (!dia.aberto) return "Fechado";
  if (dia.aberto24Horas) return "Aberto 24 horas";
  return `${dia.horarioAbertura} às ${dia.horarioFechamento}`;
}

function Bloco({
  titulo,
  onEditar,
  children,
}: {
  titulo: string;
  onEditar: () => void;
  children: ReactNode;
}) {
  return (
    <Secao aria-label={titulo}>
      <SecaoCabecalho>
        <SecaoTitulo>{titulo}</SecaoTitulo>
        <Editar type="button" aria-label={`Editar ${titulo}`} onClick={onEditar}>
          Editar
        </Editar>
      </SecaoCabecalho>
      <Lista>{children}</Lista>
    </Secao>
  );
}

// As mesmas condições que o site promete; nada de preço, cartão como exigência ou retenção de dados.
const GARANTIAS_DO_TESTE = ["Todas as funcionalidades", "Sem cartão de crédito", "Sem compromisso"];

// Só tem "Editar" quando o teste foi escolhido na etapa Plano; vindo do site (etapa Plano oculta) não há o que corrigir.
// A duração é a do back-end; sem ela o texto não cita número.
function ResumoTeste({ duracao, onEditar }: { duracao?: string; onEditar?: () => void }) {
  const titulo = duracao ? `Teste grátis por ${duracao}` : "Teste grátis";

  return (
    <SecaoTeste aria-label={titulo}>
      <SecaoCabecalho>
        <SecaoTitulo>{titulo}</SecaoTitulo>
        {onEditar && (
          <Editar type="button" aria-label="Editar Plano" onClick={onEditar}>
            Editar
          </Editar>
        )}
      </SecaoCabecalho>
      <FraseTeste>
        {duracao ? `Use o sistema completo por ${duracao}.` : "Use o sistema completo durante o teste."} No fim do
        teste, você decide se quer assinar.
      </FraseTeste>
      <Garantias>
        {GARANTIAS_DO_TESTE.map((garantia) => (
          <Garantia key={garantia}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden="true">
              <path d="M5 12.5l4.5 4.5L19 7.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {garantia}
          </Garantia>
        ))}
      </Garantias>
    </SecaoTeste>
  );
}

const APOIO_ACEITE: Record<keyof AceiteData, string> = {
  termos: "As regras para usar o Murel.",
  privacidade: "Como cuidamos dos dados da sua empresa e dos seus clientes.",
};

const NOME_ACEITE: Record<keyof AceiteData, string> = {
  termos: "aceiteTermos",
  privacidade: "aceitePrivacidade",
};

// O link fica fora do rótulo da caixa: clicar nele abre o documento sem marcar o aceite.
function BlocoAceite({
  documento,
  aceito,
  erro,
  desabilitado,
  onAceitar,
}: {
  documento: keyof AceiteData;
  aceito: boolean;
  erro?: string;
  desabilitado: boolean;
  onAceitar: (aceito: boolean) => void;
}) {
  const { titulo, url } = DOCUMENTOS_ACEITE[documento];

  return (
    <Secao aria-label={titulo}>
      <SecaoCabecalho>
        <SecaoTitulo>{titulo}</SecaoTitulo>
      </SecaoCabecalho>
      <LinhaAceite>
        <Apoio>{APOIO_ACEITE[documento]}</Apoio>
        <Link href={url} target="_blank" rel="noopener noreferrer" prefetch={false}>
          Ler {titulo} (abre em nova aba)
        </Link>
      </LinhaAceite>
      <Checkbox
        name={NOME_ACEITE[documento]}
        label={`Li e aceito ${documento === "termos" ? "os Termos de Uso" : "a Política de Privacidade"}`}
        checked={aceito}
        onCheckedChange={onAceitar}
        error={erro}
        disabled={desabilitado}
      />
    </Secao>
  );
}

function Linha({ termo, valor }: { termo: string; valor: ReactNode }) {
  return (
    <Fragment>
      <Termo>{termo}</Termo>
      <Detalhe>{valor}</Detalhe>
    </Fragment>
  );
}

// Em promoção o riscado é só visual; quem usa leitor de tela ouve "de ... por ...".
function ValorPorMes({ plano }: { plano: PlanoAdesao }) {
  const atual = formatarReais(plano.centavosAtual);
  if (!plano.emPromocao) return atual;

  const tabela = formatarReais(plano.centavosTabela);
  return (
    <>
      <Riscado aria-hidden="true">{tabela}</Riscado>
      <Oculto>de {tabela} por </Oculto>
      {atual}
    </>
  );
}

export function ConferirStep({
  plano,
  dadosDoPlano,
  planoTeste,
  planoEditavel = true,
  company,
  hours,
  payments,
  adminUser,
  onEditar,
  aceite,
  erroAceite = {},
  onAceitar,
  desabilitado = false,
}: ConferirStepProps) {
  const meios = MEIOS_PAGAMENTO.filter(({ key }) => payments[key]).map(({ label }) => label);

  const teste = plano === TipoPlanoAdesao.Trial;

  return (
    <Secoes>
      <Bloco titulo="Empresa" onEditar={() => onEditar(ETAPA.Empresa, "identificacao")}>
        <Linha termo="CNPJ" valor={company.cnpj} />
        <Linha termo="Razão social" valor={company.razaoSocial} />
        <Linha termo="Nome fantasia" valor={company.nomeFantasia} />
        <Linha
          termo="Tipo"
          valor={company.tipoEmpresa === "" ? "" : TIPO_EMPRESA_LABEL[company.tipoEmpresa]}
        />
        <Linha termo="Telefone" valor={company.telefone} />
      </Bloco>

      <Bloco titulo="Endereço e capacidade" onEditar={() => onEditar(ETAPA.Empresa, "endereco")}>
        <Linha termo="Endereço" valor={`${company.logradouro}, ${company.numero}`} />
        <Linha termo="Bairro" valor={company.bairro} />
        <Linha termo="Cidade" valor={`${company.cidade} - ${company.estado}`} />
        <Linha termo="CEP" valor={formatCEP(company.cep)} />
        <Linha termo="Vagas de carro" valor={company.quantidadeVagasCarro} />
        <Linha termo="Vagas de moto" valor={company.quantidadeVagasMoto} />
      </Bloco>

      <Bloco titulo="Pagamentos" onEditar={() => onEditar(ETAPA.Empresa, "capacidade")}>
        <Linha termo="Meios aceitos" valor={meios.join(", ")} />
      </Bloco>

      <Bloco titulo="Horários" onEditar={() => onEditar(ETAPA.Horarios)}>
        {DIAS_SEMANA.map((dia, index) => (
          <Linha key={dia.codigo} termo={dia.label} valor={horarioDoDia(hours.horarios[index])} />
        ))}
      </Bloco>

      <Bloco titulo="Titular" onEditar={() => onEditar(ETAPA.Titular)}>
        <Linha termo="Nome" valor={adminUser.nome} />
        <Linha termo="CPF" valor={adminUser.cpf} />
        <Linha termo="Celular" valor={adminUser.celular} />
        <Linha termo="E-mail" valor={adminUser.email} />
        <Linha termo="Senha" valor={SENHA_MASCARADA} />
      </Bloco>

      {teste ? (
        <ResumoTeste
          duracao={planoTeste ? descreverDuracao(planoTeste.meses) : undefined}
          onEditar={planoEditavel ? () => onEditar(ETAPA.Plano) : undefined}
        />
      ) : (
        dadosDoPlano && (
          <Bloco titulo="Plano" onEditar={() => onEditar(ETAPA.Plano)}>
            <Linha termo="Plano" valor={dadosDoPlano.nome} />
            <Linha termo="Valor por mês" valor={<ValorPorMes plano={dadosDoPlano} />} />
            <Linha termo="Condição" valor={descreverCondicao(dadosDoPlano)} />
          </Bloco>
        )
      )}

      {(["termos", "privacidade"] as const).map((documento) => (
        <BlocoAceite
          key={documento}
          documento={documento}
          aceito={aceite[documento]}
          erro={erroAceite[documento]}
          desabilitado={desabilitado}
          onAceitar={(aceito) => onAceitar(documento, aceito)}
        />
      ))}
    </Secoes>
  );
}
