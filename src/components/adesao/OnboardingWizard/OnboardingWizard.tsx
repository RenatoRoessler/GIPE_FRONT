"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AdminUserStepFields } from "@/components/adesao/AdminUserStepFields";
import { CompanyStepFields } from "@/components/adesao/CompanyStepFields";
import { useAppForm, zodFieldErrors } from "@/components/form";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { PageBackground } from "@/components/ui/PageBackground";
import { Stepper } from "@/components/ui/Stepper";
import { Text } from "@/components/ui/Text";
import { mockSaveOnboarding } from "@/lib/mockApi";
import { adminUserSchema, companySchema } from "@/lib/schemas/adesao";
import {
  AdminUserData,
  CompanyData,
  EMPTY_ADMIN_USER_DATA,
  EMPTY_COMPANY_DATA,
} from "@/types/adesao";
import { Actions, Brand, ErrorBanner, Form, Header, TitleGroup } from "./OnboardingWizard.styles";

const STEPS = ["Dados da empresa", "Usuário administrador"];

export function OnboardingWizard() {
  const router = useRouter();
  const [step, setStep] = useState(1);

  const mutation = useMutation({
    mutationFn: (payload: { company: CompanyData; adminUser: AdminUserData }) =>
      mockSaveOnboarding({ cnpj: payload.company.cnpj, email: payload.adminUser.email }),
    onSuccess: () => {
      router.push("/login?cadastro=sucesso");
    },
  });

  const companyForm = useAppForm({
    defaultValues: EMPTY_COMPANY_DATA,
    validators: {
      onChange: ({ value }) => {
        const result = companySchema.safeParse(value);
        return result.success ? undefined : zodFieldErrors(result);
      },
    },
    onSubmit: () => {
      setStep(2);
    },
  });

  const adminUserForm = useAppForm({
    defaultValues: EMPTY_ADMIN_USER_DATA,
    validators: {
      onChange: ({ value }) => {
        const result = adminUserSchema.safeParse(value);
        return result.success ? undefined : zodFieldErrors(result);
      },
    },
    onSubmit: async ({ value }) => {
      await mutation.mutateAsync({
        company: companyForm.state.values,
        adminUser: value,
      });
    },
  });

  function handleBack() {
    setStep(1);
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
          <Form
            onSubmit={(event) => {
              event.preventDefault();
              event.stopPropagation();
              void companyForm.handleSubmit();
            }}
          >
            <CompanyStepFields form={companyForm} />
            <Actions>
              <Button type="submit">Próximo</Button>
            </Actions>
          </Form>
        ) : (
          <Form
            onSubmit={(event) => {
              event.preventDefault();
              event.stopPropagation();
              void adminUserForm.handleSubmit();
            }}
          >
            {mutation.isError && <ErrorBanner role="alert">{mutation.error.message}</ErrorBanner>}
            <AdminUserStepFields form={adminUserForm} disabled={mutation.isPending} />
            <Actions>
              <Button
                type="button"
                variant="secondary"
                onClick={handleBack}
                disabled={mutation.isPending}
              >
                Voltar
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? "Salvando..." : "Salvar"}
              </Button>
            </Actions>
          </Form>
        )}
      </Card>
    </PageBackground>
  );
}
