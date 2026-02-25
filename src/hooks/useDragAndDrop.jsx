import { useContext } from "react";
import { DragAndDropContext } from "../contexts/DragAndDropContext";

export const useDragAndDrop = () => {
  return useContext(DragAndDropContext);
}