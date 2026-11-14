import { AREA, podeAcessar } from "@/lib/permissoes";
import type { PerfilUsuario } from "@/types/usuario";

export const ROTA_FILA_SERVICOS = "/servicos";
export const ROTA_CATALOGO_SERVICOS = "/servicos/catalogo";

// Id do serviço no endereço: só inteiro positivo em texto; o resto é descartado, sem erro.
function servicoDoEndereco(valor: string | null): string | null {
  return valor !== null && /^[1-9]\d*$/.test(valor) ? valor : null;
}

// Serviços tinha uma tela só, com abas (`/servicos?aba=catalogo`). Agora a fila e o catálogo têm endereço próprio, e os
// links e favoritos antigos não podem cair no acesso negado: quem não vê a fila mas vê o catálogo é levado a ele, com a
// seleção (`?servico=`) quando havia. Quem vê a fila fica onde está (o `?aba=` é ignorado). Devolve o destino, ou nulo
// quando não há o que redirecionar. Usa a regra padrão por perfil, a mesma do proxy.
export function destinoLegadoDeServicos(perfil: PerfilUsuario | null | undefined, pathname: string, searchParams: URLSearchParams): string | null {
  if (pathname !== ROTA_FILA_SERVICOS) return null;
  if (podeAcessar(perfil, AREA.ServicosFila)) return null;
  if (!podeAcessar(perfil, AREA.ServicosCatalogoConsulta)) return null;

  const servico = servicoDoEndereco(searchParams.get("servico"));
  return servico === null ? ROTA_CATALOGO_SERVICOS : `${ROTA_CATALOGO_SERVICOS}?servico=${servico}`;
}
