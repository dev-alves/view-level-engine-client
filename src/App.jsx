import '@xyflow/react/dist/style.css';
import {
  Background,
  ConnectionMode,
  Controls,
  ReactFlow,
  ReactFlowProvider,
} from '@xyflow/react';
import { useCallback, useState } from 'react';
import { createRule } from './api';
import ActionNode from './components/ActionNode';
import { Sidebar } from './components/Sidebar';
import ConditionNode from './components/Conditions/Condition';
import ConditionWithArgsNode from './components/Conditions/ConditionWithArgs';
import { buildFlowPayload, getApiErrorMessage } from './features/flow/utils';
import { useFlowEditor } from './hooks/useFlowEditor';
import { DragAndDropProvider } from './providers/DragAndDropProvider';

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
  return (
    <ReactFlowProvider>
      <DragAndDropProvider>
        <DragAndDropFlow />
      </DragAndDropProvider>
    </ReactFlowProvider>
  );
}
