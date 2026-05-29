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
      localStorage.removeItem('nh_room');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export const auth = {
  login:    d => api.post('/auth/login', d),
  register: d => api.post('/auth/register', d),
  me:       () => api.get('/auth/me'),
};

export const roomsApi = {
  create: d  => api.post('/rooms', d),
  join:   code => api.get(`/rooms/${code}`),
};

export const collectionsApi = {
  list:       roomId      => api.get('/collections', { params: { roomId } }),
  create:     (roomId, d) => api.post('/collections', { ...d, roomId }),
  get:        id          => api.get(`/collections/${id}`),
  update:     (id, d)     => api.put(`/collections/${id}`, d),
  delete:     (id, roomCode, password) => api.delete(`/collections/${id}`, { data: { roomCode, password } }),
  count:      (id, action)             => api.post(`/collections/${id}/count`, { action }),
  addNote:    (id, d)                  => api.post(`/collections/${id}/notes`, d),
  updateNote: (id, noteId, d)          => api.put(`/collections/${id}/notes/${noteId}`, d),
  deleteNote: (id, noteId)             => api.delete(`/collections/${id}/notes/${noteId}`),
  addDate:    (id, d)                  => api.post(`/collections/${id}/dates`, d),
  deleteDate: (id, dateId)             => api.delete(`/collections/${id}/dates/${dateId}`),
  createPoll: (id, d)                  => api.post(`/collections/${id}/polls`, d),
  vote:       (id, pollId, optionId)   => api.post(`/collections/${id}/polls/${pollId}/vote`, { optionId }),
  deletePoll: (id, pollId)             => api.delete(`/collections/${id}/polls/${pollId}`),
};

export const logsApi = {
  list:  (roomId, params) => api.get('/logs', { params: { roomId, ...params } }),
  clean: (roomCode, password) => api.delete('/logs/clean', { data: { roomCode, password } }),
};

export default api;
