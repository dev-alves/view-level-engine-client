import { useState } from "react";
import { DragAndDropContext } from "../contexts/DragAndDropContext";

export const DragAndDropProvider = ({ children }) => {
  const [selectedOperator, setSelectedOperator] = useState(null);

  return (
    <DragAndDropContext.Provider value={{ selectedOperator, setSelectedOperator }}>
      {children}
    </DragAndDropContext.Provider>
  );
}
