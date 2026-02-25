import { useState } from "react";
import { DragAndDropContext } from "../contexts/DragAndDropContext";

export const DragAndDropProvider = ({ children }) => {
  const [type, setType] = useState(null);
  const [nodeName, setNodeName] = useState(null);

  return (
    <DragAndDropContext.Provider value={{type, setType, nodeName, setNodeName}}>
      {children}
    </DragAndDropContext.Provider>
  );
}
