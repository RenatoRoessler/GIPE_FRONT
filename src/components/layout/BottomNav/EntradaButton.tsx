"use client";

import { PlusTabIcon } from "./BottomBarIcons";
import { EntradaCircle, EntradaTab, IconPill, TabLabel } from "./BottomNav.styles";

export interface EntradaButtonProps {
  // Nome curto exibido sob o botão.
  label: string;
  // Marca o botão como alvo de um passo do tour de onboarding.
  tourId?: string;
  onClick: () => void;
}

// Botão central da barra inferior: abre o registro de entrada de veículo. O espaçador tem o tamanho da pílula das
// outras abas, para o nome ficar na mesma linha delas; o círculo é posicionado sobre ele e sobressai acima da barra.
export const EntradaButton = ({ label, tourId, onClick }: EntradaButtonProps) => (
  <EntradaTab type="button" $active={false} aria-haspopup="dialog" data-tour-id={tourId} onClick={onClick}>
    <IconPill $active={false} aria-hidden="true" />
    <EntradaCircle aria-hidden="true">
      <PlusTabIcon />
    </EntradaCircle>
    <TabLabel>{label}</TabLabel>
  </EntradaTab>
);
