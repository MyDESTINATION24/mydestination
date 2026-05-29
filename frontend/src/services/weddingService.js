import { api } from './apiService';

export const weddingService = {
  getDestinations: async () => {
    try {
      const response = await api.get('/wedding/destinations');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  getCategories: async () => {
    try {
      const response = await api.get('/wedding/categories');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  getVenues: async (destinationId) => {
    try {
      const url = destinationId ? `/wedding/venues?destinationId=${destinationId}` : '/wedding/venues';
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  createEnquiry: async (enquiryData) => {
    try {
      const response = await api.post('/wedding/enquiry', enquiryData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  getVendorDashboardStats: async () => {
    try {
      const response = await api.get('/wedding/vendor/dashboard/stats');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  incrementView: async (type, id) => {
    try {
      const response = await api.patch(`/wedding/increment-view/${type}/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Admin Services
  getAdminSubscriptions: async () => {
    try {
      const response = await api.get('/wedding/admin/subscriptions');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
  
  createSubscriptionPlan: async (data) => {
    try {
      const response = await api.post('/wedding/admin/subscriptions', data);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
  
  updateSubscriptionPlan: async (id, data) => {
    try {
      const response = await api.patch(`/wedding/admin/subscriptions/${id}`, data);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
  
  deleteSubscriptionPlan: async (id) => {
    try {
      const response = await api.delete(`/wedding/admin/subscriptions/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  getAdminStats: async () => {
    try {
      const response = await api.get('/wedding/admin/stats');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  getAdminEnquiries: async (params = {}) => {
    try {
      const response = await api.get('/wedding/admin/enquiries', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  updateEnquiryStatus: async (id, status) => {
    try {
      const response = await api.patch(`/wedding/admin/enquiries/${id}/status`, { status });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  deleteEnquiry: async (id) => {
    try {
      const response = await api.delete(`/wedding/admin/enquiries/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  getAdminCustomers: async () => {
    try {
      const response = await api.get('/wedding/admin/customers');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  updateCustomerBlockStatus: async (id, isBlocked) => {
    try {
      const response = await api.patch(`/wedding/admin/customers/${id}/block`, { isBlocked });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  deleteCustomer: async (id) => {
    try {
      const response = await api.delete(`/wedding/admin/customers/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  getGallery: async (params = {}) => {
    try {
      const response = await api.get('/wedding/gallery', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  addGalleryImage: async (formData) => {
    try {
      const response = await api.post('/wedding/admin/gallery', formData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  deleteGalleryImage: async (id) => {
    try {
      const response = await api.delete(`/wedding/admin/gallery/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  getRealWeddings: async () => {
    try {
      const response = await api.get('/wedding/real-weddings');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  addRealWedding: async (data) => {
    try {
      const response = await api.post('/wedding/admin/real-weddings', data);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  deleteRealWedding: async (id) => {
    try {
      const response = await api.delete(`/wedding/admin/real-weddings/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  getAdminVenues: async () => {
    try {
      const response = await api.get('/wedding/admin/venues');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  updateVenueStatus: async (id, status) => {
    try {
      const response = await api.patch(`/wedding/admin/venues/${id}/status`, { status });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  getAdminVendors: async () => {
    try {
      const response = await api.get('/wedding/admin/vendors');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  updateVendorStatus: async (id, status) => {
    try {
      const response = await api.patch(`/wedding/admin/vendors/${id}/status`, { status });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  addDestination: async (data) => {
    try {
      const response = await api.post('/wedding/admin/destinations', data);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  updateDestination: async (id, data) => {
    try {
      const response = await api.patch(`/wedding/admin/destinations/${id}`, data);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  deleteDestination: async (id) => {
    try {
      const response = await api.delete(`/wedding/admin/destinations/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
  
  addCategory: async (data) => {
    try {
      const response = await api.post('/wedding/admin/categories', data);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  updateCategory: async (id, data) => {
    try {
      const response = await api.patch(`/wedding/admin/categories/${id}`, data);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  deleteCategory: async (id) => {
    try {
      const response = await api.delete(`/wedding/admin/categories/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  getAdminFinancials: async () => {
    try {
      const response = await api.get('/wedding/admin/financials');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  getPlatformSettings: async () => {
    try {
      const response = await api.get('/wedding/admin/settings/financial');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  updatePlatformSettings: async (data) => {
    try {
      const response = await api.patch('/wedding/admin/settings/financial', data);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Vendor Venue Methods
  createVendorVenue: async (data) => {
    try {
      const response = await api.post('/wedding/vendor/venues', data);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  getVendorVenues: async () => {
    try {
      const response = await api.get('/wedding/vendor/venues');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  updateVendorVenue: async (id, data) => {
    try {
      const response = await api.put(`/wedding/vendor/venues/${id}`, data);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  deleteVendorVenue: async (id) => {
    try {
      const response = await api.delete(`/wedding/vendor/venues/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Testimonials
  getTestimonials: async () => {
    try {
      const response = await api.get('/wedding/testimonials');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  submitTestimonial: async (data) => {
    try {
      const response = await api.post('/wedding/testimonials', data);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  getAdminTestimonials: async () => {
    try {
      const response = await api.get('/wedding/admin/testimonials');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  updateTestimonialStatus: async (id, status) => {
    try {
      const response = await api.patch(`/wedding/admin/testimonials/${id}/status`, { status });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  deleteTestimonial: async (id) => {
    try {
      const response = await api.delete(`/wedding/admin/testimonials/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  getMyEnquiries: async () => {
    try {
      const response = await api.get('/wedding/my-enquiries');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  getAdminSupportTickets: async () => {
    try {
      const response = await api.get('/wedding/admin/support');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  resolveSupportTicket: async (id) => {
    try {
      const response = await api.patch(`/wedding/admin/support/${id}/resolve`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  resolveAllSupportTickets: async () => {
    try {
      const response = await api.post('/wedding/admin/support/resolve-all');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  createSupportTicket: async (data) => {
    try {
      const response = await api.post('/wedding/support', data);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  replyToSupportTicket: async (id, reply) => {
    try {
      const response = await api.patch(`/wedding/admin/support/${id}/reply`, { reply });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  getTicketById: async (ticketId) => {
    try {
      const response = await api.get(`/wedding/support/${ticketId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Vendor Subscription Methods
  getActiveSubscriptions: async () => {
    try {
      const response = await api.get('/wedding/subscriptions');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  purchaseSubscription: async (data) => {
    try {
      const response = await api.post('/wedding/payment/subscription', data);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Vendor Wallet Methods
  getVendorWallet: async () => {
    try {
      const response = await api.get('/wedding/vendor/wallet');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  addMoneyToWallet: async (amount) => {
    try {
      const response = await api.post('/wedding/payment/wallet-topup', { amount });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  payAndBookEnquiry: async (enquiryId) => {
    try {
      const response = await api.post(`/wedding/payment/booking/${enquiryId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
};
