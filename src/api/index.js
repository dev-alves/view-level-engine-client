import axios from 'axios';

export const api = axios.create({
  baseURL: 'http://localhost:8080',
});

export const createRule = async (payload) => {
  const response = await api.post('/engine/rule', payload);

  return response.data;
};

export default api;
