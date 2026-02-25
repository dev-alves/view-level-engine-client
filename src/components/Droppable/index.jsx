import { useDroppable } from '@dnd-kit/react';

export function Droppable({id, children}) {
  const {ref} = useDroppable({
    id,
  });

  return (
    <div ref={ref} style={{width: 500, height: 500, background: '#c9f1dd'}}>
      {children}
    </div>
  );
}