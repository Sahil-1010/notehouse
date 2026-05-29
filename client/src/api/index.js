import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

api.interceptors.request.use(config => {
  const token = localStorage.getItem('nh_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('nh_token');
      localStorage.removeItem('nh_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export const auth = {
  login: d => api.post('/auth/login', d),
  register: d => api.post('/auth/register', d),
  me: () => api.get('/auth/me'),
};

export const collectionsApi = {
  list: () => api.get('/collections'),
  create: d => api.post('/collections', d),
  get: id => api.get(`/collections/${id}`),
  update: (id, d) => api.put(`/collections/${id}`, d),
  delete: (id, password) => api.delete(`/collections/${id}`, { data: { password } }),
  count: (id, action) => api.post(`/collections/${id}/count`, { action }),
  addNote: (id, d) => api.post(`/collections/${id}/notes`, d),
  updateNote: (id, noteId, d) => api.put(`/collections/${id}/notes/${noteId}`, d),
  deleteNote: (id, noteId) => api.delete(`/collections/${id}/notes/${noteId}`),
  addDate: (id, d) => api.post(`/collections/${id}/dates`, d),
  deleteDate: (id, dateId) => api.delete(`/collections/${id}/dates/${dateId}`),
  createPoll: (id, d) => api.post(`/collections/${id}/polls`, d),
  vote: (id, pollId, optionId) => api.post(`/collections/${id}/polls/${pollId}/vote`, { optionId }),
  deletePoll: (id, pollId) => api.delete(`/collections/${id}/polls/${pollId}`),
};

export const logsApi = {
  list: params => api.get('/logs', { params }),
};

export default api;
