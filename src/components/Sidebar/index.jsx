import { useDragAndDrop } from "../../hooks/useDragAndDrop";
import api from '../../api/';
import { useEffect, useState } from "react";

export function Sidebar () {
  const  { setType, setNodeName } = useDragAndDrop();

  const [operators, setOperators] = useState([]);

  useEffect(() => {
    const fetchData = async() => {
      try {
        const response = await api.get('/rules/operators');
        setOperators(response.data);
      } catch(err) {
        console.log(err);
      }
    }
    fetchData();
  }, []);

  const onDragStart = (event, nodeName, nodeType) => {
    setNodeName(nodeName);
    setType(nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <aside>
      <div className="description">Operações e ações</div>
      {operators.map(op => {
        const actionStyle = op.type === 'ACTION' ?
          'dndnode input' : op.type === 'CONDITION' ?
          'dndnode output' : 'dndnode';
        return (
          <div id={op.id} className={actionStyle} onDragStart={(event) => onDragStart(event, op.name, op.type)} draggable>
            {op.name}
          </div>
        );
      })}
    </aside>
  );
};
