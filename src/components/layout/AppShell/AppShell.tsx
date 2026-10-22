"use client";

import { ReactNode } from "react";
import { AppFooter } from "@/components/layout/AppFooter";
import { BottomNav } from "@/components/layout/BottomNav";
import { Gantry } from "@/components/layout/Gantry";
import { Header } from "@/components/layout/Header";
import { VeiculoModaisProvider } from "@/components/veiculos/VeiculoModais";
import { Layout, Main } from "./AppShell.styles";

export interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <VeiculoModaisProvider>
      <Layout>
        <Header />
        <Gantry />
        <Main>{children}</Main>
        <AppFooter />
        <BottomNav />
      </Layout>
    </VeiculoModaisProvider>
  );
}
