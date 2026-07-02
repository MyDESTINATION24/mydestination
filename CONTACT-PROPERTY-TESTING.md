# Contact Property – Manual Test Checklist

Use this to verify "Contact Property" works on Booking Confirmation and no other behaviour is affected.

## What was fixed
- **Contact number**: Shownfgfgfgfh from property (partner-entered) first; if missing, from partner account phone.
- **Backend**: All paths that send booking to the confirmation page now include `property.contactNumber` and/or `property.partnerId.phone`.
- **Frontend**: Renders a `tel:` link when a number exists; shows disabled "Number not available" only when neither exists.

---

## Test cases

### 1. After checkout (Pay at Hotel)
- [ ] Complete a booking with "Pay at Hotel".
- [ ] On confirmation page, "Contact Property" is a **link** (click opens dial pad / call).
- [ ] Directions, print, booking details, payment summary unchanged.

### 2. After online payment (Razorpay)
- [ ] Complete a booking with "Pay Now" and successful payment.
- [ ] On confirmation page, "Contact Property" is a **link**.
- [ ] Same as above for other elements.

### 3. From My Bookings
- [ ] Go to My Bookings and open any confirmed booking.
- [ ] On confirmation page, "Contact Property" is a **link** (number comes from list API).
- [ ] No console errors; data loads as before.

### 4. Direct URL / Refresh
- [ ] Open confirmation via direct URL: `/booking/<bookingId>` (logged in as that user).
- [ ] "Contact Property" is a **link**.
- [ ] Page load and other behaviour unchanged.

### 5. No number (edge case)
- [ ] If a property has no contact number and partner has no phone in DB, "Contact Property" shows as disabled **button** with "Number not available".
- [ ] No crash; rest of page works.

### 6. No regression
- [ ] Directions button still opens maps.
- [ ] Print works.
- [ ] Cancel booking (if allowed) works.
- [ ] My Bookings navigation works.
- [ ] Payment summary and amounts unchanged.

---

## Backend verification (optional)

Ensure these endpoints return `propertyId` with either `contactNumber` or populated `partnerId.phone`:

- `POST /api/bookings` (createBooking) → response.booking.propertyId
- `GET /api/bookings/my` (getMyBookings) → each booking.propertyId
- `GET /api/bookings/:id` (getBookingDetail) → booking.propertyId
- Payment verify response (after Razorpay success) → booking.propertyId

In each case, `propertyId.partnerId` should be an object with `phone` when populated.
