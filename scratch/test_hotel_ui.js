const API_BASE = 'http://localhost:5000/api/hotel-ui';

async function testHotelUIAPI() {
  console.log('--- Testing Hotel UI API Endpoints ---');

  try {
    // 1. Test GET settings for a new hotel (should return default config)
    const testHotelId = 'test-hotel-999';
    console.log(`\n1. Fetching settings for ${testHotelId}...`);
    const res1 = await fetch(`${API_BASE}/settings/${testHotelId}`);
    const data1 = await res1.json();
    console.log('GET Response:', data1);

    // 2. Test PUT update settings
    console.log(`\n2. Updating settings for ${testHotelId}...`);
    const updatePayload = {
      theme: {
        primaryColor: '#8B5CF6',
        secondaryColor: '#0F172A',
        borderRadius: '20px',
        fontFamily: 'Inter, sans-serif'
      },
      heroBanner: {
        bannerUrl: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb',
        title: 'Royal Heritage Resort & Spa',
        subTitle: 'Unmatched luxury amidst serenity'
      },
      activeServices: {
        roomService: true,
        spaBooking: true,
        cabBooking: false,
        laundryService: true,
        diningBooking: true,
        eventHall: true
      },
      customAnnouncement: {
        enabled: true,
        text: '🎉 Welcome Drink Free for All Online Bookings Today!'
      }
    };

    const res2 = await fetch(`${API_BASE}/settings/${testHotelId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatePayload)
    });
    const data2 = await res2.json();
    console.log('PUT Response:', data2);

    // 3. Re-Fetch GET settings to verify persistence
    console.log(`\n3. Re-Fetching updated settings for ${testHotelId}...`);
    const res3 = await fetch(`${API_BASE}/settings/${testHotelId}`);
    const data3 = await res3.json();
    console.log('Final GET Response:', data3);

  } catch (err) {
    console.error('API Test Error:', err);
  }
}

testHotelUIAPI();
