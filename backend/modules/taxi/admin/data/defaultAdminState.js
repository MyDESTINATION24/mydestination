import mongoose from 'mongoose';

const objectId = () => new mongoose.Types.ObjectId().toString();

export const createDefaultAdminState = () => {
  const indoreId = objectId();
  const delhiId = objectId();
  const sedanId = objectId();
  const suvId = objectId();
  const bikeId = objectId();
  const miniTruckId = objectId();
  const ownerOneId = objectId();

  return {
    deletedUsers: [],
    languages: [
      { name: 'English', code: 'en', active: 1, default_status: 1 },
      { name: 'Hindi', code: 'hi', active: 1, default_status: 0 },
      { name: 'Arabic', code: 'ar', active: 0, default_status: 0 },
    ],
    rideModules: [
      { transport_type: 'taxi' },
      { transport_type: 'delivery' },
      { transport_type: 'intercity' },
    ],
    appModules: [
      {
        name: 'Taxi Service',
        transport_type: 'taxi',
        service_type: 'normal',
        order_by: 1,
        short_description: 'Core ride hailing',
        description: 'Standard intra-city taxi booking experience.',
        active: true,
        mobile_menu_icon: 'https://cdn.jsdelivr.net/gh/tabler/tabler-icons/icons/car.svg',
      },
      {
        name: 'Parcel Delivery',
        transport_type: 'delivery',
        service_type: 'normal',
        order_by: 2,
        short_description: 'Send packages fast',
        description: 'Door to door parcel logistics.',
        active: true,
        mobile_menu_icon: 'https://cdn.jsdelivr.net/gh/tabler/tabler-icons/icons/package.svg',
      },
    ],
    notificationChannels: [
      {
        name: 'Ride Assigned',
        topic_name: 'Ride Assigned',
        description: 'Notify when a ride gets assigned.',
        push_notification: true,
        mail: false,
        for_user: true,
      },
      {
        name: 'Payout Settled',
        topic_name: 'Payout Settled',
        description: 'Notify driver after settlement.',
        push_notification: true,
        mail: true,
        for_user: false,
      },
    ],
    subscriptionPlans: [
      {
        name: 'Daily Sedan Booster',
        description: 'Best for active city cab drivers.',
        amount: 149,
        duration: 1,
        transport_type: 'taxi',
        vehicle_type_id: sedanId,
        service_location_id: indoreId,
        how_it_works: 'Pay once per day and unlock lower commission.',
        active: true,
      },
      {
        name: 'Weekly Delivery Pro',
        description: 'Built for mini-truck logistics partners.',
        amount: 699,
        duration: 7,
        transport_type: 'delivery',
        vehicle_type_id: miniTruckId,
        service_location_id: delhiId,
        how_it_works: 'Flat weekly pass for delivery operations.',
        active: true,
      },
    ],
    preferences: [
      {
        name: 'Pet Friendly',
        icon: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><rect rx="16" width="64" height="64" fill="%23EEF2FF"/><text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle" font-size="28">P</text></svg>',
        active: 1,
      },
      {
        name: 'Extra Luggage',
        icon: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><rect rx="16" width="64" height="64" fill="%23FEF3C7"/><text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle" font-size="28">L</text></svg>',
        active: 1,
      },
    ],
    roles: [
      { name: 'Operations Manager', slug: 'operations-manager', description: 'Runs day to day dispatch and support.' },
      { name: 'Finance Analyst', slug: 'finance-analyst', description: 'Monitors payouts and reconciliations.' },
    ],
    paymentGateways: [
      { name: 'Razorpay', slug: 'razorpay', active: true },
      { name: 'Stripe', slug: 'stripe', active: true },
      { name: 'PayPal', slug: 'paypal', active: false },
    ],
    onboardingScreens: [
      {
        audience: 'user',
        screen: 'user',
        order: 1,
        title: 'Book Rides Faster',
        description: 'Save places, pick vehicle types, and ride in seconds.',
        active: true,
      },
      {
        audience: 'driver',
        screen: 'driver',
        order: 1,
        title: 'Drive On Your Schedule',
        description: 'Go online when ready and track earnings live.',
        active: true,
      },
      {
        audience: 'owner',
        screen: 'owner',
        order: 1,
        title: 'Scale Your Fleet',
        description: 'Manage vehicles, drivers, and payouts from one panel.',
        active: true,
      },
    ],
    serviceLocations: [
      {
        _id: indoreId,
        name: 'Indore',
        service_location_name: 'Indore',
        address: 'Indore, Madhya Pradesh, India',
        country: 'India',
        currency_name: 'Indian Rupee',
        currency_symbol: '₹',
        currency_code: 'INR',
        timezone: 'Asia/Kolkata',
        unit: 'km',
        latitude: 22.7196,
        longitude: 75.8577,
        status: 'active',
        active: true,
      },
      {
        _id: delhiId,
        name: 'New Delhi',
        service_location_name: 'New Delhi',
        address: 'New Delhi, Delhi, India',
        country: 'India',
        currency_name: 'Indian Rupee',
        currency_symbol: '₹',
        currency_code: 'INR',
        timezone: 'Asia/Kolkata',
        unit: 'km',
        latitude: 28.6139,
        longitude: 77.209,
        status: 'active',
        active: true,
      },
    ],
  };
};
