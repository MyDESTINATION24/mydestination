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

  category: 'yatra',
  capacity: 0,

  difficulty: '',
  maxAltitudeM: 0,
  trailDistanceKm: 0,
  bestMonths: [],
  baseCamp: '',
  gearProvided: [],
  gearToCarry: [],
  permitsRequired: [],
  fitnessNote: '',
  minGroupSize: 0,
  maxGroupSize: 0,
  guide: { name: '', phone: '', experienceYears: 0, languages: [], certifications: [], photo: '', bio: '' },
});

export const getAdminTours = async () => unwrapPayload(await api.get('/admin/tours'));

export const upsertAdminTour = async (payload = {}) => {
  const normalizedPayload = {
    ...payload,
    price: Number(payload.price || 0),
    durationDays: Number(payload.durationDays || 0),
    capacity: Number(payload.capacity || 0),
    maxAltitudeM: Number(payload.maxAltitudeM || 0),
    trailDistanceKm: Number(payload.trailDistanceKm || 0),
    minGroupSize: Number(payload.minGroupSize || 0),
    maxGroupSize: Number(payload.maxGroupSize || 0),
    guide: {
      ...(payload.guide || {}),
      experienceYears: Number(payload.guide?.experienceYears || 0),
    },
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

// ---- Tours hero banner (admin) ----
export const getAdminTourBanners = async () => unwrapPayload(await api.get('/admin/tour-banners'));

export const upsertAdminTourBanner = async (payload = {}) => {
  const body = { ...payload, order: Number(payload.order || 0) };
  if (payload.id) {
    return unwrapPayload(await api.patch(`/admin/tour-banners/${payload.id}`, body));
  }
  return unwrapPayload(await api.post('/admin/tour-banners', body));
};

export const deleteAdminTourBanner = async (id) =>
  unwrapPayload(await api.delete(`/admin/tour-banners/${id}`));

export const createTourBannerDraft = () => ({
  id: '',
  category: 'yatra',
  imageUrl: '',
  heading: '',
  subheading: '',
  ctaLabel: '',
  ctaLink: '',
  isActive: true,
  order: 0,
});
