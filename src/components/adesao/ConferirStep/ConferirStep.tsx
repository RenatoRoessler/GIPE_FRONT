"use client";

import { Fragment, ReactNode } from "react";
import { formatCEP } from "@/lib/cep";
import { buscarPlano, descreverTotal, formatarReais } from "@/lib/planos";
import {
  AdminUserData,
  BusinessHoursData,
  CompanyData,
  DIAS_SEMANA,
  MEIOS_PAGAMENTO,
  PaymentsData,
  TIPO_EMPRESA_LABEL,
} from "@/types/adesao";
import { TipoPlanoAdesao } from "@/types/plano";
import type { GrupoEmpresa } from "../CompanyStepFields";
import { ETAPA, type EtapaEditavel } from "../etapas";
import {
  Detalhe,
  Editar,
  FraseTeste,
  Garantia,
  Garantias,
  Lista,
  Secao,
  SecaoCabecalho,
  SecaoTeste,
  SecaoTitulo,
  Secoes,
  Termo,
} from "./ConferirStep.styles";

export interface ConferirStepProps {
  // Trial mostra o resumo do teste grátis no lugar do plano pago.
  plano: TipoPlanoAdesao;
  // Falso quando a etapa Plano não existe no fluxo (teste grátis vindo do site): não há para onde voltar.
  planoEditavel?: boolean;
  company: CompanyData;
  hours: BusinessHoursData;
  payments: PaymentsData;
  adminUser: AdminUserData;
  // Leva o usuário de volta à etapa (e, na empresa, ao bloco) para corrigir; nada é perdido.
  onEditar: (etapa: EtapaEditavel, bloco?: GrupoEmpresa) => void;
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

const TITULO_TESTE = "Teste grátis por 30 dias";

// As mesmas condições que o site promete; nada de preço, cartão como exigência ou retenção de dados.
const GARANTIAS_DO_TESTE = ["Todas as funcionalidades", "Sem cartão de crédito", "Sem compromisso"];

// Só tem "Editar" quando o teste foi escolhido na etapa Plano; vindo do site (etapa Plano oculta) não há o que corrigir.
function ResumoTeste({ onEditar }: { onEditar?: () => void }) {
  return (
    <SecaoTeste aria-label={TITULO_TESTE}>
      <SecaoCabecalho>
        <SecaoTitulo>{TITULO_TESTE}</SecaoTitulo>
        {onEditar && (
          <Editar type="button" aria-label="Editar Plano" onClick={onEditar}>
            Editar
          </Editar>
        )}
      </SecaoCabecalho>
      <FraseTeste>
        Use o sistema completo por 30 dias. No fim do teste, você escolhe o plano que fizer mais sentido.
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

function Linha({ termo, valor }: { termo: string; valor: string }) {
  return (
    <Fragment>
      <Termo>{termo}</Termo>
      <Detalhe>{valor}</Detalhe>
    </Fragment>
  );
}

export function ConferirStep({
  plano,
  planoEditavel = true,
  company,
  hours,
  payments,
  adminUser,
  onEditar,
}: ConferirStepProps) {
  const meios = MEIOS_PAGAMENTO.filter(({ key }) => payments[key]).map(({ label }) => label);

  const dadosDoPlano = plano === TipoPlanoAdesao.Trial ? undefined : buscarPlano(plano);

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

      {dadosDoPlano ? (
        <Bloco titulo="Plano" onEditar={() => onEditar(ETAPA.Plano)}>
          <Linha termo="Plano" valor={dadosDoPlano.nome} />
          <Linha termo="Valor por mês" valor={formatarReais(dadosDoPlano.centavosPorMes)} />
          <Linha termo="Total" valor={descreverTotal(dadosDoPlano)} />
        </Bloco>
      ) : (
        <ResumoTeste onEditar={planoEditavel ? () => onEditar(ETAPA.Plano) : undefined} />
      )}
    </Secoes>
  );
}
