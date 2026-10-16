"use client";

import { KeyboardEvent, ReactNode, useId, useRef } from "react";
import { Panel, Tab, TabList } from "./Tabs.styles";

export interface TabsItem {
  id: string;
  label: string;
}

export interface TabsProps {
  tabs: TabsItem[];
  value: string;
  onChange: (id: string) => void;
  "aria-label": string;
  // Conteúdo do painel da aba ativa.
  children: ReactNode;
}

// Abas com seleção automática ao navegar por setas, Home e End; só a aba ativa entra na ordem de Tab.
export function Tabs({ tabs, value, onChange, "aria-label": ariaLabel, children }: TabsProps) {
  const baseId = useId();
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  function focusAndSelect(index: number) {
    const target = tabs[(index + tabs.length) % tabs.length];
    onChange(target.id);
    tabRefs.current[target.id]?.focus();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    switch (event.key) {
      case "ArrowRight":
        event.preventDefault();
        focusAndSelect(index + 1);
        break;
      case "ArrowLeft":
        event.preventDefault();
        focusAndSelect(index - 1);
        break;
      case "Home":
        event.preventDefault();
        focusAndSelect(0);
        break;
      case "End":
        event.preventDefault();
        focusAndSelect(tabs.length - 1);
        break;
    }
  }

  return (
    <div>
      <TabList role="tablist" aria-label={ariaLabel}>
        {tabs.map((tab, index) => {
          const active = tab.id === value;
          return (
            <Tab
              key={tab.id}
              ref={(node) => {
                tabRefs.current[tab.id] = node;
              }}
              type="button"
              role="tab"
              id={`${baseId}-tab-${tab.id}`}
              aria-selected={active}
              aria-controls={`${baseId}-panel-${tab.id}`}
              tabIndex={active ? 0 : -1}
              $active={active}
              onClick={() => onChange(tab.id)}
              onKeyDown={(event) => handleKeyDown(event, index)}
            >
              {tab.label}
            </Tab>
          );
        })}
      </TabList>
      <Panel role="tabpanel" id={`${baseId}-panel-${value}`} aria-labelledby={`${baseId}-tab-${value}`}>
        {children}
      </Panel>
    </div>
  );
}
