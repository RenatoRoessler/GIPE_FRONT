"use client";

import { useState } from "react";
import { useServerInsertedHTML } from "next/navigation";
import { QueryClientProvider } from "@tanstack/react-query";
import { ServerStyleSheet, StyleSheetManager } from "styled-components";
import { CurrentUserProvider } from "@/contexts/CurrentUserContext";
import { ThemeModeProvider } from "@/contexts/ThemeModeContext";
import { createQueryClient } from "@/lib/queryClient";

export default function StyledComponentsRegistry({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sheet] = useState(() => new ServerStyleSheet());
  const [queryClient] = useState(() => createQueryClient());

  useServerInsertedHTML(() => {
    const styles = sheet.getStyleElement();
    sheet.instance.clearTag();
    return <>{styles}</>;
  });

  if (typeof window !== "undefined") {
    return (
      <QueryClientProvider client={queryClient}>
        <CurrentUserProvider>
          <ThemeModeProvider>{children}</ThemeModeProvider>
        </CurrentUserProvider>
      </QueryClientProvider>
    );
  }

  return (
    <StyleSheetManager sheet={sheet.instance}>
      <QueryClientProvider client={queryClient}>
        <CurrentUserProvider>
          <ThemeModeProvider>{children}</ThemeModeProvider>
        </CurrentUserProvider>
      </QueryClientProvider>
    </StyleSheetManager>
  );
}
