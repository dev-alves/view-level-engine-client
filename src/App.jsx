import '@xyflow/react/dist/style.css';
import {
  Background,
  ConnectionMode,
  Controls,
  ReactFlow,
  ReactFlowProvider,
} from '@xyflow/react';
import { useCallback, useMemo, useState } from 'react';
import { createRule } from './api';
import ActionNode from './components/ActionNode';
import { Sidebar } from './components/Sidebar';
import ConditionNode from './components/Conditions/Condition';
import ConditionWithArgsNode from './components/Conditions/ConditionWithArgs';
import { buildFlowPayload, getApiErrorMessage } from './features/flow/utils';
import { useFlowEditor } from './hooks/useFlowEditor';
import { DragAndDropProvider } from './providers/DragAndDropProvider';
import { SavedFlows } from './pages/SavedFlows';

const nodeTypes = {
  actionNode: ActionNode,
  conditionNode: ConditionNode,
  conditionNodeWithArgs: ConditionWithArgsNode,
};

const DragAndDropFlow = () => {
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
  } = useFlowEditor({ setPayloadError });

  const handleBuildPayload = useCallback(async () => {
    try {
      const payload = buildFlowPayload(nodes, edges);

      setIsSubmitting(true);
      setSubmitStatus('');
      setPayloadPreview(JSON.stringify(payload, null, 2));
      setPayloadError('');

      const response = await createRule(payload);

      setSubmitStatus(
        `Payload enviado com sucesso para /engine/rule.\n${JSON.stringify(response, null, 2)}`,
      );
    } catch (error) {
      setPayloadPreview('');
      setSubmitStatus('');
      setPayloadError(getApiErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }, [edges, nodes]);

  return (
    <div className="dndflow">
      <Sidebar
        onBuildPayload={handleBuildPayload}
        payloadPreview={payloadPreview}
        payloadError={payloadError}
        submitStatus={submitStatus}
        isSubmitting={isSubmitting}
      />
      <div className="reactflow-wrapper">
        <ReactFlow
          style={{ width: '100%', height: '100%' }}
          connectionMode={ConnectionMode.Loose}
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
  );
};

export default function App() {
  const [currentPage, setCurrentPage] = useState('builder');
  const [selectedFlowId, setSelectedFlowId] = useState(null);

  const selectSavedFlow = useCallback((flowId) => {
    setSelectedFlowId(flowId);
  }, []);

  const openSavedFlows = useCallback(() => {
    setCurrentPage('saved');
  }, []);

  const openBuilder = useCallback(() => {
    setCurrentPage('builder');
  }, []);

  const pageContent = useMemo(() => {
    if (currentPage === 'saved') {
      return (
        <SavedFlows
          selectedFlowId={selectedFlowId}
          onSelectFlow={selectSavedFlow}
        />
      );
    }

    return <DragAndDropFlow />;
  }, [currentPage, selectedFlowId, selectSavedFlow, openBuilder]);

  return (
    <ReactFlowProvider>
      <DragAndDropProvider>
        <div className="app-shell">
          <header className="app-menu">
            <div className="app-brand">Flow Engine</div>
            <div className="app-menu-actions">
              <button
                type="button"
                className={`menu-button ${currentPage === 'builder' ? 'active' : ''}`}
                onClick={openBuilder}
              >
                Criar fluxo
              </button>
              <button
                type="button"
                className={`menu-button ${currentPage === 'saved' ? 'active' : ''}`}
                onClick={openSavedFlows}
              >
                Visualizar fluxos
              </button>
            </div>
          </header>
          {pageContent}
        </div>
      </DragAndDropProvider>
    </ReactFlowProvider>
  );
}
