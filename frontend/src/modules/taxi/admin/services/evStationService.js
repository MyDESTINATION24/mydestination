import api from '../../../shared/api/axiosInstance';

const unwrapPayload = (response) => response?.data?.data || response?.data || response || [];

export const getAdminEVStations = async () => {
  const res = await api.get('/admin/ev-stations');
  return unwrapPayload(res);
};

export const createAdminEVStation = async (payload) => {
  const res = await api.post('/admin/ev-stations', payload);
  return unwrapPayload(res);
};

export const updateAdminEVStation = async (id, payload) => {
  const res = await api.patch(`/admin/ev-stations/${id}`, payload);
  return unwrapPayload(res);
};

export const deleteAdminEVStation = async (id) => {
  const res = await api.delete(`/admin/ev-stations/${id}`);
  return unwrapPayload(res);
};
