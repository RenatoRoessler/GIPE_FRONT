"use client";

import { Fragment, ReactNode } from "react";
import { formatCEP } from "@/lib/cep";
import {
  AdminUserData,
  BusinessHoursData,
  CompanyData,
  DIAS_SEMANA,
  MEIOS_PAGAMENTO,
  PaymentsData,
  TIPO_EMPRESA_LABEL,
} from "@/types/adesao";
import type { GrupoEmpresa } from "../CompanyStepFields";
import { Detalhe, Editar, Lista, Secao, SecaoCabecalho, SecaoTitulo, Secoes, Termo } from "./ConferirStep.styles";

export interface ConferirStepProps {
  company: CompanyData;
  hours: BusinessHoursData;
  payments: PaymentsData;
  adminUser: AdminUserData;
  // Leva o usuário de volta à etapa (e, na empresa, ao bloco) para corrigir; nada é perdido.
  onEditar: (etapa: 1 | 2 | 3, bloco?: GrupoEmpresa) => void;
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

function Linha({ termo, valor }: { termo: string; valor: string }) {
  return (
    <Fragment>
      <Termo>{termo}</Termo>
      <Detalhe>{valor}</Detalhe>
    </Fragment>
  );
}

export function ConferirStep({ company, hours, payments, adminUser, onEditar }: ConferirStepProps) {
  const meios = MEIOS_PAGAMENTO.filter(({ key }) => payments[key]).map(({ label }) => label);

  return (
    <Secoes>
      <Bloco titulo="Empresa" onEditar={() => onEditar(1, "identificacao")}>
        <Linha termo="CNPJ" valor={company.cnpj} />
        <Linha termo="Razão social" valor={company.razaoSocial} />
        <Linha termo="Nome fantasia" valor={company.nomeFantasia} />
        <Linha
          termo="Tipo"
          valor={company.tipoEmpresa === "" ? "" : TIPO_EMPRESA_LABEL[company.tipoEmpresa]}
        />
        <Linha termo="Telefone" valor={company.telefone} />
      </Bloco>

      <Bloco titulo="Endereço e capacidade" onEditar={() => onEditar(1, "endereco")}>
        <Linha termo="Endereço" valor={`${company.logradouro}, ${company.numero}`} />
        <Linha termo="Bairro" valor={company.bairro} />
        <Linha termo="Cidade" valor={`${company.cidade} - ${company.estado}`} />
        <Linha termo="CEP" valor={formatCEP(company.cep)} />
        <Linha termo="Vagas de carro" valor={company.quantidadeVagasCarro} />
        <Linha termo="Vagas de moto" valor={company.quantidadeVagasMoto} />
      </Bloco>

      <Bloco titulo="Pagamentos" onEditar={() => onEditar(1, "capacidade")}>
        <Linha termo="Meios aceitos" valor={meios.join(", ")} />
      </Bloco>

      <Bloco titulo="Horários" onEditar={() => onEditar(2)}>
        {DIAS_SEMANA.map((dia, index) => (
          <Linha key={dia.codigo} termo={dia.label} valor={horarioDoDia(hours.horarios[index])} />
        ))}
      </Bloco>

      <Bloco titulo="Titular" onEditar={() => onEditar(3)}>
        <Linha termo="Nome" valor={adminUser.nome} />
        <Linha termo="CPF" valor={adminUser.cpf} />
        <Linha termo="Celular" valor={adminUser.celular} />
        <Linha termo="E-mail" valor={adminUser.email} />
        <Linha termo="Senha" valor={SENHA_MASCARADA} />
      </Bloco>
    </Secoes>
  );
}
