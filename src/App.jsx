import '@xyflow/react/dist/style.css';
import { useCallback } from 'react';
import { addEdge, Background, Controls, ReactFlow, ReactFlowProvider, useEdgesState, useNodesState, useReactFlow } from '@xyflow/react';
import { useRef } from 'react';
import { Sidebar } from './components/sidebar';
import { DragAndDropProvider } from './providers/DragAndDropProvider';
import { useDragAndDrop } from './hooks/useDragAndDrop';

let id = 0;
const getId = () => `dndnode_${id++}`;

const DragAndDropFlow = () => {

  const reactFlowWrapper = useRef(null);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const { screenToFlowPosition } = useReactFlow();
  const { type, setType, nodeName } = useDragAndDrop();

  const onConnect = useCallback((params) => setEdges((eds) => addEdge(params, eds)), [setEdges]);

  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event) => {
      event.preventDefault();
      if (!type) {
        return;
      }

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });
      
      if (nodes.length === 0) {
        id = 0;
      }

      const typeValue = id === 0 ? 'input' : type === 'ACTION' ? 'output' : 'default';

      const newNode = {
        id: getId(),
        type: typeValue,
        position,
        data: { label: nodeName },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [screenToFlowPosition, type, nodeName, nodes, setNodes],
  );

  const onDragStart = (event, nodeType) => {
    setType(nodeType);
    event.dataTransfer.setData('text/plain', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div className="dndflow">
      <div className="reactflow-wrapper" ref={reactFlowWrapper}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onDrop={onDrop}
          onDragStart={onDragStart}
          onDragOver={onDragOver}
          fitView
        >
          <Controls />
          <Background />
        </ReactFlow>
      </div>
      <Sidebar />
    </div>
  );
}

export default function App() {
  return (
  <ReactFlowProvider>
    <DragAndDropProvider>
      <DragAndDropFlow />
    </DragAndDropProvider>
  </ReactFlowProvider>
  );
}