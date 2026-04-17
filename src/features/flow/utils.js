export const CONDITION = 'CONDITION';
export const CONDITION_WITH_ARGS = 'CONDITION_WITH_ARGS';
export const ACTION = 'ACTION';

export const START_NODE_ERROR =
  'O startNode deve ser um node do tipo CONDITION. CONDITION_WITH_ARGS e ACTION nao podem iniciar o fluxo.';

export const FIRST_NODE_ERROR =
  'O primeiro node do fluxo deve ser do tipo CONDITION.';

export const INVALID_CONNECTION_ERROR =
  'Conexao invalida: cada branch true/false aceita um destino e cada node pode ter apenas uma entrada.';

const isConditionType = (type) =>
  type === CONDITION || type === CONDITION_WITH_ARGS;

const getOperatorValue = (operator, fields) => {
  for (const field of fields) {
    if (operator[field] !== undefined && operator[field] !== null) {
      return operator[field];
    }
  }

  return null;
};

export const getApiType = (operatorType) => {
  if (isConditionType(operatorType) || operatorType === ACTION) {
    return operatorType;
  }

  return operatorType;
};

export const getNodeType = (operatorType) => {
  if (operatorType === CONDITION_WITH_ARGS) {
    return 'conditionNodeWithArgs';
  }

  if (operatorType === CONDITION) {
    return 'conditionNode';
  }

  if (operatorType === ACTION) {
    return 'actionNode';
  }

  return 'default';
};

export const canBeStartNode = (apiType) => apiType === CONDITION;

export const buildNodeData = (operator, onChangeArguments) => {
  const apiType = getApiType(operator.type);

  return {
    label: operator.name,
    apiType,
    operation: isConditionType(apiType)
      ? getOperatorValue(operator, ['operation', 'key', 'value', 'name'])
      : null,
    set:
      apiType === ACTION
        ? getOperatorValue(operator, ['set', 'key', 'value', 'name'])
        : null,
    arguments:
      apiType === CONDITION_WITH_ARGS ? operator.arguments ?? { value: '' } : null,
    operatorId: operator.id ?? null,
    onChangeArguments,
    isStartNode: false,
  };
};

export const buildFlowNodesFromApi = (
  flow,
  createOnChangeArguments,
) => {
  if (!flow?.nodes) {
    return [];
  }

  return Object.entries(flow.nodes).map(([nodeId, nodeData]) => ({
    id: nodeId,
    type: getNodeType(nodeData.type),
    position: flow.positions?.[nodeId] ?? { x: 0, y: 0 },
    data: {
      label: nodeData.label || nodeData.operation || nodeData.set || nodeId,
      apiType: nodeData.type,
      operation: nodeData.operation,
      arguments: nodeData.arguments,
      set: nodeData.set,
      operatorId: nodeData.operatorId ?? null,
      isStartNode: nodeId === flow.startNode,
      onChangeArguments:
        createOnChangeArguments?.(nodeId) ?? (() => {}),
    },
  }));
};

export const buildFlowEdgesFromBackend = (flow) => {
  const edges = flow?.edges ?? [];

  return denormalizeEdgesFromBackend(edges);
};

export const getStartNodeIds = (nodes, edges) => {
  const targets = new Set(edges.map((edge) => edge.target));

  return new Set(
    nodes.filter((node) => !targets.has(node.id)).map((node) => node.id),
  );
};

const getNodeById = (nodes, nodeId) => nodes.find((node) => node.id === nodeId);

export const validateConnection = (connection, nodes, edges) => {
  const { source, sourceHandle, target } = connection;

  if (!source || !target || source === target) {
    return false;
  }

  const sourceNode = getNodeById(nodes, source);
  const targetNode = getNodeById(nodes, target);

  if (!sourceNode || !targetNode) {
    return false;
  }

  if (!isConditionType(sourceNode.data.apiType)) {
    return false;
  }

  if (sourceHandle !== 'true' && sourceHandle !== 'false') {
    return false;
  }

  const branchAlreadyUsed = edges.some(
    (edge) => edge.source === source && edge.sourceHandle === sourceHandle,
  );

  if (branchAlreadyUsed) {
    return false;
  }

  return !edges.some((edge) => edge.target === target);
};

const findStartNodeId = (nodes, edges) => {
  const startNodeIds = [...getStartNodeIds(nodes, edges)];

  if (startNodeIds.length !== 1) {
    throw new Error('O fluxo precisa ter exatamente um startNode.');
  }

  return startNodeIds[0];
};

const getConditionBranch = (edges, nodeId, handle) => {
  const branch = edges.find(
    (edge) => edge.source === nodeId && edge.sourceHandle === handle,
  );

  return branch?.target;
};

const validatePayloadNode = (nodePayload, nodeId) => {
  if (isConditionType(nodePayload.type)) {
    if (!nodePayload.operation) {
      throw new Error(`O node ${nodeId} precisa de operation.`);
    }

    if (!nodePayload.onTrue || !nodePayload.onFalse) {
      throw new Error(`O node ${nodeId} precisa de onTrue e onFalse.`);
    }
  }

  if (nodePayload.type === ACTION && !nodePayload.set) {
    throw new Error(`O node ${nodeId} precisa de set.`);
  }
};

const buildPayloadNode = (node, edges) => {
  const basePayload = {
    type: node.data.apiType,
    label: node.data.label,
    operatorId: node.data.operatorId,
    isStartNode: node.data.isStartNode,
  };

  if (isConditionType(node.data.apiType)) {
    return {
      ...basePayload,
      operation: node.data.operation,
      arguments: node.data.arguments,
      onTrue: getConditionBranch(edges, node.id, 'true'),
      onFalse: getConditionBranch(edges, node.id, 'false'),
      set: null,
    };
  }

  if (node.data.apiType === ACTION) {
    return {
      ...basePayload,
      operation: null,
      arguments: null,
      onTrue: null,
      onFalse: null,
      set: node.data.set,
    };
  }

  throw new Error(`O node ${node.id} possui um tipo de API invalido.`);
};

export const normalizeEdgesForBackend = (edges) => {
  return edges.map((edge) => ({
    ...edge,
    sourceHandle: edge.sourceHandle === 'true' ? true : false,
  }));
};

export const denormalizeEdgesFromBackend = (edges) => {
  return edges.map((edge) => ({
    ...edge,
    sourceHandle: edge.sourceHandle === true ? 'true' : 'false',
  }));
};

export const buildFlowPayload = (nodes, edges) => {
  if (nodes.length === 0) {
    throw new Error('Crie pelo menos um node antes de gerar o payload.');
  }

  const startNode = findStartNodeId(nodes, edges);
  const payloadNodes = Object.fromEntries(
    nodes.map((node) => {
      const payloadNode = buildPayloadNode(node, edges);
      validatePayloadNode(payloadNode, node.id);

      return [node.id, payloadNode];
    }),
  );

  const positions = Object.fromEntries(
    nodes.map((node) => [node.id, node.position])
  );

  if (!canBeStartNode(payloadNodes[startNode]?.type)) {
    throw new Error(START_NODE_ERROR);
  }

  const normalizedEdges = normalizeEdgesForBackend(edges);

  return {
    startNode,
    statusEnum: 'PUBLISHED',
    nodes: payloadNodes,
    positions,
    edges: normalizedEdges,
  };
};

export const getApiErrorMessage = (error) =>
  error.response?.data?.message ??
  error.response?.data?.error ??
  (typeof error.response?.data === 'string' ? error.response.data : null) ??
  error.message;

export const getFlowId = (flow, fallbackIndex = 0) => {
  const rawId = flow?.id;

  if (rawId === undefined || rawId === null || rawId === '') {
    return `flow-${fallbackIndex}`;
  }

  return String(rawId);
};

export const normalizeFlowList = (data) => {
  const flowsList = Array.isArray(data) ? data : [data];

  return flowsList.map((flow, index) => ({
    ...flow,
    id: getFlowId(flow, index),
  }));
};
