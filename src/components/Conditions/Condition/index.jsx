import { Handle, Position } from '@xyflow/react';
import { NodeContainer, NodeTitle } from '../shared';

function ConditionNode({ data }) {
  return (
    <NodeContainer>
      <NodeTitle>{data.label}</NodeTitle>
      {!data.isStartNode ? <Handle type="target" position={Position.Top} isConnectable={true} /> : null}
      <Handle
        id="true"
        type="source"
        style={{ background: 'green' }}
        position={Position.Right}
        isConnectable={true}
      />
      <Handle
        id="false"
        type="source"
        style={{ background: 'red' }}
        position={Position.Left}
        isConnectable={true}
      />
    </NodeContainer>
  );
}

export default ConditionNode;
