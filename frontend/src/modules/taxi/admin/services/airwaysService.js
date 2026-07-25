import api from '../../../shared/api/axiosInstance';

const unwrapPayload = (response) => response?.data || response || [];

const createId = (prefix = 'item') => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
};

const createHelicopterSeatClass = (overrides = {}) => ({
  id: createId('seat-class'),
  cabin: 'Helicopter Cabin',
  seatCode: 'HELI',
  seatCount: 6,
  fare: 8500,
  ...overrides,
});

const buildHelicopterSeatClasses = (payload = {}) => [
  createHelicopterSeatClass({
    seatCount: Number(payload.seatCapacity || 0),
    fare: Number(payload.basePrice || 0),
  }),
];

export const createAirwayDraft = () => ({
  id: '',
  airlineName: '',
  airlineCode: '',
  aircraftModel: 'Helicopter',
  registrationCode: '',
  baseAirport: '',
  pilotName: '',
  pilotPhone: '',
  seatCapacity: 6,
  basePrice: 8500,
  serviceTaxPercent: 5,
  status: 'active',
  notes: '',
  image: '',
  gallery: [],
  seatClasses: buildHelicopterSeatClasses({ seatCapacity: 6, basePrice: 8500 }),
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

export const createAirwayRouteDraft = () => ({
  id: '',
  airwayId: '',
  airwayIds: [],
  routeName: '',
  flightNumber: '',
  originAirport: '',
  destinationAirport: '',
  distanceKm: 0,
  durationMinutes: 45,
  departureTime: '09:00',
  arrivalTime: '09:45',
  operatingDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
  seatInventory: {
    'Helicopter Cabin': 6,
  },
  routeStatus: 'scheduled',
  isFeatured: false,
  notes: '',
  image: '',
  gallery: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

export const getAdminAirways = async () => unwrapPayload(await api.get('/admin/airways'));

export const upsertAdminAirway = async (payload = {}) => {
  const normalizedPayload = {
    ...payload,
    seatCapacity: Number(payload.seatCapacity || 0),
    basePrice: Number(payload.basePrice || 0),
    serviceTaxPercent: Number(payload.serviceTaxPercent || 0),
    seatClasses: buildHelicopterSeatClasses(payload),
  };

  if (payload.id) {
    return unwrapPayload(await api.patch(`/admin/airways/${payload.id}`, normalizedPayload));
  }

  return unwrapPayload(await api.post('/admin/airways', normalizedPayload));
};

export const deleteAdminAirway = async (airwayId) => unwrapPayload(await api.delete(`/admin/airways/${airwayId}`));

export const getAdminAirwayRoutes = async () => unwrapPayload(await api.get('/admin/airway-routes'));

export const upsertAdminAirwayRoute = async (payload = {}) => {
  const normalizedPayload = {
    ...payload,
    distanceKm: Number(payload.distanceKm || 0),
    durationMinutes: Number(payload.durationMinutes || 0),
  };

  if (payload.id) {
    return unwrapPayload(await api.patch(`/admin/airway-routes/${payload.id}`, normalizedPayload));
  }

  return unwrapPayload(await api.post('/admin/airway-routes', normalizedPayload));
};

export const deleteAdminAirwayRoute = async (routeId) => unwrapPayload(await api.delete(`/admin/airway-routes/${routeId}`));

export const getAdminAirwayBookings = async () => unwrapPayload(await api.get('/admin/airway-bookings'));

export const updateAdminAirwayBookingStatus = async (bookingId, bookingStatus) =>
  unwrapPayload(await api.patch(`/admin/airway-bookings/${bookingId}/status`, { status: bookingStatus }));

export const getUserAirwayRoutes = async (filters = {}) =>
  unwrapPayload(await api.get('/users/airways/search', { params: filters }));

export const getUserAirwayRoute = async (routeId) =>
  unwrapPayload(await api.get(`/users/airways/routes/${routeId}`));

export const getUserAirwayBooking = async (bookingId) =>
  unwrapPayload(await api.get(`/users/airways/bookings/${bookingId}`));

export const getUserAirwayBookings = async (params = {}) =>
  unwrapPayload(await api.get('/users/airways/bookings', { params }));

export const createUserAirwayBooking = async (payload = {}) =>
  unwrapPayload(await api.post('/users/airways/bookings', payload));

export const createUserAirwayBookingOrder = async (payload = {}) =>
  unwrapPayload(await api.post('/users/airways/bookings/order', payload));

export const verifyUserAirwayBookingPayment = async (payload = {}) =>
  unwrapPayload(await api.post('/users/airways/bookings/verify', payload));
