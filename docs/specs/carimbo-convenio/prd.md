# PRD: Carimbo de Convênio

## Problema
O cliente de um estacionamento que tem convênio com uma empresa chega a ela com o ticket de entrada. Hoje a empresa conveniada não tem como registrar esse atendimento no sistema, então o veículo continua sendo cobrado pela tabela comum na saída, sem o desconto do convênio.

## Objetivo
A empresa conveniada logada consegue "carimbar" o ticket do cliente lendo o QR Code do comprovante de entrada. Ao carimbar, o veículo passa a ser cobrado pela tabela de convênio e a conveniada vê a confirmação do que foi carimbado.

## Usuário-alvo
Usuários de empresas conveniadas (Administrador Conveniada, Gerente Conveniada e Usuário Conveniada) no balcão da própria conveniada, com o cliente à frente apresentando o ticket. O uso é principalmente em celular, lendo o QR Code com a câmera. O acesso é desses perfis por padrão, podendo ser alterado pela permissão por módulo.

## Requisitos funcionais
- RF1: A conveniada logada tem uma tela de carimbo, acessível pelo menu conforme perfil/permissão por módulo.
- RF2: A tela permite ler o QR Code do comprovante de entrada do cliente. O QR identifica o veículo por um código (token) de 8 caracteres.
- RF3: Lido o QR Code, o carimbo é registrado de imediato, sem etapa extra de confirmação [A DEFINIR: pedir confirmação antes de carimbar, já que não há desfazer].
- RF4: O sistema procura o veículo apenas entre os que estão no pátio, em qualquer estacionamento.
- RF5: O sistema escolhe a tabela de convênio aplicável: entre as do estacionamento do veículo com a conveniada logada, vigentes, pela categoria do veículo e pelas regras de dia e horário no momento do carimbo, com o mesmo critério usado na entrada.
- RF6: Após o carimbo, a saída do veículo passa a ser calculada pela tabela de convênio. Quem carimbou e quando ficam registrados.
- RF7: Ao carimbar com sucesso, a tela mostra o resultado: estacionamento, placa, modelo, cor, categoria, data e hora da entrada, nome da tabela de convênio aplicada e data e hora do carimbo.
- RF8: Cada veículo recebe um único carimbo. Tentar carimbar de novo é recusado com mensagem clara.
- RF9: Veículo de mensalista não é carimbado. A tentativa é recusada com mensagem clara.
- RF10: Falhas de negócio e de leitura têm mensagem própria e compreensível, e a conveniada pode tentar outro ticket sem sair da tela: QR inválido, veículo não encontrado no pátio, já carimbado, mensalista, sem tabela de convênio aplicável, sem permissão e falha de conexão [A DEFINIR: quais dessas o back diferencia por mensagem ou código].
- RF11: Depois de um carimbo, a conveniada pode carimbar o próximo ticket com poucos toques.

## Fora de escopo
- Desfazer ou corrigir um carimbo.
- Digitar o código do ticket à mão quando o QR Code não puder ser lido [A DEFINIR: se será necessário como alternativa].
- Histórico ou relatório dos carimbos feitos pela conveniada.
- Cadastro e gestão de empresas conveniadas e das tabelas de convênio (já existem em outras telas).
- Cálculo e cobrança na saída do veículo (feitos pelo fluxo de saída existente).
- Uso do carimbo pelo operador do estacionamento.

## Critérios de aceite
- [ ] Um usuário de conveniada com perfil permitido vê o item de carimbo no menu e abre a tela; um perfil sem permissão não vê o item e é impedido de acessar pelo endereço.
- [ ] Ler o QR Code de um veículo no pátio, com tabela de convênio aplicável, carimba o veículo e mostra estacionamento, placa, modelo, cor, categoria, entrada, tabela aplicada e hora do carimbo.
- [ ] Ler o QR Code de um veículo já carimbado mostra mensagem de que ele já foi carimbado e não altera o carimbo existente.
- [ ] Ler o QR Code de um veículo de mensalista mostra mensagem de que mensalista não é carimbado.
- [ ] Ler um QR Code inválido, de veículo que não está no pátio ou sem tabela de convênio aplicável mostra mensagem específica e permite tentar de novo.
- [ ] Durante o envio, a tela evita carimbo duplicado do mesmo ticket (leituras repetidas do mesmo QR não geram novas chamadas).
- [ ] Após o carimbo, a saída desse veículo é calculada pela tabela de convênio.
- [ ] A tela funciona em celular, pede permissão de câmera quando necessário e informa o que fazer se a câmera for negada ou não existir.
- [ ] Atende acessibilidade WCAG 2.2 AA: resultado e erros anunciados a leitores de tela e operação por teclado.

## Métricas de sucesso (se aplicável)
Sem métricas definidas nesta entrega [A DEFINIR]. O sucesso é a conveniada carimbar um ticket de ponta a ponta, em poucos segundos, com resultado e erros claros.

## Pendências para o design e o Tech Spec
- Confirmar o conteúdo do QR Code do comprovante: apenas o token de 8 caracteres ou o link do recibo, de onde o token é extraído.
- Confirmar com o back como distinguir os erros de RF10 (código estável ou só texto).
- Definir se o carimbo pede confirmação antes de gravar (RF3), por não haver desfazer.
- O `docs/specs/input.md` contém um token de autenticação real no exemplo de chamada; ele não foi copiado para este PRD e convém removê-lo do arquivo.
