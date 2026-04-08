import { Handle, Position } from '@xyflow/react';
import { NodeContainer, NodeTitle } from '../shared';

function ConditionNode({ data }) {
  return (
    <NodeContainer>
      <NodeTitle>{data.label}</NodeTitle>
      {!data.isStartNode ? <Handle type="target" position={Position.Top} /> : null}
      <Handle
        id="true"
        type="source"
        style={{ background: 'green' }}
        position={Position.Right}
      />
      <Handle
        id="false"
        type="source"
        style={{ background: 'red' }}
        position={Position.Left}
      />
    </NodeContainer>
  );
}

export default ConditionNode;
