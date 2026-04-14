import { useMemo, useEffect, useState, useCallback } from 'react';
import { Background, Controls, ReactFlow } from '@xyflow/react';
import { getNodeType, denormalizeEdgesFromBackend } from '../features/flow/utils';
import { getRules } from '../api';
import ActionNode from '../components/ActionNode';
import ConditionNode from '../components/Conditions/Condition';
import ConditionWithArgsNode from '../components/Conditions/ConditionWithArgs';

const nodeTypes = {
  actionNode: ActionNode,
  conditionNode: ConditionNode,
  conditionNodeWithArgs: ConditionWithArgsNode,
};

const buildNodes = (flow) => {
  if (!flow?.nodes) return [];

  return Object.entries(flow.nodes).map(([nodeId, nodeData]) => ({
    id: nodeId,
    type: getNodeType(nodeData.type),
    position: flow.positions?.[nodeId] ?? { x: 0, y: 0 },
    data: {
      label: nodeData.operation || nodeData.set || nodeId,
      apiType: nodeData.type,
      operation: nodeData.operation,
      arguments: nodeData.arguments,
      set: nodeData.set,
      isStartNode: nodeId === flow.startNode,
      isReadOnly: true,
    },
  }));
};

const buildEdges = (flow) => {
  const edges = flow?.edges ?? [];
  return denormalizeEdgesFromBackend(edges);
};

export const SavedFlows = ({ selectedFlowId, onSelectFlow }) => {
  const [flows, setFlows] = useState([]);
  const [currentFlowId, setCurrentFlowId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadFlows = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getRules();
      const flowsList = Array.isArray(data) ? data : [data];
      const withIds = flowsList.map((f, idx) => ({ id: f.id || `flow-${idx}`, ...f }));
      
      setFlows(withIds);
      if (withIds.length > 0) {
        setCurrentFlowId(withIds[0].id);
        onSelectFlow?.(withIds[0].id);
      }
    } catch (err) {
      setError(err.message || 'Erro ao carregar fluxos');
    } finally {
      setIsLoading(false);
    }
  }, [onSelectFlow]);

  useEffect(() => {
    loadFlows();
  }, [loadFlows]);

  const activeFlowId = selectedFlowId || currentFlowId;
  const activeFlow = useMemo(
    () => flows.find((f) => f.id === activeFlowId) ?? null,
    [flows, activeFlowId],
  );

  const nodes = useMemo(() => buildNodes(activeFlow), [activeFlow]);
  const edges = useMemo(() => buildEdges(activeFlow), [activeFlow]);

  const handleSelectFlow = useCallback(
    (flowId) => {
      setCurrentFlowId(flowId);
      onSelectFlow?.(flowId);
    },
    [onSelectFlow],
  );

  return (
    <div className="saved-flows-page">
      <div className="saved-flows-body">
        <aside className="saved-flows-list">
          {isLoading && <div className="empty-state"><p>Carregando fluxos...</p></div>}
          {error && <div className="empty-state"><p>Erro: {error}</p></div>}
          {!isLoading && !error && flows.length === 0 && (
            <div className="empty-state"><p>Não há fluxos salvos.</p></div>
          )}
          {!isLoading && !error && flows.length > 0 && (
            flows.map((flow) => (
              <button
                key={flow.id}
                type="button"
                className={`saved-flow-item ${flow.id === activeFlowId ? 'selected' : ''}`}
                onClick={() => handleSelectFlow(flow.id)}
              >
                <strong>{flow.title || `Fluxo ${flow.id}`}</strong>
                <span>{flow.createdAt || new Date().toLocaleString('pt-BR')}</span>
              </button>
            ))
          )}
        </aside>

        <main className="saved-flow-view">
          {!isLoading && !error && activeFlow && (
            <div className="saved-flow-diagram">
              <div className="saved-flow-meta">
                <h2>{activeFlow.title || 'Fluxo salvo'}</h2>
                <p>{activeFlow.description ?? 'Diagrama do fluxo persistido.'}</p>
              </div>
              <div className="reactflow-wrapper">
                <ReactFlow
                  nodes={nodes}
                  edges={edges}
                  fitView
                  nodesDraggable={false}
                  nodesConnectable={false}
                  panOnDrag
                  nodeTypes={nodeTypes}
                >
                  <Controls />
                  <Background />
                </ReactFlow>
              </div>
            </div>
          )}
          {!isLoading && !error && !activeFlow && (
            <div className="empty-state">
              <p>Selecione um fluxo para visualizar.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
