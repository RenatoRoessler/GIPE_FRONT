# figma-connect

Conecta a um design do Figma e gera o componente React correspondente seguindo os padrões deste projeto.

## Uso

```
/figma-connect <url-do-figma> [nome-do-componente]
```

**Exemplos:**
- `/figma-connect https://www.figma.com/design/abc123/MyFile?node-id=1-2 BenefitsCard`
- `/figma-connect https://www.figma.com/design/abc123/MyFile?node-id=1-2`

## O que esta skill faz

Dado uma URL do Figma (com `node-id`), esta skill:

1. Extrai `fileKey` e `nodeId` da URL
2. Busca o design via MCP do Figma (`get_design_context`)
3. Captura screenshot do componente (`get_screenshot`)
4. Gera o código do componente seguindo os padrões deste projeto
5. Cria os arquivos necessários: `index.tsx`, `styled.tsx` e `<Nome>.spec.tsx`

## Padrões deste projeto

Ao gerar o componente, siga obrigatoriamente:

### Estrutura de arquivos
```
src/components/features/<NomeComponente>/
├── index.tsx          # Componente principal
├── styled.tsx         # Estilos com styled-components
└── <Nome>.spec.tsx    # Testes com React Testing Library
```

Para componentes compartilhados:
```
src/components/Shared/<NomeComponente>/
├── index.tsx
├── styled.tsx (se necessário)
└── <Nome>.spec.tsx
```

### Convenções de código

- **TypeScript** estrito — sempre tipar props com interface
- **Styled-components** — nunca inline styles, sempre `styled.tsx` separado
- **Exports nomeados** — não usar `export default` (exceto se o projeto já usa em algum componente)
- **Alias de imports** — usar `@/` ao invés de caminhos relativos longos
- **Hooks** — extrair lógica em `use<Nome>.hook.tsx` se necessário
- **Sem comentários** — código autoexplicativo pelos nomes

### Template de componente
```tsx
// index.tsx
import { Container, Title } from './styled';

interface <Nome>Props {
  // props tipadas aqui
}

export const <Nome> = ({ ... }: <Nome>Props) => {
  return (
    <Container>
      ...
    </Container>
  );
};
```

```tsx
// styled.tsx
import styled from 'styled-components';

export const Container = styled.div`
  // estilos aqui
`;
```

```tsx
// <Nome>.spec.tsx
import { render, screen } from '@testing-library/react';
import { <Nome> } from '.';

describe('<Nome>', () => {
  it('should render correctly', () => {
    render(<Nome ... />);
    expect(screen.getByText('...')).toBeInTheDocument();
  });
});
```

## Instruções de execução

Quando o usuário invocar `/figma-connect <url> [nome]`:

1. **Parse a URL do Figma:**
   - Extraia o `fileKey` do path: `figma.com/design/:fileKey/...`
   - Extraia o `nodeId` do query param `node-id`, convertendo `-` para `:` (ex: `1-2` → `1:2`)

2. **Busque o design:**
   ```
   Chame: get_design_context(nodeId, fileKey)
   Chame: get_screenshot(nodeId, fileKey)  [para referência visual]
   ```

3. **Determine o nome do componente:**
   - Use o nome fornecido pelo usuário, ou
   - Derive do nome do nó no Figma (PascalCase)

4. **Determine onde criar:**
   - Se for feature específica → `src/components/features/<Nome>/`
   - Se for reutilizável → `src/components/Shared/<Nome>/`
   - Pergunte ao usuário se não for óbvio

5. **Gere os arquivos** seguindo os padrões acima, adaptando o código do Figma para:
   - Usar tokens de cor do projeto (verificar `styled.tsx` existentes para referência)
   - Usar componentes existentes quando aplicável (verificar `src/components/Shared/`)
   - Manter fidelidade visual ao design

6. **Reporte o que foi criado** com os caminhos dos arquivos gerados
