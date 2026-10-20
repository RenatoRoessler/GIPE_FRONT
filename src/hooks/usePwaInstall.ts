"use client";

import { useCallback, useSyncExternalStore } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

// O navegador dispara `beforeinstallprompt` uma única vez; guardamos o evento fora do React
// para que qualquer botão de instalar (header, dashboard, menu) o encontre, mesmo montado depois.
let installEvent: BeforeInstallPromptEvent | null = null;
let installed = false;
let listening = false;
const listeners = new Set<() => void>();

function emit() {
  snapshot = computeSnapshot();
  listeners.forEach((listener) => listener());
}

function isStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

interface PwaInstallState {
  canInstall: boolean;
  showIosHint: boolean;
}

const serverSnapshot: PwaInstallState = { canInstall: false, showIosHint: false };

function computeSnapshot(): PwaInstallState {
  const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const standalone = installed || isStandalone();
  return {
    canInstall: !standalone && installEvent !== null,
    showIosHint: !standalone && isIos && installEvent === null,
  };
}

let snapshot: PwaInstallState | null = null;

function getSnapshot() {
  snapshot ??= computeSnapshot();
  return snapshot;
}

function startListening() {
  if (listening) return;
  listening = true;

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    installEvent = event as BeforeInstallPromptEvent;
    emit();
  });
  window.addEventListener("appinstalled", () => {
    installed = true;
    installEvent = null;
    emit();
  });
}

function subscribe(listener: () => void) {
  startListening();
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function usePwaInstall() {
  const { canInstall, showIosHint } = useSyncExternalStore(
    subscribe,
    getSnapshot,
    () => serverSnapshot,
  );

  const install = useCallback(async () => {
    if (!installEvent) return;
    const event = installEvent;
    await event.prompt();
    await event.userChoice;
    installEvent = null;
    emit();
  }, []);

  return { canInstall, showIosHint, install };
}
