"use client";

import { ReactNode } from "react";
import { AppFooter } from "@/components/layout/AppFooter";
import { Gantry } from "@/components/layout/Gantry";
import { Header } from "@/components/layout/Header";
import { Layout, Main } from "./AppShell.styles";

export interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <Layout>
      <Header />
      <Gantry />
      <Main>{children}</Main>
      <AppFooter />
    </Layout>
  );
}
