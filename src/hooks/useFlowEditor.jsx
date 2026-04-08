import { addEdge, useEdgesState, useNodesState, useReactFlow } from '@xyflow/react';
import { useCallback, useEffect, useRef } from 'react';
import { useDragAndDrop } from './useDragAndDrop';
import {
  buildNodeData,
  canBeStartNode,
  FIRST_NODE_ERROR,
  getApiType,
  getNodeType,
  getStartNodeIds,
  INVALID_CONNECTION_ERROR,
  validateConnection,
} from '../features/flow/utils';

const mergeArguments = (currentArguments, nextArguments) => {
  if (nextArguments === null) {
    return null;
  }

  return {
    ...(currentArguments ?? {}),
    ...(nextArguments ?? {}),
  };
};

export const useFlowEditor = ({ setPayloadError }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const nextNodeId = useRef(1);
  const { screenToFlowPosition } = useReactFlow();
  const { selectedOperator } = useDragAndDrop();

  const updateNodeData = useCallback(
    (nodeId, patch) => {
      setNodes((currentNodes) =>
        currentNodes.map((node) => {
          if (node.id !== nodeId) {
            return node;
          }

          return {
            ...node,
            data: {
              ...node.data,
              ...patch,
              arguments: mergeArguments(node.data.arguments, patch.arguments),
            },
          };
        }),
      );
    },
    [setNodes],
  );

  useEffect(() => {
    const startNodeIds = getStartNodeIds(nodes, edges);

    setNodes((currentNodes) => {
      let changed = false;

      const nextNodes = currentNodes.map((node) => {
        const isStartNode =
          startNodeIds.has(node.id) && canBeStartNode(node.data.apiType);

        if (node.data.isStartNode === isStartNode) {
          return node;
        }

        changed = true;

        return {
          ...node,
          data: {
            ...node.data,
            isStartNode,
          },
        };
      });

      return changed ? nextNodes : currentNodes;
    });
  }, [edges, nodes, setNodes]);

  const handleConnect = useCallback(
    (connection) => {
      if (!validateConnection(connection, nodes, edges)) {
        setPayloadError(INVALID_CONNECTION_ERROR);
        return;
      }

      setPayloadError('');
      setEdges((currentEdges) => addEdge(connection, currentEdges));
    },
    [edges, nodes, setEdges, setPayloadError],
  );

  const handleDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const handleDrop = useCallback(
    (event) => {
      event.preventDefault();

      if (!selectedOperator) {
        return;
      }

      const apiType = getApiType(selectedOperator.type);

      if (nodes.length === 0 && !canBeStartNode(apiType)) {
        setPayloadError(FIRST_NODE_ERROR);
        return;
      }

      if (nodes.length === 0) {
        nextNodeId.current = 1;
      }

      const nodeId = `node${nextNodeId.current++}`;
      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const newNode = {
        id: nodeId,
        type: getNodeType(selectedOperator.type),
        position,
        data: buildNodeData(selectedOperator, (argumentsPatch) => {
          updateNodeData(nodeId, { arguments: argumentsPatch });
        }),
      };

      newNode.data.isStartNode = nodes.length === 0;

      setPayloadError('');
      setNodes((currentNodes) => currentNodes.concat(newNode));
    },
    [
      nodes.length,
      screenToFlowPosition,
      selectedOperator,
      setNodes,
      setPayloadError,
      updateNodeData,
    ],
  );

  const isValidConnection = useCallback(
    (connection) => validateConnection(connection, nodes, edges),
    [edges, nodes],
  );

  return {
    edges,
    handleConnect,
    handleDragOver,
    handleDrop,
    isValidConnection,
    nodes,
    onEdgesChange,
    onNodesChange,
  };
};
