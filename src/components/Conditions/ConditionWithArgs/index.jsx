import { Handle, Position } from '@xyflow/react';
import { useCallback } from 'react';
import { Container, Input, Title } from './styles';

function ConditionWithArgsNode({ data }) {
  const onChange = useCallback(
    (evt) => {
      data.onChangeArguments({
        value: evt.target.value,
      });
    },
    [data],
  );

  return (
    <Container>
      <Title>{data.label}</Title>
      {!data.isStartNode && (
        <Handle type="target" position={Position.Top} isConnectable={true} />
      )}
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
      <Input
        id="value"
        type="text"
        value={data.arguments?.value ?? ''}
        onChange={onChange}
        disabled={data.isReadOnly}
      />
    </Container>
  );
}

export default ConditionWithArgsNode;
