# View Level Flow Client

Aplicacao front-end para montar regras de decisao em formato visual, usando drag and drop, e enviar o fluxo gerado para uma API de engine de regras.

O usuario arrasta operadores para o canvas, conecta os nos em um grafo e o cliente transforma esse desenho em um payload estruturado para o endpoint `POST /engine/rule`.

## O que essa app faz

- Busca operadores disponiveis na API em `GET /rules/operators`.
- Exibe esses operadores na sidebar como itens arrastaveis.
- Permite montar um fluxo com nos de condicao e acao usando `@xyflow/react`.
- Valida restricoes basicas do fluxo antes de montar o payload.
- Exibe o JSON gerado no proprio front-end.
- Envia o fluxo para a API local em `http://localhost:8080/engine/rule`.

## Stack

- React 19
- Vite 7
- `@xyflow/react` para o editor visual de grafos
- `axios` para comunicacao HTTP
- `styled-components` para estilizacao de componentes de nodes
- ESLint 9 para lint

## Regras de negocio do fluxo

Pelo comportamento implementado hoje, o editor trabalha com tres tipos principais:

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

Ao clicar em "Gerar payload e enviar", o front-end monta um objeto com este formato:

```json
{
  "version": 1,
  "startNode": "node1",
  "statusEnum": "DRAFT",
  "nodes": {
    "node1": {
      "type": "CONDITION",
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
- O preview do payload aparece na sidebar antes e durante o envio.

## Endpoints esperados

Base URL configurada no cliente:

```txt
http://localhost:8080
```

Endpoints utilizados:

- `GET /rules/operators`: retorna a lista de operadores exibidos na sidebar.
- `POST /engine/rule`: recebe o payload do fluxo montado no editor.

Exemplo esperado de operador vindo da API:

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
  api/                       camada HTTP com axios
  components/
    ActionNode/             node visual de acao
    Conditions/
      Condition/            node visual de condicao
      ConditionWithArgs/    node de condicao com input de argumentos
  contexts/                 contexto de drag and drop
  features/flow/            regras de validacao e montagem de payload
  hooks/
    useFlowEditor.jsx       estado do grafo, drop e conexoes
    useOperators.jsx        busca operadores na API
  providers/                provider do contexto de drag and drop
  App.jsx                   composicao principal do editor
```

## Fluxo da interface

1. A sidebar carrega operadores a partir da API.
2. O usuario arrasta um operador para o canvas.
3. O editor cria um node compatível com o tipo do operador.
4. O usuario conecta os nodes pelas saidas `true` e `false`.
5. O cliente valida a estrutura do grafo.
6. O payload e serializado e enviado para a API.

## Pontos de atencao atuais

- A `baseURL` da API esta fixa em codigo em `src/api/index.js`.
- Nao ha tratamento visual para falha no carregamento inicial dos operadores; o erro vai apenas para o console.
- Ainda nao existe suite de testes automatizados.
- O campo de argumentos em `CONDITION_WITH_ARGS` hoje trabalha com a chave `value`.

## Possiveis evolucoes

- Mover a URL da API para variaveis de ambiente do Vite.
- Adicionar estados de loading e erro para a carga de operadores.
- Criar testes para `buildFlowPayload` e validacoes de conexao.
- Permitir edicao mais rica dos argumentos por tipo de operador.
- Persistir e recarregar fluxos salvos.
