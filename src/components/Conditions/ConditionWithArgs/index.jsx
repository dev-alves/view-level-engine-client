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
      <Handle type="target" position={Position.Top} />
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
      <Input
        id="value"
        type="text"
        value={data.arguments?.value ?? ''}
        onChange={onChange}
      />
    </Container>
  );
}

export default ConditionWithArgsNode;
