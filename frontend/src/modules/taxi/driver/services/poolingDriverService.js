import api from '../../../shared/api/axiosInstance';
import { getLocalDriverToken } from './registrationService';

const withDriverAuth = (config = {}) => {
  const token = getLocalDriverToken();

  if (!token) {
    return config;
  }

  return {
    ...config,
    headers: {
      ...(config.headers || {}),
      Authorization: `Bearer ${token}`,
    },
  };
};

export const getPoolingDashboard = () =>
  api.get('/drivers/pooling/dashboard', withDriverAuth());

export const updatePoolingBookingStatus = (id, status) =>
  api.patch(`/drivers/pooling/bookings/${id}`, { status }, withDriverAuth());
