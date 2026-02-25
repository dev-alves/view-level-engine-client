import { useDraggable } from "@dnd-kit/react";
import { Container } from "./styles";

export function ConditionNode(id) {
  const ref = useDraggable({
    id: id
  });

  return (
    <Container ref={ref}>
      <span>ConditionNome</span>
    </Container>
  )

}
