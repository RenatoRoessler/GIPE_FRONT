// Empresa que o usuário pode escolher ao entrar quando tem acesso a mais de uma.
export type EmpresaOpcao = {
  // Identificador (GUID) enviado a /autenticacao/selecionar-empresa.
  id: string;
  // Nome fantasia; razão social quando o nome fantasia não vem.
  nome: string;
  // Só dígitos, como a API envia; a tela aplica a máscara.
  cnpj: string;
  // Perfil do usuário nessa empresa (código e nome), quando a API informa.
  perfil?: number | null;
  perfilDescricao?: string | null;
};
