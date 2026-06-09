import api from '../../../shared/api/axiosInstance';

const unwrapPayload = (response) => response?.data || response || [];

export const getUserTours = async () => unwrapPayload(await api.get('/users/tours'));

export const getUserTourById = async (tourId) => unwrapPayload(await api.get(`/users/tours/${tourId}`));

export const createUserTourBooking = async (payload = {}) =>
  unwrapPayload(await api.post('/users/tours/bookings', payload));

export const listMyTourBookings = async () => unwrapPayload(await api.get('/users/tours/bookings'));

export const getMyTourBooking = async (bookingId) => unwrapPayload(await api.get(`/users/tours/bookings/${bookingId}`));
