"use client";

import { useState } from "react";
import { useServerInsertedHTML } from "next/navigation";
import { ServerStyleSheet, StyleSheetManager } from "styled-components";
import { ThemeModeProvider } from "@/contexts/ThemeModeContext";

export default function StyledComponentsRegistry({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sheet] = useState(() => new ServerStyleSheet());

  useServerInsertedHTML(() => {
    const styles = sheet.getStyleElement();
    sheet.instance.clearTag();
    return <>{styles}</>;
  });

  if (typeof window !== "undefined") {
    return <ThemeModeProvider>{children}</ThemeModeProvider>;
  }

  return (
    <StyleSheetManager sheet={sheet.instance}>
      <ThemeModeProvider>{children}</ThemeModeProvider>
    </StyleSheetManager>
  );
}
