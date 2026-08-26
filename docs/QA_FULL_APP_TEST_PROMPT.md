# Full-App Booking & Flow Audit — Agent Prompt

Copy everything below the line into a fresh agent session.

---

You are auditing **MyDestination** (https://mydestination.in, API https://api.mydestination.in),
a multi-module super-app: taxi/ride, parcel, pooling, bus, airways/helicopter,
tours & treks, hotels, and weddings. Backend is Express + MongoDB on a VPS;
frontend is React/Vite on Vercel.

## Your job

Act as a **real user** and complete **every booking flow end to end, one at a
time**. Do not read the code and reason about whether a flow works — run it and
report what actually happened. Then do the same for each operator role.

## Non-negotiable rules

1. **Evidence over assertion.** Every claim needs proof: the HTTP request/response,
   a DB document, a screenshot, or a log line. "It looks right" is not a result.
2. **Never say something works if you did not complete it.** If a flow is blocked,
   say exactly where it stopped and why. A blocked flow is a finding, not a failure
   of the audit.
3. **Nothing may be static.** Anything a user sees that an admin can configure must
   come from the API. If a price, address, phone, banner, vehicle type, fare rule or
   plan is hardcoded in the frontend, that is a defect — report the file and line.
4. **Payments must be real.** For any paid booking, prove that:
   - a Razorpay (or PhonePe) **order was created server-side**,
   - the **signature was verified server-side** after payment,
   - the **amount was recomputed on the server** and not taken from the client,
   - a **tampered amount is rejected** (send a lower amount and show the failure),
   - the booking is only created/confirmed **after** verification succeeds.
5. **No test backdoors may work in production.** Verify that static/fixed OTPs and
   any debug fields are inert. Report any that are not.
6. **Do not use another person's account or real payment credentials.** Use test
   accounts. For live payment checks use the smallest possible real amount, or the
   gateway's test mode, and say which you used.

## Flows to complete (one at a time, in order)

For each: sign up fresh where possible, complete the booking, verify the record in
the DB, verify the operator side received it, then cancel/complete it.

**Customer**
- Ride: select pickup/drop → fare quote → book → driver receives request → accept →
  arrive → OTP → start → complete → payment → rating
- Parcel/delivery: same, plus goods type and weight rules
- Pooling: route selection, seat reservation, capacity limits
- Bus: seat map, seat lock, double-booking prevention
- Airways/helicopter: sector selection, passenger details, payment
- Tours & treks: capacity/slots, date, payment, My Bookings
- Hotels: search → property → checkout → payment → confirmation
- Wedding: vendor discovery → enquiry → vendor receives it

**Operators**
- Driver: register (all roles: driver, owner, bus, pooling, service centre), login,
  approval gating, go online, receive request, wallet top-up (Razorpay), payout
- Owner: fleet, drivers, bus services, bookings
- Service centre: staff invite → staff signs in → bookings
- Vendor (wedding): subscription purchase via Razorpay, leads quota decrementing
- Admin: approve/reject each of the above; confirm the change is visible to the user

## Specific traps to check (these have all been real defects here)

- **Session bleed:** sign in as a customer, then as a driver/partner/vendor on the
  same device, then return. Both sessions must survive. Nobody may be redirected
  into a portal they did not ask for, and nobody may be silently logged out.
- **Role confusion:** an account that is *also* a vendor or hotel partner must still
  be able to use the customer app and the taxi module.
- **Fare tampering:** attempt each booking with a modified fare/amount in the request
  body. The server must reject or recompute. Report anything it accepts.
- **IDOR:** try reading another user's booking/ride/invoice by changing the id, and
  try calling user endpoints with no token at all.
- **OTP:** confirm the OTP is not returned in any API response, that wrong guesses
  are capped, and that repeated sends are rate limited.
- **Admin-managed content:** change an address, phone, banner, vehicle icon, price
  and plan in the admin panel, then confirm each one changes in the app.
- **Live tracking:** the vehicle marker must move continuously along the road, point
  the way it is travelling, and survive the socket dropping (background the app for
  three minutes, then return).

## Report format

For each flow, one block:

```
FLOW: <name>
RESULT: PASS | FAIL | BLOCKED
STEPS COMPLETED: <what you actually did>
EVIDENCE: <request/response, ids, screenshots, log lines>
DEFECTS: <each with severity, reproduction steps, and file:line if known>
```

Finish with a single ranked list of every defect found, most severe first, and state
plainly which flows you could **not** complete and why.
