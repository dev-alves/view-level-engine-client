# View Level Flow Client

Aplicacao front-end para montar, visualizar e editar regras de decisao em formato visual, usando drag and drop, e se comunicar com uma API de engine de regras.

O usuario pode criar novos fluxos arrastando operadores para o canvas, visualizar fluxos ja salvos e editar fluxos existentes. O cliente transforma o desenho em um payload estruturado e o envia para os endpoints da API.

## O que essa app faz

- Busca operadores disponiveis na API em `GET /rules/operators`.
- Exibe esses operadores na sidebar como itens arrastaveis.
- Permite montar um fluxo com nos de condicao e acao usando `@xyflow/react`.
- Valida restricoes basicas do fluxo antes de montar o payload.
- Exibe o JSON gerado no proprio front-end.
- Envia o fluxo para a API local em `http://localhost:8080/engine/rule`.
- Lista fluxos ja salvos buscados em `GET /rules`.
- Permite visualizar o diagrama de qualquer fluxo salvo em modo read-only.
- Permite editar um fluxo existente e persistir as alteracoes via `PUT /engine/rule/:id`.

## Navegacao

A aplicacao possui tres visoes acessiveis pelo menu superior:

- **Criar fluxo**: editor visual com drag and drop para criar um novo fluxo.
- **Visualizar fluxos**: lista os fluxos salvos na API e exibe o diagrama do fluxo selecionado em modo somente leitura.
- **Editar fluxo**: abre quando o usuario clica em "Editar" na tela de visualizacao; permite modificar o grafo de um fluxo existente e salvar as alteracoes.

## Stack

- React 19
- Vite 7
- `@xyflow/react` para o editor visual de grafos
- `axios` para comunicacao HTTP
- `styled-components` para estilizacao de componentes de nodes
- ESLint 9 para lint

## Regras de negocio do fluxo

O editor trabalha com tres tipos principais de node:

- `CONDITION`
- `CONDITION_WITH_ARGS`
- `ACTION`

Regras aplicadas no front-end:

- O primeiro node do fluxo deve ser obrigatoriamente do tipo `CONDITION`.
- O `startNode` final tambem precisa ser do tipo `CONDITION`.
- Apenas nodes de condicao podem originar conexoes.
- Cada branch `true` e `false` aceita somente um destino.
- Cada node pode ter somente uma entrada.
- Nodes condicionais precisam ter `onTrue` e `onFalse` para gerar payload valido.
- Nodes `ACTION` precisam possuir o campo `set`.

## Payload gerado

Ao clicar em "Gerar payload e enviar" (criacao) ou "Atualizar" (edicao), o front-end monta um objeto com este formato:

```json
{
  "version": 1,
  "startNode": "node1",
  "statusEnum": "DRAFT",
  "nodes": {
    "node1": {
      "type": "CONDITION",
      "label": "Customer Has Balance",
      "isStartNode": true,
      "operation": "customerHasBalance",
      "arguments": null,
      "onTrue": "node2",
      "onFalse": "node3",
      "set": null
    }
  }
}
```

Observacoes:

- `CONDITION_WITH_ARGS` envia `arguments`.
- `ACTION` envia `set` e nao possui `onTrue` nem `onFalse`.
- Os campos `label` e `isStartNode` sao incluidos em todos os nodes.
- O preview do payload aparece na sidebar antes e durante o envio.

## Endpoints esperados

Base URL configurada no cliente:

```txt
http://localhost:8080
```

Endpoints utilizados:

| Metodo | Endpoint              | Descricao                                          |
|--------|-----------------------|----------------------------------------------------|
| GET    | `/rules/operators`    | Retorna a lista de operadores exibidos na sidebar. |
| GET    | `/rules`              | Retorna todos os fluxos salvos.                    |
| POST   | `/engine/rule`        | Cria um novo fluxo a partir do payload do editor.  |
| PUT    | `/engine/rule/:id`    | Atualiza um fluxo existente pelo seu ID.           |

Exemplo esperado de operador vindo da API (`GET /rules/operators`):

```json
[
  {
    "id": "1",
    "name": "Customer Has Balance",
    "type": "CONDITION",
    "operation": "customerHasBalance"
  },
  {
    "id": "2",
    "name": "Order Value Greater Than",
    "type": "CONDITION_WITH_ARGS",
    "operation": "orderValueGreaterThan",
    "arguments": {
      "value": ""
    }
  },
  {
    "id": "3",
    "name": "Set Approved",
    "type": "ACTION",
    "set": "APPROVED"
  }
]
```

## Como rodar

### Requisitos

- Node.js 20+ recomendado
- npm
- API backend rodando em `http://localhost:8080`

### Instalacao

```bash
npm install
```

### Desenvolvimento

```bash
npm run dev
```

### Build de producao

```bash
npm run build
```

### Preview local da build

```bash
npm run preview
```

### Lint

```bash
npm run lint
```

## Estrutura principal

```txt
src/
  api/                       camada HTTP com axios (createRule, updateRule, getRules)
  components/
    ActionNode/             node visual de acao
    Conditions/
      Condition/            node visual de condicao
      ConditionWithArgs/    node de condicao com input de argumentos
  contexts/                 contexto de drag and drop
  features/flow/            regras de validacao, montagem e normalizacao de payload
  hooks/
    useFlowEditor.jsx       estado do grafo, drop e conexoes
    useOperators.jsx        busca operadores na API
  pages/
    EditFlow.jsx            pagina de edicao de fluxo existente
    SavedFlows.jsx          pagina de listagem e visualizacao de fluxos salvos
  providers/                provider do contexto de drag and drop
  App.jsx                   shell da aplicacao com navegacao entre paginas
```

## Fluxo da interface

### Criar fluxo

1. A sidebar carrega operadores a partir de `GET /rules/operators`.
2. O usuario arrasta um operador para o canvas.
3. O editor cria um node compativel com o tipo do operador.
4. O usuario conecta os nodes pelas saidas `true` e `false`.
5. O cliente valida a estrutura do grafo.
6. O payload e serializado e enviado para `POST /engine/rule`.

### Visualizar fluxos

1. A pagina busca todos os fluxos em `GET /rules`.
2. A lista de fluxos e exibida na sidebar esquerda.
3. O fluxo selecionado e renderizado como diagrama em modo read-only.
4. O botao "Editar" abre o fluxo na visao de edicao.

### Editar fluxo

1. O fluxo selecionado e carregado e seus nodes e conexoes sao reconstruidos no canvas.
2. O usuario modifica o grafo normalmente.
3. Ao confirmar, o payload atualizado e enviado para `PUT /engine/rule/:id`.