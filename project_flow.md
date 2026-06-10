# Detailed Project Flow Document

## Project Overview
My DESTINATION is a comprehensive multi-service aggregator built on the MERN stack (MongoDB, Express.js, React.js, Node.js). The architecture is highly modular, integrating distinct business verticals: **Hotel/Property Bookings**, **Wedding Planning & Venues**, and **Taxi Services**. 

The frontend relies on React with Vite, utilizing React Router for complex navigation guards across different modules. The backend employs a scalable Express.js architecture with domain-driven modules, utilizing JWT for stateless authentication, Cloudinary for media storage, and Socket.io for live tracking (e.g., taxi drivers).

## User Roles
The system accommodates several distinct user roles, each with specialized access:
1. **User**: End-customers who book hotels, hire wedding vendors, or request taxi rides.
2. **Partner**: Property owners/managers (Hotels, Villas, PGs, Resorts) who list and manage their inventory.
3. **Vendor**: Wedding professionals (Planners, Photographers, Venues) providing services.
4. **Driver**: Taxi drivers executing ride requests.
5. **Admin / Superadmin**: Platform administrators overseeing approvals, moderation, finances, and platform settings.
6. **CMS Admin**: Administrators restricted to managing website content (Banners, Destinations, Footer text).

## Authentication Flow
*(Note: As requested, here is the flow from the User's perspective)*

1. **Initiation**: The user navigates to `/login` or `/signup`.
2. **Input**: The user enters their 10-digit mobile number.
3. **Validation**: The backend checks if the user exists. If registering, the backend ensures the phone/email isn't already registered.
4. **OTP Generation**: A 6-digit OTP is generated and sent via SMS. *(Test numbers bypass this and default to `123456`)*.
5. **Verification**: The user submits the OTP. The backend validates it against the `Otp` collection.
6. **Session Creation**: Upon success, a JWT token is generated.
7. **Storage**: The token and user profile data are saved in the browser's `localStorage` (`token` and `user` keys).
8. **Redirection**: The user is navigated to `/home` or back to the page they were attempting to access.

## Route Flow
Routing is strictly guarded based on user roles using customized React components.
- **Public Routes**: `/` (Landing), `/search`, `/about`, `/contact`. Accessible without login.
- **User Routes**: `/home`, `/bookings`, `/wallet`, `/checkout`. Guarded by `UserProtectedRoute` (redirects to `/login` if no token).
- **Partner Routes**: `/hotel/login` -> `/hotel/dashboard`, `/hotel/inventory`. Guarded by `PartnerProtectedRoute`.
- **Vendor Routes**: `/wedding/vendor/login` -> `/wedding/vendor/dashboard`. Guarded by `WeddingVendorProtectedRoute` (Checks subscription status).
- **Admin Routes**: `/admin/login` -> `/admin/dashboard`. Uses `adminToken` in storage.

## Dashboard Flow
- **User Dashboard**: Focused on consumption. Users navigate to view active bookings, wallet balances, saved properties, and profile settings.
- **Partner Dashboard**: Focused on management. Partners view property inventory, manage room availability, process incoming bookings, and check KYC status.
- **Admin Dashboard**: Focused on oversight. Admins view total users, approve pending Partner/Vendor applications, track platform revenue, and manage support tickets.

## Database Flow
The MongoDB database uses Mongoose models grouped by domain. 
- **Core Collections**: `Users`, `Partners`, `Admins`, `Hotels`, `Bookings`, `Transactions`, `Wallets`.
- **Relationships**:
  - A `Booking` document references a `User` (the customer) and a `Hotel`/`Partner` (the provider).
  - A `Transaction` references a `Wallet`, tying financial movements directly to users or partners.
  - The `Otp` collection acts as a temporary store for verification before creating an actual user document.

## API Flow
1. **Frontend Request**: The React app makes an Axios call to `/api/...`.
2. **Interceptor**: The Axios interceptor attaches `Authorization: Bearer <token>` from `localStorage`.
3. **Middleware**: Express `authMiddleware.js` intercepts the request, verifies the JWT using the secret key, and extracts the user ID and role.
4. **Database Query**: The middleware fetches the user/partner from the database and attaches them to `req.user`.
5. **Controller**: The specific controller processes the business logic and returns a JSON response.

## Current Issues
The current authentication architecture faces a critical limitation regarding simultaneous panel logins:
1. **Shared LocalStorage Keys**: The User, Partner, and Vendor panels all save their session using the exact same keys in `localStorage`: `token` and `user`.
2. **Session Overwriting**: If a property owner is logged in as a "Partner" and opens a new tab to browse as a regular "User" (to book a flight/hotel), logging into the User panel will overwrite their Partner token. 
3. **Aggressive Guards**: Because the token is overwritten, the frontend guards (like `PartnerProtectedRoute`) will detect a "User" token trying to access a "Partner" page and will aggressively redirect them or force a logout, creating a frustrating loop.
4. **Token Expiry**: JWT tokens are generated without an `expiresIn` payload, meaning sessions never expire automatically.

## Recommended Solution
To enable seamless panel switching without forcing logouts, implement isolated storage contexts:
1. **Prefix Storage Keys**: Change the frontend and API logic to use distinct keys for each role:
   - User: `user_token`, `user_data`
   - Partner: `partner_token`, `partner_data`
   - Vendor: `vendor_token`, `vendor_data`
2. **Update Axios Interceptors**: Modify the API service to pull the correct token based on the route being accessed (e.g., if hitting `/api/partners/*`, send the `partner_token`).
3. **Independent Contexts**: Use separate React Contexts (`UserAuthContext`, `PartnerAuthContext`) so the UI can accurately reflect if someone is logged in as both simultaneously without state collisions.

## Professional Industry Standard Approach
For a truly scalable, enterprise-grade application:
1. **HttpOnly Cookies**: Ditch `localStorage` entirely for authentication. Store JWTs in `HttpOnly`, `Secure` cookies. This prevents Cross-Site Scripting (XSS) attacks from stealing tokens.
2. **Access & Refresh Tokens**: Implement short-lived Access Tokens (e.g., 15 minutes) and long-lived Refresh Tokens (e.g., 7 days). This improves security while maintaining persistent logins.
3. **API Gateway & RBAC**: Implement strict Role-Based Access Control (RBAC) at the network layer. Ensure that an endpoint designated for partners outright rejects requests signed with a user token at the middleware level, preventing any horizontal privilege escalation.

---

### Detailed Flowchart (User Journey)

```text
[START: User Opens App]
       |
       v
[Guards Check localStorage for 'token']
       |
       +--> (No Token) ---> [Redirect to /login]
       |                           |
       |                           v
       |                  [Enter Phone Number]
       |                           |
       |                           v
       |                  [API: /api/auth/send-otp]
       |                           |
       |                           v
       |                  [Receive SMS & Enter OTP]
       |                           |
       |                           v
       |                  [API: /api/auth/verify-otp]
       |                           |
       |                           v
       |                  [Save 'token' to localStorage]
       |                           |
       +<--------------------------+
       |
       v
[User Dashboard / Home] ---> (Browse /search, View Hotels)
       |
       v
[Select Hotel] ---> [View details, Rooms, Prices]
       |
       v
[Initiate Booking] ---> [Checkout Page / Payment Gateway]
       |
       v
[Booking Confirmation] ---> [API: /api/bookings/create]
       |
       v
[Manage in /bookings] ---> [End of Primary Journey]
```
