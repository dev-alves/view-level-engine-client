import { useEffect, useState } from 'react';
import api from '../api';

export const useOperators = () => {
  const [operators, setOperators] = useState([]);

  useEffect(() => {
    const fetchOperators = async () => {
      try {
        const response = await api.get('/rules/operators');
        setOperators(response.data);
      } catch (error) {
        console.error(error);
      }
    };

    fetchOperators();
  }, []);

  return operators;
};
