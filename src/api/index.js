import axios from 'axios';

export const api = axios.create({
  baseURL: 'http://localhost:8080',
  headers: {
    'Content-Type': 'application/json',
  },
});

export const createRule = async (payload) => {
  const response = await api.post('/engine/rule', payload);
  return response.data;
};

export const updateRule = async (id, payload) => {
  const response = await api.put(`/engine/rule/${id}`, payload);
  return response.data;
};

export const getRules = async () => {
  const response = await api.get('/rules');
  return response.data;
};

export default api;
