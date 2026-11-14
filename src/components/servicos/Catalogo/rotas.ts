// Os endereços do catálogo: a lista, o cadastro de um serviço novo e a edição de um serviço.
export const URL_DO_CATALOGO = "/servicos/catalogo";
export const URL_DO_NOVO_SERVICO = `${URL_DO_CATALOGO}/novo`;
export const urlDoServico = (id: number) => `${URL_DO_CATALOGO}/${id}`;
