# Documentação Arquitetural — View Level Flow Client

## Índice

1. [Visão Geral](#1-visão-geral)
2. [Stack e Dependências](#2-stack-e-dependências)
3. [Estrutura de Diretórios](#3-estrutura-de-diretórios)
4. [Arquitetura de Alto Nível](#4-arquitetura-de-alto-nível)
5. [Camadas da Aplicação](#5-camadas-da-aplicação)
   - [5.1 Entrypoint e Roteamento](#51-entrypoint-e-roteamento)
   - [5.2 Páginas (Pages)](#52-páginas-pages)
   - [5.3 Componentes de Node](#53-componentes-de-node)
   - [5.4 Sidebar](#54-sidebar)
   - [5.5 Hooks](#55-hooks)
   - [5.6 Contexto e Provider de Drag-and-Drop](#56-contexto-e-provider-de-drag-and-drop)
   - [5.7 Camada de API](#57-camada-de-api)
   - [5.8 Feature: Flow Utils](#58-feature-flow-utils)
6. [Fluxo de Dados e Interações Principais](#6-fluxo-de-dados-e-interações-principais)
   - [6.1 Criar um novo fluxo](#61-criar-um-novo-fluxo)
   - [6.2 Visualizar fluxos salvos](#62-visualizar-fluxos-salvos)
   - [6.3 Editar um fluxo existente](#63-editar-um-fluxo-existente)
7. [Tipos de Node](#7-tipos-de-node)
8. [Regras de Negócio e Validação](#8-regras-de-negócio-e-validação)
9. [Construção do Payload](#9-construção-do-payload)
10. [Normalização de Edges](#10-normalização-de-edges)
11. [Gerenciamento de Estado](#11-gerenciamento-de-estado)
12. [Estilização](#12-estilização)
13. [Contrato com a API Backend](#13-contrato-com-a-api-backend)
14. [Pontos Críticos e Armadilhas](#14-pontos-críticos-e-armadilhas)
15. [Como Estender o Projeto](#15-como-estender-o-projeto)

---

## 1. Visão Geral

Esta é uma SPA (Single Page Application) construída em React que atua como **editor visual de regras de decisão**. O usuário pode arrastar operadores para um canvas, conectar nós formando um grafo acíclico dirigido (DAG) e enviar esse grafo para uma engine de regras via API REST.

O frontend não possui roteamento baseado em URL (sem React Router). A navegação é feita por **controle de estado local** no componente `App`, que renderiza condicionalmente uma das três "páginas" disponíveis.

---

## 2. Stack e Dependências

| Dependência | Versão | Função |
|---|---|---|
| `react` | ^19.2.0 | UI declarativa e gerenciamento de estado via hooks |
| `react-dom` | ^19.2.0 | Renderização no DOM |
| `@xyflow/react` | ^12.10.0 | Motor de grafos interativos (canvas, nodes, edges, handles) |
| `axios` | ^1.13.5 | Cliente HTTP para comunicação com o backend |
| `styled-components` | ^6.3.11 | Estilização CSS-in-JS para os componentes de node |
| `vite` | ^7.3.1 | Bundler e dev server (ESM nativo) |
| `eslint` | ^9.39.1 | Lint com config flat (eslint.config.js) |

> **Atenção:** O projeto usa React 19. A API de `useCallback`, `useEffect` e `useState` é a mesma das versões anteriores, mas novidades como Actions e o novo compilador não são utilizadas aqui.

---

## 3. Estrutura de Diretórios

```
src/
├── App.jsx                          # Raiz da aplicação: navegação entre páginas
├── main.jsx                         # Entrypoint: monta o React no DOM
├── index.css                        # Estilos globais + layout das páginas
├── xy-theme.css                     # Customização visual do @xyflow/react
│
├── api/
│   └── index.js                     # Instância Axios + funções de chamada HTTP
│
├── components/
│   ├── ActionNode/
│   │   └── index.jsx                # Node visual do tipo ACTION
│   ├── Conditions/
│   │   ├── shared.js                # Styled-components base (NodeContainer, NodeTitle, NodeInput)
│   │   ├── Condition/
│   │   │   └── index.jsx            # Node visual do tipo CONDITION
│   │   └── ConditionWithArgs/
│   │       ├── index.jsx            # Node visual do tipo CONDITION_WITH_ARGS (com input)
│   │       └── styles.js            # Extensão dos estilos base para este node
│   └── Sidebar/
│       └── index.jsx                # Painel lateral: lista operadores e exibe feedback
│
├── contexts/
│   └── DragAndDropContext.jsx       # Contexto React para compartilhar o operador selecionado
│
├── features/
│   └── flow/
│       └── utils.js                 # CORE: toda a lógica de negócio do fluxo
│
├── hooks/
│   ├── useDragAndDrop.jsx           # Accessor do DragAndDropContext
│   ├── useFlowEditor.jsx            # Orquestra estado de nodes/edges + validações
│   └── useOperators.jsx             # Busca os operadores da API na montagem
│
├── pages/
│   ├── EditFlow.jsx                 # Página de edição de fluxo existente
│   └── SavedFlows.jsx               # Página de listagem + visualização read-only
│
└── providers/
    └── DragAndDropProvider.jsx      # Provider do DragAndDropContext
```

---

## 4. Arquitetura de Alto Nível

```
┌─────────────────────────────────────────────────────────────────┐
│                          App.jsx                                │
│   (controlador de navegação via currentPage state)              │
│                                                                  │
│   ┌──────────────────┐  ┌─────────────────┐  ┌──────────────┐  │
│   │  DragAndDropFlow │  │   SavedFlows    │  │   EditFlow   │  │
│   │  (builder)       │  │   (read-only)   │  │  (edit mode) │  │
│   └────────┬─────────┘  └────────┬────────┘  └──────┬───────┘  │
└────────────┼────────────────────┼──────────────────┼───────────┘
             │                    │                   │
    ┌────────▼──────────────────────────────────────▼──────────┐
    │                        Hooks                              │
    │  useFlowEditor  │  useOperators  │  useDragAndDrop        │
    └────────┬────────────────────────────────────┬────────────┘
             │                                    │
    ┌────────▼────────────────────┐   ┌───────────▼────────────┐
    │    features/flow/utils.js   │   │   DragAndDropContext    │
    │    (lógica de negócio core) │   │   (estado global D&D)  │
    └────────┬────────────────────┘   └────────────────────────┘
             │
    ┌────────▼────────────────────┐
    │        api/index.js         │
    │   (Axios → localhost:8080)  │
    └─────────────────────────────┘
```

---

## 5. Camadas da Aplicação

### 5.1 Entrypoint e Roteamento

**`src/main.jsx`** — Monta a árvore React no elemento `#root` com `StrictMode`.

**`src/App.jsx`** — Componente raiz que implementa a navegação da aplicação. Não usa React Router. O estado `currentPage` controla qual "página" é renderizada:

| `currentPage` | Componente renderizado |
|---|---|
| `'builder'` | `DragAndDropFlow` (inline em App.jsx) |
| `'saved'` | `<SavedFlows>` |
| `'edit'` | `<EditFlow>` |

O `App` também gerencia `selectedFlowId`, que é passado via props para as páginas de visualização e edição.

**Wrappers obrigatórios:**

```jsx
// App.jsx — estrutura simplificada
<DragAndDropProvider>
  <ReactFlowProvider>   ← obrigatório para useReactFlow() funcionar fora do <ReactFlow>
    <DragAndDropFlow />
  </ReactFlowProvider>
</DragAndDropProvider>
```

> **Ponto crítico:** O hook `useReactFlow()` só funciona dentro de um `<ReactFlowProvider>`. O provider é renderizado em `App.jsx` envolto ao redor do componente builder. As páginas `SavedFlows` e `EditFlow` renderizam seus próprios `<ReactFlow>` sem precisar do provider externo porque não chamam `useReactFlow()` diretamente — quem chama é o `useFlowEditor`, que é usado apenas nessas páginas quando montado internamente.

---

### 5.2 Páginas (Pages)

#### `SavedFlows.jsx`

- Busca todos os fluxos via `GET /rules` na montagem do componente (`useEffect` + `loadFlows`).
- Usa `normalizeFlowList` para garantir que cada fluxo tenha um `id` estável (string).
- Exibe lista lateral clicável. O fluxo selecionado é renderizado via `<ReactFlow>` em modo **read-only** (`nodesDraggable={false}`, `nodesConnectable={false}`).
- O primeiro fluxo da lista é selecionado automaticamente.
- Passa `{ isReadOnly: true }` para `buildFlowNodesFromApi`, o que desabilita o input do `ConditionWithArgsNode`.
- Botão "Editar" chama `onEditFlow(flow.id)` → App transiciona para `currentPage = 'edit'`.

#### `EditFlow.jsx`

- Recebe `flowId` via props. Busca novamente a lista completa via `GET /rules` e localiza o fluxo pelo id.

  > **Atenção:** Não há endpoint `GET /rules/:id`. A edição carrega **todos** os fluxos e filtra localmente. Isso pode ser um gargalo se a lista crescer muito.

- Passa o fluxo encontrado como `persistedFlow` para `useFlowEditor`, que hidrata o canvas.
- Após salvar com sucesso, aguarda 1200ms e chama `onFlowUpdated()`, retornando à tela `SavedFlows`.
- Reutiliza o componente `<Sidebar>` com labels customizados (`actionLabel="Salvar alterações"`).

---

### 5.3 Componentes de Node

Todos os componentes de node recebem a prop `data` injetada pelo `@xyflow/react`.

#### `ActionNode`

```
┌─────────────────────┐
│      [label]        │
│  ●  (Handle Top)    │  ← target-only, sem handles de saída
└─────────────────────┘
```

- Apenas **Handle de entrada** (`type="target"`, topo).
- Não possui handles de saída (nodes de ação são folhas do grafo).
- **Não renderiza** handle de entrada se `isStartNode = true`... na verdade, `ActionNode` nunca é startNode pelas regras de negócio, mas o componente não bloqueia isso na UI.

#### `ConditionNode`

```
         ┌──────────────────┐
[false]● │     [label]      │ ●[true]
         │  ● (Handle Top)  │
         └──────────────────┘
```

- Handle `target` no topo (entrada) — **oculto se `isStartNode = true`**.
- Handle `source` id=`"true"` na direita (verde).
- Handle `source` id=`"false"` na esquerda (vermelho).

#### `ConditionWithArgsNode`

- Mesmo layout de handles que `ConditionNode`.
- Adiciona um `<Input>` de texto que chama `data.onChangeArguments({ value })`.
- O input é desabilitado quando `data.isReadOnly = true` (modo visualização).
- A callback `onChangeArguments` é provida pelo `useFlowEditor` e atualiza o nó via `setNodes`.

#### Shared Styles (`components/Conditions/shared.js`)

Base reutilizada por `ActionNode` e `ConditionNode`:

```js
NodeContainer  // div flex-column, borda, border-radius
NodeTitle      // span bold, cor escura
NodeInput      // input com padding, borda e border-radius
```

`ConditionWithArgs/styles.js` estende esses base-components com `styled(Base)`.

---

### 5.4 Sidebar

Componente puro de UI com as seguintes responsabilidades:

1. Listar operadores (via `useOperators`) como itens arrastáveis.
2. Disparar `onDragStart` que salva o operador no contexto via `setSelectedOperator`.
3. Exibir botão de ação (criar ou atualizar) com estado de loading.
4. Exibir feedback inline: erro de payload, preview JSON, e status de sucesso.

A Sidebar aceita `actionLabel` e `actionSubmittingLabel` como props, sendo reutilizada nas telas de criação e edição com textos diferentes.

**Distinção visual por tipo de node (CSS class):**

| Tipo | Classe CSS | Cor da borda |
|---|---|---|
| `ACTION` | `dndnode input` | azul (`#0041d0`) |
| `CONDITION` | `dndnode output` | rosa/vermelho (`#ff0072`) |
| outros | `dndnode` | padrão escuro |

---

### 5.5 Hooks

#### `useOperators`

Busca `GET /rules/operators` na montagem e retorna o array de operadores. Erros são silenciados (apenas `console.error`). Não há retry nem loading state exposto.

#### `useDragAndDrop`

Wrapper simples que lê o `DragAndDropContext`. Retorna `{ selectedOperator, setSelectedOperator }`.

#### `useFlowEditor`

O hook mais complexo do sistema. Orquestra:

| Responsabilidade | Mecanismo |
|---|---|
| Estado de nodes | `useNodesState` do @xyflow |
| Estado de edges | `useEdgesState` do @xyflow |
| Contador de IDs | `useRef(nextNodeId)` — incrementado a cada drop |
| Carregar fluxo persistido | `loadPersistedFlow` chamada via `useEffect` quando `persistedFlow` muda |
| Sync `isStartNode` | `useEffect` que reage a mudanças em `edges` e recalcula qual node não tem entradas |
| Drop de operador | `handleDrop` — cria novo node a partir do `selectedOperator` do contexto |
| Conexão | `handleConnect` — valida e adiciona edge |
| Atualização de argumentos | `updateNodeData` — merge patch em `node.data` |

**Detalhes do contador de IDs (`nextNodeId`):**

- IDs de nodes seguem o padrão `node1`, `node2`, etc.
- Ao carregar um fluxo persistido, `getNextNodeNumber` analisa todos os ids existentes e define `nextNodeId.current` como `max + 1`, evitando colisões ao adicionar nodes em um fluxo carregado.
- Ao fazer drop do primeiro node em um canvas vazio, o contador é resetado para `1`.

**Sync automático de `isStartNode`:**

Toda vez que `edges` muda, um `useEffect` recalcula quais nodes não têm arestas de entrada (são "raízes" do grafo). O node raiz recebe `isStartNode: true` nos dados, o que controla a visibilidade do Handle de entrada nos nodes de condição.

---

### 5.6 Contexto e Provider de Drag-and-Drop

**Problema resolvido:** O evento `onDrop` do canvas (`handleDrop` em `useFlowEditor`) não tem acesso direto ao operador que foi arrastado. O HTML Drag and Drop API só permite transferir strings via `dataTransfer`.

**Solução adotada:**

1. `DragAndDropContext` armazena o objeto operador completo em estado React.
2. No `onDragStart` da Sidebar, `setSelectedOperator(operator)` salva o objeto no contexto.
3. No `handleDrop` do canvas, `selectedOperator` é lido do contexto e o node é criado com todos os dados do operador.

> `dataTransfer.setData('text/plain', String(operator.id))` é enviado mas **não é lido** no drop — serve apenas para satisfazer a API do navegador (alguns browsers exigem que `setData` seja chamado para que o drag funcione).

---

### 5.7 Camada de API

**`src/api/index.js`** — Instância única do Axios com `baseURL: 'http://localhost:8080'`.

| Função exportada | Método | Endpoint |
|---|---|---|
| `createRule(payload)` | POST | `/engine/rule` |
| `updateRule(id, payload)` | PUT | `/engine/rule/:id` |
| `getRules()` | GET | `/rules` |

Operadores são buscados diretamente pela instância `api` dentro de `useOperators` (sem wrapper):

```js
api.get('/rules/operators')
```

**Não há:**
- Interceptors de autenticação.
- Refresh de token.
- Tratamento centralizado de erros (cada consumidor chama `getApiErrorMessage` manualmente).
- Retry automático.
- Cache de requisições.

---

### 5.8 Feature: Flow Utils

Este é o **coração da lógica de negócio**. Localizado em `src/features/flow/utils.js`.

#### Constantes de tipo

```js
CONDITION          // 'CONDITION'
CONDITION_WITH_ARGS // 'CONDITION_WITH_ARGS'
ACTION             // 'ACTION'
```

#### Mapeamento de tipos (API ↔ React Flow)

| `apiType` (backend) | `nodeType` (React Flow) |
|---|---|
| `CONDITION` | `conditionNode` |
| `CONDITION_WITH_ARGS` | `conditionNodeWithArgs` |
| `ACTION` | `actionNode` |

#### Funções principais

| Função | Descrição |
|---|---|
| `getNodeType(operatorType)` | Converte tipo da API para chave do mapa `nodeTypes` do React Flow |
| `getApiType(operatorType)` | Retorna o tipo API (atualmente identidade — abstração para extensão futura) |
| `canBeStartNode(apiType)` | `true` apenas para `CONDITION` e `CONDITION_WITH_ARGS` |
| `buildNodeData(operator, onChangeArguments)` | Monta o objeto `data` de um novo node a partir de um operador da API |
| `buildFlowNodesFromApi(flow, createOnChangeArguments, extra)` | Hidrata nodes a partir da resposta da API (usado ao carregar fluxo existente) |
| `buildFlowEdgesFromBackend(flow)` | Hidrata edges da API, desnormalizando `sourceHandle` |
| `validateConnection(connection, nodes, edges)` | Valida se uma conexão pode ser estabelecida (ver seção 8) |
| `buildFlowPayload(nodes, edges)` | Monta o payload final para enviar à API |
| `normalizeEdgesForBackend(edges)` | Converte `sourceHandle` string → boolean antes de enviar |
| `denormalizeEdgesFromBackend(edges)` | Converte `sourceHandle` boolean → string ao receber da API |
| `getApiErrorMessage(error)` | Extrai mensagem de erro de respostas Axios com múltiplos formatos |
| `normalizeFlowList(data)` | Garante array e id estável para cada fluxo |
| `getFlowId(flow, fallbackIndex)` | Gera id string seguro para um fluxo (fallback `flow-N`) |

---

## 6. Fluxo de Dados e Interações Principais

### 6.1 Criar um novo fluxo

```
1. useOperators busca GET /rules/operators → popula Sidebar
2. Usuário arrasta operador da Sidebar:
   └─ onDragStart → setSelectedOperator(operator) no contexto
3. Usuário solta no canvas (onDrop):
   └─ handleDrop lê selectedOperator do contexto
   └─ valida se o primeiro node pode ser startNode
   └─ cria novo node com id sequencial e buildNodeData()
   └─ setNodes() adiciona ao estado
4. Usuário conecta nodes (onConnect):
   └─ validateConnection() verifica regras
   └─ addEdge() adiciona edge ao estado
   └─ useEffect sync recalcula isStartNode em todos os nodes
5. Usuário clica "Gerar payload e enviar":
   └─ buildFlowPayload() valida e serializa o grafo
   └─ createRule() POST /engine/rule
   └─ Sidebar exibe preview JSON e feedback de sucesso/erro
```

### 6.2 Visualizar fluxos salvos

```
1. SavedFlows monta → useEffect chama getRules() GET /rules
2. normalizeFlowList() garante ids estáveis
3. Primeiro fluxo é selecionado automaticamente
4. buildFlowNodesFromApi() e buildFlowEdgesFromBackend() constroem nodes/edges
5. ReactFlow renderiza em modo read-only (nodesDraggable=false, nodesConnectable=false)
6. Usuário clica em outro fluxo da lista → atualiza activeFlowId → useMemo reconstrói nodes/edges
```

### 6.3 Editar um fluxo existente

```
1. EditFlow recebe flowId via props de App.jsx
2. useEffect chama getRules() → filtra por flowId → setFlow(foundFlow)
3. useFlowEditor recebe persistedFlow=flow → loadPersistedFlow() hidrata canvas
4. requestAnimationFrame + fitView() centraliza o grafo após hidratação
5. Usuário modifica o grafo (adiciona/remove nodes, conecta, edita argumentos)
6. Usuário clica "Salvar alterações":
   └─ buildFlowPayload() serializa o grafo
   └─ updateRule(flowId, payload) PUT /engine/rule/:id
   └─ Aguarda 1200ms → onFlowUpdated() → volta para SavedFlows
```

---

## 7. Tipos de Node

### CONDITION

- **Entrada:** um Handle `target` (topo) — oculto se for startNode.
- **Saídas:** dois Handles `source` — `"true"` (direita, verde) e `"false"` (esquerda, vermelho).
- **Dados relevantes:** `operation` (string identificando a regra), `isStartNode` (boolean).
- **Restrições:** precisa de `onTrue` e `onFalse` para payload válido.

### CONDITION_WITH_ARGS

- Igual ao `CONDITION` em termos de handles.
- Adiciona campo `arguments: { value: string }` editável via input inline no node.
- Em modo read-only (`data.isReadOnly`), o input é desabilitado.
- A callback `onChangeArguments` é injetada pelo `useFlowEditor` e realiza merge parcial:
  ```js
  arguments: { ...currentArguments, ...patch }
  ```

### ACTION

- **Entrada:** um Handle `target` (topo) apenas.
- **Sem saídas:** é sempre uma folha do grafo.
- **Dados relevantes:** `set` (string identificando a ação a executar).
- **Restrições:** precisa de `set` para payload válido. Não pode ser startNode.

---

## 8. Regras de Negócio e Validação

### Validação de conexão (`validateConnection`)

Executada tanto em `isValidConnection` (visual, impede linha de conexão inválida) quanto em `handleConnect` (ao soltar a aresta):

| Regra | Motivo |
|---|---|
| `source !== target` | Sem self-loops |
| Source e target devem existir | Integridade dos dados |
| Somente nodes de condição podem originar conexões | `ACTION` é folha |
| `sourceHandle` deve ser `"true"` ou `"false"` | Handles tipados |
| Cada branch (`true`/`false`) aceita apenas um destino | Aresta única por saída |
| Cada node aceita apenas uma entrada | Sem merges de branches |

### Validação do primeiro drop

Ao dropar o primeiro node em canvas vazio, se o tipo não for `CONDITION` ou `CONDITION_WITH_ARGS`, a operação é bloqueada e um erro é exibido na Sidebar.

### Validação do payload (`validatePayloadNode`)

Antes de serializar, cada node é validado:

- Nodes de condição precisam ter `operation`, `onTrue` e `onFalse`.
- Nodes `ACTION` precisam ter `set`.

### Validação de startNode único

`findStartNodeId` exige exatamente um node sem entradas. Se houver zero ou mais de um, lança erro.

### Validação de startNode tipo

O startNode identificado deve ser do tipo `CONDITION` ou `CONDITION_WITH_ARGS` — `ACTION` não pode iniciar o fluxo.

---

## 9. Construção do Payload

`buildFlowPayload(nodes, edges)` retorna:

```ts
{
  startNode: string,           // id do único node raiz
  statusEnum: "PUBLISHED",     // fixo
  nodes: {
    [nodeId: string]: {
      type: "CONDITION" | "CONDITION_WITH_ARGS" | "ACTION",
      isStartNode: boolean,
      operation: string | null,    // só para nodes de condição
      arguments: object | null,    // só para CONDITION_WITH_ARGS
      onTrue: string | null,       // id do node destino do branch true
      onFalse: string | null,      // id do node destino do branch false
      set: string | null           // só para ACTION
    }
  },
  positions: {
    [nodeId: string]: { x: number, y: number }
  },
  edges: Edge[]                // edges com sourceHandle normalizado para boolean
}
```

`positions` é incluído no payload para que o backend possa persistir o layout visual e restaurá-lo exatamente ao editar.

---

## 10. Normalização de Edges

O `@xyflow/react` usa strings para `sourceHandle` (`"true"` / `"false"`). O backend persiste e retorna booleans (`true` / `false`). Há duas funções para converter:

```js
// Frontend → Backend (antes de POST/PUT)
normalizeEdgesForBackend(edges)
// edge.sourceHandle: "true" → true, "false" → false

// Backend → Frontend (ao carregar fluxo)
denormalizeEdgesFromBackend(edges)
// edge.sourceHandle: true → "true", false → "false"
```

> **Ponto crítico:** Se essa conversão for esquecida em qualquer ponto do ciclo, as conexões serão hidratadas com o handle errado e o grafo será renderizado incorretamente (edges sem associação ao handle correto).

---

## 11. Gerenciamento de Estado

A aplicação **não usa Redux, Zustand, Jotai nem qualquer biblioteca de estado global**. Todo estado é gerenciado com hooks nativos do React:

| Estado | Localização | Mecanismo |
|---|---|---|
| Página atual + fluxo selecionado | `App.jsx` | `useState` |
| Nodes e edges do canvas | `useFlowEditor` | `useNodesState` / `useEdgesState` (wrappers do @xyflow) |
| Operador selecionado no drag | `DragAndDropProvider` | `useState` + Context API |
| Lista de operadores | `useOperators` | `useState` + `useEffect` |
| Lista de fluxos salvos | `SavedFlows` | `useState` + `useEffect` |
| Fluxo sendo editado | `EditFlow` | `useState` + `useEffect` |
| Preview/erro/status de submit | `App.jsx` (builder) e `EditFlow` | `useState` |

---

## 12. Estilização

**Abordagem mista:**

- **`index.css`** — Estilos globais, layout das páginas, classes utilitárias (`.dndflow`, `.dndnode`, `.reactflow-wrapper`, `.saved-flows-page`, etc.).
- **`xy-theme.css`** — Sobrescreve variáveis CSS do `@xyflow/react` para personalizar aparência dos nodes e edges.
- **`styled-components`** — Usado **exclusivamente nos componentes de node** (`NodeContainer`, `NodeTitle`, `NodeInput` e extensões).

**Breakpoint responsivo:** `@media (min-width: 768px)` em `index.css` altera o layout do `.dndflow` de `flex-direction: column` para `row`.

---

## 13. Contrato com a API Backend

**Base URL:** `http://localhost:8080` (hardcoded em `src/api/index.js`).

Para alterar o endpoint, basta modificar `baseURL` na instância Axios.

### Formato esperado de `GET /rules/operators`

```ts
Array<{
  id: string | number,
  name: string,
  type: "CONDITION" | "CONDITION_WITH_ARGS" | "ACTION",
  operation?: string,    // para CONDITION
  set?: string,          // para ACTION
  arguments?: object     // para CONDITION_WITH_ARGS
}>
```

### Formato esperado de `GET /rules`

```ts
Array<Flow> | Flow   // normalizeFlowList aceita os dois formatos
```

Onde `Flow` segue a estrutura do payload descrito na seção 9, com adição de campos como `id`, `title`, `description`, `createdAt`.

### Extração de mensagem de erro (`getApiErrorMessage`)

A função tenta extrair a mensagem de erro em ordem de prioridade:

1. `error.response.data.message`
2. `error.response.data.error`
3. `error.response.data` (se for string)
4. `error.message`

---

## 14. Pontos Críticos e Armadilhas

### 1. `ReactFlowProvider` obrigatório para `useReactFlow()`

O hook `useReactFlow()` (usado em `useFlowEditor` para `screenToFlowPosition` e `fitView`) **só funciona dentro de um `ReactFlowProvider`**. O builder (`DragAndDropFlow`) é envolvido pelo provider em `App.jsx`. As páginas `SavedFlows` e `EditFlow` renderizam seus próprios `<ReactFlow>` que atuam como providers internos — `useReactFlow()` dentro desses componentes funciona porque o @xyflow injeta o provider automaticamente dentro do `<ReactFlow>`.

Se um novo hook que use `useReactFlow()` for adicionado a uma página que não esteja dentro de um `ReactFlow` renderizado, ocorrerá erro em runtime.

### 2. Carregamento do fluxo para edição via lista completa

`EditFlow` não tem endpoint direto. Chama `GET /rules` e filtra por `flowId`. Se o backend paginar ou limitar os resultados, o fluxo pode não ser encontrado. Solução futura: implementar `GET /rules/:id`.

### 3. Normalização de edges (string ↔ boolean)

Descrito na seção 10. Qualquer nova rota de persistência ou carregamento de fluxo **deve** aplicar `denormalizeEdgesFromBackend` ao receber e `normalizeEdgesForBackend` ao enviar.

### 4. `isStartNode` é derivado, não persistido diretamente nos dados do node

O campo `isStartNode` nos dados do node é **recalculado** pelo `useEffect` em `useFlowEditor` toda vez que `edges` muda. Ao carregar um fluxo da API, `buildFlowNodesFromApi` define `isStartNode: nodeId === flow.startNode`. Portanto, ao adicionar edges que mudam a topologia do grafo, o `isStartNode` é recalculado automaticamente.

### 5. IDs de node são sequenciais e podem colidir

Se o usuário carregar um fluxo com `node3` e arrastar um novo node, o sistema detecta o máximo existente via `getNextNodeNumber` e começa em `node4`. Porém, se o backend retornar nodes com IDs não numéricos (ex: UUIDs), `getNextNodeNumber` ignora esses ids (regex `/^node(\d+)$/`) e o contador inicia em `1`, potencialmente colidindo com ids existentes.

### 6. `onChangeArguments` é criada dentro de closures por `useFlowEditor`

Ao carregar um fluxo, `buildFlowNodesFromApi` recebe `createOnChangeArguments` como factory:

```js
(nodeId) => (argumentsPatch) => updateNodeData(nodeId, { arguments: argumentsPatch })
```

Se `updateNodeData` mudar de referência (improvável com `useCallback`), nodes carregados terão callbacks obsoletas. Isso é mitigado pelo `useCallback` em `updateNodeData`.

### 7. Sem autenticação

Não há nenhum mecanismo de autenticação ou autorização. Qualquer request para o backend é enviado sem token. Ao adicionar autenticação, o ponto de inserção correto é um interceptor na instância Axios em `src/api/index.js`.

### 8. `statusEnum` fixo como `"PUBLISHED"`

O payload sempre envia `statusEnum: "PUBLISHED"`. Não há suporte a rascunhos ou outros estados de publicação. Se o backend suportar mais estados, este campo precisa ser exposto como opção na UI.

---

## 15. Como Estender o Projeto

### Adicionar um novo tipo de node

1. Adicionar a constante em `features/flow/utils.js`.
2. Implementar `getNodeType()` com o novo mapeamento.
3. Criar o componente React em `components/`.
4. Registrar em `nodeTypes` em `App.jsx`, `SavedFlows.jsx` e `EditFlow.jsx`.
5. Implementar `buildPayloadNode` e `validatePayloadNode` para o novo tipo.
6. Se o tipo puder ser startNode, atualizar `canBeStartNode`.

### Alterar a URL da API

Editar `baseURL` em `src/api/index.js`. Para suportar múltiplos ambientes, usar variável de ambiente do Vite:

```js
baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080'
```

E criar `.env.local` com `VITE_API_BASE_URL=https://api.producao.com`.

### Adicionar roteamento baseado em URL

Instalar `react-router-dom` e substituir o controle manual de `currentPage` em `App.jsx` por `<Routes>`. Os callbacks de navegação (`openBuilder`, `openSavedFlows`, etc.) virariam `useNavigate()`.

### Adicionar autenticação

Adicionar interceptors na instância Axios:

```js
// src/api/index.js
api.interceptors.request.use((config) => {
  const token = getToken(); // sua lógica de token
  config.headers.Authorization = `Bearer ${token}`;
  return config;
});
```

### Melhorar tratamento de erros em `useOperators`

Atualmente erros são silenciados. Adicionar estado `error` e `isLoading` retornados pelo hook e exibidos na Sidebar.

### Implementar busca de fluxo por ID

Quando o backend implementar `GET /rules/:id`, alterar `EditFlow.jsx`:

```js
// Antes: carrega tudo e filtra
const data = await getRules();
const found = normalizeFlowList(data).find((f) => f.id === targetFlowId);

// Depois: busca direto
const found = await getRule(flowId); // nova função em api/index.js
```
