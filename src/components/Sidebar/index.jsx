import { useDragAndDrop } from '../../hooks/useDragAndDrop';
import { useOperators } from '../../hooks/useOperators';

const getOperatorClassName = (type) => {
  if (type === 'ACTION') {
    return 'dndnode input';
  }

  if (type === 'CONDITION') {
    return 'dndnode output';
  }

  return 'dndnode';
};

export function Sidebar ({
  onBuildPayload,
  payloadPreview,
  payloadError,
  submitStatus,
  isSubmitting,
}) {
  const { setSelectedOperator } = useDragAndDrop();
  const operators = useOperators();

  const onDragStart = (event, operator) => {
    setSelectedOperator(operator);
    event.dataTransfer.setData('text/plain', String(operator.id));
  };

  return (
    <aside id="sidebar">
      <div className="description">Operações e ações</div>
      <button
        type="button"
        className="payload-button"
        onClick={onBuildPayload}
        disabled={isSubmitting}
      >
        {isSubmitting ? 'Enviando...' : 'Gerar payload e enviar'}
      </button>
      {payloadError ? <p className="payload-error">{payloadError}</p> : null}
      {submitStatus ? (
        <pre className="payload-success">{submitStatus}</pre>
      ) : null}
      {payloadPreview ? (
        <pre className="payload-preview">{payloadPreview}</pre>
      ) : null}
      {operators.map((op) => {
        return (
          <div
            key={op.id}
            id={op.id}
            className={getOperatorClassName(op.type)}
            onDragStart={(event) => onDragStart(event, op)}
            draggable
          >
            {op.name}
          </div>
        );
      })}
    </aside>
  );
};
