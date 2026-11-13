# PRD: Layout de Serviços no Ticket do Pátio

> Referências visuais: `docs/specs/input.md` e as imagens `WhatsApp Image 2026-11-12 at 20.55.25.jpeg` (ticket), `2.jpeg` (adicionar), `3.jpeg` (depois de adicionado), `4.jpeg` (detalhe do serviço) e `6.jpeg` (comprovante de entrada).

## Problema
O módulo de Serviços já permite acrescentar serviços a um veículo no pátio, mas a experiência dentro do ticket de entrada é pouco clara. O operador não vê, num só lugar, quanto o cliente deve (estadia + serviços), em que pé está cada serviço nem o que falta para liberar a saída. O cliente, por sua vez, não tem como acompanhar os serviços no comprovante de entrada que recebe.

## Objetivo
No ticket de um veículo do pátio, o operador adiciona serviços, acompanha o status de cada um e enxerga o valor total (estadia + serviços) de forma clara, tanto no celular quanto no desktop. O comprovante de entrada do cliente mostra os serviços contratados e o progresso deles.

## Usuário-alvo
- **Caixa / Manobrista / Gerente / Administrador**: abrem o ticket do veículo no pátio, adicionam serviços e registram a saída.
- **Lavador**: consulta e atualiza o status dos serviços do veículo.
- **Cliente**: abre o comprovante de entrada (link/QR) e acompanha os serviços.

O acesso a cada ação segue as permissões por perfil já existentes (ver PRD `modulo-servicos`).

## Requisitos funcionais

### Ticket do veículo no pátio
- RF1: Quando a empresa tem serviços ligados, o ticket exibe um bloco "Serviços adicionais" com a ação "Adicionar serviço". Quando não há serviço no veículo, esse é o único conteúdo do bloco.
- RF2: O ticket mostra o cartão de valor "Valor até agora" com o total (estadia + serviços) e, quando há serviços, o detalhamento "X estadia + Y serviços".

### Adicionar serviços
- RF3: Ao tocar em "Adicionar serviço", abre uma folha/modal com o título "Adicionar serviços", a placa, a categoria do veículo e a indicação de que os preços são os dessa categoria.
- RF4: A folha lista os serviços ativos do catálogo com nome, descrição curta/duração estimada e preço da categoria do veículo (ou "Grátis" quando o valor é zero), permite selecionar vários e buscar por nome.
- RF5: O rodapé da folha mostra a quantidade de serviços selecionados, o acréscimo total e o botão de confirmação com o valor ("Adicionar ao ticket · + R$ X"). Sem seleção, o botão fica desabilitado.

### Serviços adicionados
- RF6: Depois de adicionados, o bloco passa a "Serviços · N", lista cada serviço com nome, valor e status (Na fila, Em andamento, Pronto), mostra o "Subtotal serviços" e mantém a ação "Adicionar".
- RF7: Cada serviço tem um menu de ações (⋮) que abre o detalhe do serviço.
- RF8: Quando existe serviço que ainda não está pronto, o ticket mostra o aviso "N serviço(s) ainda não está(ão) pronto(s)" acima das ações de saída. O aviso é **informativo e não bloqueia** o registro da saída.
- RF9: O valor exibido no botão "Registrar saída" inclui os serviços.

### Detalhe do serviço
- RF10: O detalhe mostra o nome do serviço, o valor e quem/quando o adicionou, e permite trocar o status entre Na fila, Em andamento e Pronto.
- RF11: O detalhe permite remover o serviço (cancelar), exigindo o motivo, e informa que a alteração fica no histórico do ticket. Remover só é oferecido enquanto o serviço está na fila (regra já definida no módulo de Serviços).

### Comprovante de entrada (cliente)
- RF12: Quando o veículo tem serviços, o comprovante mostra o valor dos serviços junto ao da estadia (linhas "Estadia" e "Serviços (N)") e o total em "Valor até agora".
- RF13: O comprovante traz o cartão "Seus serviços" com o progresso ("X de N prontos"), e para cada serviço nome, valor, status e o horário (previsão enquanto em andamento, hora em que ficou pronto).
- RF14: Sem serviços, o comprovante permanece como hoje (nenhum cartão de serviços).

### Transversais
- RF15: As telas funcionam bem em celular (uso no pátio) e desktop, seguindo o design system do projeto.
- RF16: Erros de validação, sessão expirada e falta de permissão geram mensagem clara.

## Fora de escopo
- **Trocar serviço**, **Responsável** (atribuir lavador) e **Observação** por serviço, presentes no mockup `4.jpeg`: dependem de endpoints que o back-end ainda não oferece. Ficam para um PRD próprio quando a API suportar.
- Bloquear a saída por serviço pendente.
- Cobrança/fechamento dos serviços na saída, caixa e nota fiscal (continua como definido no módulo de Serviços).
- Histórico/auditoria navegável do ticket (a frase do detalhe só informa que a alteração é registrada, se o back registrar).
- Alterações no catálogo de serviços, na fila do lavador e nas permissões.

## Dependências e premissas
- **Comprovante público (RF12 a RF14):** depende de o endpoint público do comprovante devolver os serviços do veículo (nome, valor, status e horários). Se não devolver, esses requisitos ficam bloqueados até o back entregar.
- As regras de preço, status e cancelamento são as do back-end e do PRD `modulo-servicos`; este PRD trata da apresentação e do fluxo no ticket.
- Premissas assumidas sem confirmação do usuário (revisar na aprovação): trocar/responsável/observação fora de escopo; comprovante incluído como dependente do back; aviso de serviço pendente não bloqueia a saída.

## Critérios de aceite
- [ ] Com serviços ligados e nenhum serviço no veículo, o ticket mostra "Serviços adicionais" com o botão "Adicionar serviço".
- [ ] A folha de adicionar mostra os serviços ativos com preço da categoria do veículo, aceita busca e seleção múltipla.
- [ ] O rodapé da folha mostra a contagem e o acréscimo corretos, e confirmar adiciona os serviços ao ticket.
- [ ] Depois de adicionar, o ticket lista os serviços com status, o subtotal de serviços e o "Valor até agora" com estadia + serviços.
- [ ] O aviso de serviço não pronto aparece quando existe ao menos um serviço não pronto e some quando todos estão prontos ou cancelados; a saída continua permitida.
- [ ] O detalhe do serviço troca o status e a mudança aparece no ticket e na fila.
- [ ] Remover um serviço na fila exige motivo e atualiza subtotal e total; serviços em andamento ou prontos não oferecem remover.
- [ ] O comprovante de entrada de um veículo com serviços mostra estadia, serviços, total e o cartão "Seus serviços" com progresso (sujeito à dependência do back).
- [ ] O comprovante de um veículo sem serviços não muda.
- [ ] As telas são utilizáveis em celular e desktop.

## Métricas de sucesso
- Operadores adicionam serviços ao ticket sem sair da tela do veículo.
- Redução de dúvidas do cliente sobre o valor e o andamento dos serviços na saída.
- Nenhum registro de saída com divergência entre o valor mostrado no ticket e o cobrado.
