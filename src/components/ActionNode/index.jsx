import { Container } from "./styles";
import { useDraggable } from "@dnd-kit/react";

export function ActionNode() {

  const { ref } = useDraggable({
    id: 'draggable',
  });

  return (
    <Container ref={ref}>
      <select>
        <option>COMPLETE</option>
        <option>BLOCKED</option>
        <option>MASKED</option>
      </select>
    </Container>
  );

}