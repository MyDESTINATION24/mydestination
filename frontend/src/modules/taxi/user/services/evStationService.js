import api from '../../../shared/api/axiosInstance';

const unwrapPayload = (response) => response?.data || response || [];

export const getClosestEVStations = async (lat, lng, radius = 50000) => {
  const res = await api.get(`/users/ev-stations/closest?lat=${lat}&lng=${lng}&radius=${radius}`);
  return unwrapPayload(res);
};
