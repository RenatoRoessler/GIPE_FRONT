# Relatório de QA: Nova identidade Murel e navegação inferior única

**Data:** 2026-10-25  
**Escopo:** `prd.md` (RF-01 a RF-09), `design.md` e `techspec.md`  
**Ambiente:** build de produção (`next build` + `next start`), Chromium headless 131 (Playwright 1.49), Windows 11. A API real nunca foi chamada: o navegador interceptou `api.gipepark.com.br` e devolveu dados de teste para o comprovante e o recibo, e 404 para o resto. A sessão foi simulada com um cookie de teste (perfil Administrador).

## Resultado

Os requisitos foram verificados no navegador **em Chromium**. A verificação em aparelhos reais (iOS Safari, Chrome no Android, instalação do app, modo offline com o service worker ativo, impressão, leitor de tela) **não foi feita**. Durante a QA foram encontrados e corrigidos 5 defeitos (seção "Defeitos encontrados").

| Requisito | Resultado | Evidência |
|---|---|---|
| RF-01 Nome Murel | Passou | Títulos "Entrar — Murel", "Comprovante de entrada — Murel", "Recibo de saída — Murel", "Sem conexão — Murel"; `marca.test.ts` trava o nome antigo em `src` e `public` |
| RF-02 Logotipo | Passou | Símbolo e palavra em login, cabeçalho, comprovante e recibo, nos dois temas; só o símbolo no cabeçalho abaixo de 480px; animação do carro some com movimento reduzido (`animation-name: none`) |
| RF-03 Paleta e tipografia | Passou (contraste automático) | Telas conferidas por captura nos dois temas; axe `color-contrast` sem violações em 12 telas |
| RF-04 App instalável | Parcial | Manifest, ícones (conferidos abrindo as imagens) e `theme_color` corretos e testados; instalação e página offline em uso real **não conferidas** |
| RF-05 Documentos e telas públicas | Passou | Comprovante e recibo com marca; PDFs de entrada e saída renderizados com pdf.js e conferidos: marca em vetor no topo, vidros do carro vazados, sem texto cortado |
| RF-06 Sem menu no topo | Passou | `nav[aria-label="Menu principal"]` com 0 ocorrências em todas as larguras |
| RF-07 Barra em todas as larguras | Passou | Barra colada à base em 320, 375, 480, 768, 1024 e 1440 (claro e escuro); conteúdo da barra limitado a 1120px; sem rolagem horizontal; rodapé termina exatamente no topo da barra |
| RF-08 Itens por largura | Passou | Ver tabela abaixo; ajuste ao girar o aparelho (375×812 para 812×375) sem recarregar |
| RF-09 Menu estendido | Passou nas larguras de celular | Painel só com os excedentes, tela atual marcada, fecha com Esc e o foco volta ao "Mais"; painel aberto e janela cresce até tudo caber: painel fecha, "Mais" some e o foco vai para "Início" |

### Itens visíveis por largura (Administrador, 11 itens)

| Largura | Itens na barra | Itens no painel | Menor item (px) |
|---|---|---|---|
| 320 | Início, Entrada, Saída, Mais | 8 | 80 × 64 |
| 375 | Início, Entrada, Saída, Preços, Mais | 7 | 75 × 64 |
| 480 | Início, Entrada, Saída, Preços, Usuários, Mensalistas, Mais | 5 | 69 × 64 |
| 768 | os 11, sem Mais | 0 | 70 × 64 |
| 1024 | os 11, sem Mais | 0 | 93 × 64 |
| 1440 | os 11, sem Mais | 0 | 102 × 64 |

Todos os alvos de toque têm pelo menos 44 px (o menor tem 64 px de altura e 69 px de largura). Nenhum rótulo ficou cortado.

## Acessibilidade

- **Contraste (axe-core, regra `color-contrast`):** 0 violações em login (claro e escuro), área logada (claro e escuro, 375 e 1440), comprovante e recibo (claro e escuro, 390) e página offline (claro e escuro). O axe não avalia o que não consegue calcular (por exemplo, texto sobre imagem), mas não há imagem de fundo nessas telas.
- **Outras regras testadas (axe):** nome de botões e links, rótulos de campos, `aria-*`, elementos interativos aninhados e landmarks. Sem violações depois da correção do landmark do login.
- **Teclado:** a primeira aba da barra recebe contorno de 2 px em asfalto (tema claro) e o painel fecha com Esc. Cálculo de contraste do anel de foco: 15,85:1 sobre o fundo claro, 11,06:1 em amarelo sobre o escuro.
- **Movimento reduzido:** a animação do carro no logotipo é desligada.
- **Não testado:** leitor de tela real (NVDA, VoiceOver, TalkBack), zoom de 200% e fonte do sistema ampliada.

## Defeitos encontrados e corrigidos na QA

1. **Rodapé coberto em 1 px pela barra.** A borda superior da barra somava 1 px à altura e o espaço reservado no fim da página era de 64 px. Correção: o filete virou sombra (`box-shadow`), sem ocupar altura. Depois: rodapé e barra se encontram exatamente (636/636, 748/748, 960/960 etc.).
2. **"Mensalistas" cortado com reticências em 480 px** (item com 69 px, rótulo com cerca de 66 px mais o recuo de 2 px de cada lado). Correção: sem recuo lateral nos itens e largura mínima por item de 68 px (antes 64). Efeito: em 320 px a barra passa de 4 itens mais "Mais" para 3 itens mais "Mais" (Preços vai para o painel).
3. **Ícones do painel "Mais" cinzas, em vez de amarelos**, por um seletor `svg:last-child` que também pegava o ícone dentro do quadro. Correção: seletor só dos filhos diretos.
4. **`/icon.svg` redirecionava para o login** sem sessão (o matcher do `proxy.ts` não o excluía), o que quebraria o favicon na tela de entrada. Correção no matcher, que também deixou de citar `assets` (pasta apagada) e ganhou testes.
5. **Telas de acesso sem landmark principal** (axe `region`, 7 ocorrências no login). Correção: `PageBackground` passou a ser `<main>`. Defeito anterior à troca de marca, corrigido por ser de uma linha.

## Observações e pontos para decisão

- **Mais de um amarelo na área logada.** No login o botão "Entrar" é o único amarelo da tela, mas na tela inicial da área logada aparecem juntos: os dois discos "E" e "S" dos atalhos, o avatar do usuário e a faixa do item ativo da barra. O guia pede o amarelo "uma vez por tela". O que o design.md chama de erro é mais de um **botão primário**, e não há botão primário duplicado, mas a regra do guia vale por tela. Não alterei: depende de decidir se o avatar e os discos mantêm o amarelo. Sugestão: avatar em `surface` com contorno.
- **Painel em telas `md` ou maiores nunca aparece para o Administrador:** com 68 px por item, os 11 itens cabem a partir de 748 px, antes do ponto `md` (768 px). O estilo do painel centralizado (até 480 px, acima da barra) existe e foi escrito, mas só será visto se o menu ganhar itens. Não foi verificado em tela, só pelo código.
- **Valor do recibo** (`R$ 15.100,00`) quebra em duas linhas em 390 px porque a fonte mono é mais larga que a condensada de antes. Fica legível; pode ser reduzido se incomodar.
- **Instabilidade dos testes:** `MensalistaModal.veiculos.test.tsx` estoura 5 s de tempo na suíte completa (carga) e passa isolado, com e sem as mudanças desta feature. Há ainda 6 erros não tratados de rede em testes de formulários de acesso, presentes antes.
- **Histórico de atualizações:** não foi atualizado; no projeto ele é gerado pelos commits (`generate:changelog`), então entra quando a feature for commitada.
- O domínio `gipe.com.br` continua nos exemplos de testes (endereço do backend); trocar quando houver novo domínio.

## Comandos finais

| Comando | Resultado |
|---|---|
| `npx tsc --noEmit` | sem erros |
| `npm run lint` | 0 erros e 94 avisos (os mesmos de antes da feature) |
| `npm run build` | compila |
| `npm test` | 2346 passam; 1 falha por tempo esgotado em `MensalistaModal.veiculos.test.tsx` (passa isolado) |

## Capturas

Geradas em `scratchpad/qa/shots` (fora do repositório): login, área logada em 6 larguras e 2 temas, painel "Mais", foco da barra, comprovante, recibo, página offline e o topo dos dois PDFs.
