import { Handle, Position } from '@xyflow/react';
import { NodeContainer, NodeTitle } from '../Conditions/shared';

function ActionNode({ data }) {
  return (
    <NodeContainer>
      <NodeTitle>{data.label}</NodeTitle>
      <Handle type="target" position={Position.Top} />
    </NodeContainer>
  );
}

export default ActionNode;
