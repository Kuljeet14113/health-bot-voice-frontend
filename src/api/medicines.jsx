const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const medicinesAPI = {
  getAll: async (token) => {
    const response = await fetch(`${API_BASE_URL}/medicines`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) throw new Error('Failed to fetch medicines');
    return response.json();
  },
  getByCondition: async (condition, token) => {
    const response = await fetch(`${API_BASE_URL}/medicines/${encodeURIComponent(condition)}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) throw new Error('Failed to fetch condition medicines');
    return response.json();
  }
};
