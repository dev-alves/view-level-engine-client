import { createContext } from 'react';

export const DragAndDropContext = createContext({
  selectedOperator: null,
  setSelectedOperator: () => {},
});
