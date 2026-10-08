"use client";

import { Link } from "@/components/ui/Link";
import { getVersionInfo } from "@/lib/version";
import { Footer } from "./AppFooter.styles";

export function AppFooter() {
  const { complete, version, highlight } = getVersionInfo();
  const href = highlight ? `/atualizacoes#v${highlight}` : "/atualizacoes";

  return (
    <Footer>
      <Link href={href}>{complete && version ? `v${version}` : "Versão indisponível"}</Link>
    </Footer>
  );
}
