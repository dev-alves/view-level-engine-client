import { useEffect, useState, useCallback } from 'react';
import { Background, Controls, ReactFlow, ConnectionMode } from '@xyflow/react';
import { getRules, updateRule } from '../api';
import ActionNode from '../components/ActionNode';
import { Sidebar } from '../components/Sidebar';
import ConditionNode from '../components/Conditions/Condition';
import ConditionWithArgsNode from '../components/Conditions/ConditionWithArgs';
import {
  buildFlowPayload,
  getApiErrorMessage,
  normalizeFlowList,
} from '../features/flow/utils';
import { useFlowEditor } from '../hooks/useFlowEditor';

const nodeTypes = {
  actionNode: ActionNode,
  conditionNode: ConditionNode,
  conditionNodeWithArgs: ConditionWithArgsNode,
};

export const EditFlow = ({ flowId, onFlowUpdated, onCancel }) => {
  const [flow, setFlow] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [payloadPreview, setPayloadPreview] = useState('');
  const [payloadError, setPayloadError] = useState('');
  const [submitStatus, setSubmitStatus] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    edges,
    handleConnect,
    handleDragOver,
    handleDrop,
    isValidConnection,
    nodes,
    onEdgesChange,
    onNodesChange,
  } = useFlowEditor({
    setPayloadError,
    persistedFlow: flow,
  });

  useEffect(() => {
    const loadFlow = async () => {
      try {
        setIsLoading(true);
        setError(null);
        setPayloadError('');
        setPayloadPreview('');
        setSubmitStatus('');

        const data = await getRules();
        const flowsList = normalizeFlowList(data);
        const targetFlowId = flowId == null ? null : String(flowId);
        const foundFlow = flowsList.find((item) => item.id === targetFlowId);

        if (!foundFlow) {
          setFlow(null);
          setError('Fluxo não encontrado.');
          return;
        }

        setFlow(foundFlow);
      } catch (err) {
        setFlow(null);
        setError(err.message || 'Erro ao carregar fluxo.');
      } finally {
        setIsLoading(false);
      }
    };

    loadFlow();
  }, [flowId]);

  const handleUpdatePayload = useCallback(async () => {
    try {
      const payload = buildFlowPayload(nodes, edges);

      setIsSubmitting(true);
      setSubmitStatus('');
      setPayloadPreview(JSON.stringify(payload, null, 2));
      setPayloadError('');

      const response = await updateRule(flowId, payload);

      setSubmitStatus(
        `Fluxo atualizado com sucesso.\n${JSON.stringify(response, null, 2)}`,
      );

      setTimeout(() => {
        onFlowUpdated?.();
      }, 1200);
    } catch (updateError) {
      setSubmitStatus('');
      setPayloadError(getApiErrorMessage(updateError));
    } finally {
      setIsSubmitting(false);
    }
  }, [edges, flowId, nodes, onFlowUpdated]);

  if (isLoading) {
    return (
      <div className="edit-flow-page">
        <div className="empty-state">
          <p>Carregando fluxo...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="edit-flow-page">
        <div className="empty-state">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!flow) {
    return (
      <div className="edit-flow-page">
        <div className="empty-state">
          <p>Fluxo não encontrado.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="edit-flow-page">
      <div className="edit-flow-header">
        <div className="edit-flow-info">
          <h2>{flow.title || 'Editar fluxo'}</h2>
          <p>{flow.description || 'Edite o fluxo salvo e publique as alterações.'}</p>
        </div>
        <div className="edit-flow-actions">
          <button type="button" className="secondary-button" onClick={onCancel}>
            Cancelar
          </button>
        </div>
      </div>

      <div className="dndflow edit-flow-layout">
        <Sidebar
          onBuildPayload={handleUpdatePayload}
          payloadPreview={payloadPreview}
          payloadError={payloadError}
          submitStatus={submitStatus}
          isSubmitting={isSubmitting}
          actionLabel="Salvar alterações"
          actionSubmittingLabel="Salvando..."
          description="Operações disponíveis para editar o fluxo"
        />
        <div className="reactflow-wrapper">
          <ReactFlow
            style={{ width: '100%', height: '100%' }}
            connectionMode={ConnectionMode.Strict}
            fitConnectionLineToNodes={true}
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={handleConnect}
            isValidConnection={isValidConnection}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            fitView
            nodeTypes={nodeTypes}
          >
            <Controls />
            <Background />
          </ReactFlow>
        </div>
      </div>
    </div>
  );
};
