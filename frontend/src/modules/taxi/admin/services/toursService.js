import api from '../../../shared/api/axiosInstance';

const unwrapPayload = (response) => response?.data || response || [];

export const createTourDraft = () => ({
  id: '',
  name: '',
  overview: '',
  duration: '',
  durationDays: 0,
  meals: '',
  helicopterType: '',
  startPoint: '',
  endPoint: '',
  destinations: [],
  packageType: '',
  itinerary: [],
  inclusions: [],
  exclusions: [],
  hotels: [],
  price: 0,
  priceType: 'per_day',
  status: 'active',
  image: '',
  gallery: [],
});

export const getAdminTours = async () => unwrapPayload(await api.get('/admin/tours'));

export const upsertAdminTour = async (payload = {}) => {
  const normalizedPayload = {
    ...payload,
    price: Number(payload.price || 0),
    durationDays: Number(payload.durationDays || 0),
  };

  if (payload.id) {
    return unwrapPayload(await api.patch(`/admin/tours/${payload.id}`, normalizedPayload));
  }

  return unwrapPayload(await api.post('/admin/tours', normalizedPayload));
};

export const deleteAdminTour = async (tourId) => unwrapPayload(await api.delete(`/admin/tours/${tourId}`));

export const getAdminTourBookings = async () => unwrapPayload(await api.get('/admin/tour-bookings'));

export const createAdminTourBooking = async (payload = {}) =>
  unwrapPayload(await api.post('/admin/tour-bookings', payload));

export const updateAdminTourBookingStatus = async (bookingId, bookingStatus, paymentStatus = null) => {
  const payload = { status: bookingStatus };
  if (paymentStatus) {
    payload.paymentStatus = paymentStatus;
  }
  return unwrapPayload(await api.patch(`/admin/tour-bookings/${bookingId}/status`, payload));
};
