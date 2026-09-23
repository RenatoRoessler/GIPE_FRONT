"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { AdminUserStepFields } from "@/components/adesao/AdminUserStepFields";
import { CompanyStepFields } from "@/components/adesao/CompanyStepFields";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { PageBackground } from "@/components/ui/PageBackground";
import { Stepper } from "@/components/ui/Stepper";
import { Text } from "@/components/ui/Text";
import { isValidCNPJ } from "@/lib/cnpj";
import { isValidCPF } from "@/lib/cpf";
import { isValidEmail } from "@/lib/email";
import {
  AdminUserData,
  CompanyData,
  EMPTY_ADMIN_USER_DATA,
  EMPTY_COMPANY_DATA,
} from "@/types/adesao";
import { Actions, Brand, ErrorBanner, Form, Header, TitleGroup } from "./OnboardingWizard.styles";

const STEPS = ["Dados da empresa", "Usuário administrador"];

type CompanyErrors = Partial<Record<keyof CompanyData, string>>;
type AdminUserErrors = Partial<Record<keyof AdminUserData, string>>;

function validateCompany(data: CompanyData): CompanyErrors {
  const errors: CompanyErrors = {};

  if (!data.cnpj.trim()) errors.cnpj = "Informe o CNPJ";
  else if (!isValidCNPJ(data.cnpj)) errors.cnpj = "CNPJ inválido";

  if (!data.razaoSocial.trim()) errors.razaoSocial = "Informe a razão social";
  if (!data.nomeFantasia.trim()) errors.nomeFantasia = "Informe o nome fantasia";
  if (!data.endereco.trim()) errors.endereco = "Informe o endereço";
  if (!data.telefone.trim()) errors.telefone = "Informe o telefone";
  if (!data.tipoEmpresa) errors.tipoEmpresa = "Selecione o tipo de empresa";

  return errors;
}

function validateAdminUser(data: AdminUserData): AdminUserErrors {
  const errors: AdminUserErrors = {};

  if (!data.nome.trim()) errors.nome = "Informe o nome";
  if (!data.sobrenome.trim()) errors.sobrenome = "Informe o sobrenome";

  if (!data.email.trim()) errors.email = "Informe o e-mail";
  else if (!isValidEmail(data.email)) errors.email = "E-mail inválido";

  if (!data.cpf.trim()) errors.cpf = "Informe o CPF";
  else if (!isValidCPF(data.cpf)) errors.cpf = "CPF inválido";

  if (!data.senha) errors.senha = "Informe a senha";
  else if (data.senha.length < 6) errors.senha = "A senha precisa ter ao menos 6 caracteres";

  if (!data.repetirSenha) errors.repetirSenha = "Confirme a senha";
  else if (data.repetirSenha !== data.senha) errors.repetirSenha = "As senhas não coincidem";

  return errors;
}

export function OnboardingWizard() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [company, setCompany] = useState<CompanyData>(EMPTY_COMPANY_DATA);
  const [adminUser, setAdminUser] = useState<AdminUserData>(EMPTY_ADMIN_USER_DATA);
  const [companyErrors, setCompanyErrors] = useState<CompanyErrors>({});
  const [adminUserErrors, setAdminUserErrors] = useState<AdminUserErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  function updateCompany<Field extends keyof CompanyData>(field: Field, value: CompanyData[Field]) {
    setCompany((prev) => ({ ...prev, [field]: value }));
  }

  function updateAdminUser<Field extends keyof AdminUserData>(
    field: Field,
    value: AdminUserData[Field],
  ) {
    setAdminUser((prev) => ({ ...prev, [field]: value }));
  }

  function handleNext(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const errors = validateCompany(company);
    setCompanyErrors(errors);

    if (Object.keys(errors).length === 0) {
      setStep(2);
    }
  }

  function handleBack() {
    setStep(1);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const errors = validateAdminUser(adminUser);
    setAdminUserErrors(errors);

    if (Object.keys(errors).length > 0) {
      return;
    }

    setSubmitError(null);
    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      router.push("/login?cadastro=sucesso");
    }, 1000);
  }

  return (
    <PageBackground>
      <Card maxWidth="640px">
        <Header>
          <TitleGroup>
            <Brand>GIPE</Brand>
            <Text variant="heading" as="h1">
              Adesão ao sistema
            </Text>
            <Text variant="muted">
              {step === 1
                ? "Conte para a gente sobre a sua empresa."
                : "Agora crie o usuário administrador da conta."}
            </Text>
          </TitleGroup>
          <Stepper steps={STEPS} currentStep={step} />
        </Header>

        {step === 1 ? (
          <Form onSubmit={handleNext}>
            <CompanyStepFields value={company} errors={companyErrors} onChange={updateCompany} />
            <Actions>
              <Button type="submit">Próximo</Button>
            </Actions>
          </Form>
        ) : (
          <Form onSubmit={handleSubmit}>
            {submitError && <ErrorBanner role="alert">{submitError}</ErrorBanner>}
            <AdminUserStepFields
              value={adminUser}
              errors={adminUserErrors}
              onChange={updateAdminUser}
              disabled={isLoading}
            />
            <Actions>
              <Button type="button" variant="secondary" onClick={handleBack} disabled={isLoading}>
                Voltar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Salvando..." : "Salvar"}
              </Button>
            </Actions>
          </Form>
        )}
      </Card>
    </PageBackground>
  );
}
