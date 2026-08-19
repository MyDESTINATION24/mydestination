import { sanitizeMongo } from './middlewares/sanitizeMongo.js';
import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import { createServer } from 'http';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Firebase
import { initializeFirebase } from './config/firebase.js';

// Cron Services
import './services/cronService.js';

// Route Imports
import authRoutes from './modules/auth/routes/authRoutes.js';
import userRoutes from './modules/user/routes/userRoutes.js';
import adminRoutes from './modules/admin/routes/adminRoutes.js';
import offerRoutes from './modules/marketing/routes/offerRoutes.js';
import walletRoutes from './modules/user/routes/walletRoutes.js';
import infoRoutes from './modules/marketing/routes/infoRoutes.js';
import contactRoutes from './modules/marketing/routes/contactRoutes.js';
import propertyRoutes from './modules/hotel/routes/propertyRoutes.js';
import bookingRoutes from './modules/hotel/routes/bookingRoutes.js';
import reviewRoutes from './modules/hotel/routes/reviewRoutes.js';
import paymentRoutes from './modules/payment/routes/paymentRoutes.js';
import availabilityRoutes from './modules/hotel/routes/availabilityRoutes.js';
import hotelRoutes from './modules/hotel/routes/hotelRoutes.js';
import hotelUIRoutes from './modules/hotel/routes/hotelUIRoutes.js';
import referralRoutes from './modules/referral/routes/referralRoutes.js';
import faqRoutes from './modules/marketing/routes/faqRoutes.js';
import partnerRoutes from './modules/partner/routes/partnerRoutes.js';
import blogRoutes from './modules/marketing/routes/blogRoutes.js';
import articleRoutes from './modules/marketing/routes/articleRoutes.js';
import vendorRoutes from './modules/vendor/routes/vendorRoutes.js';
import { taxiRouter } from './modules/taxi/routes/index.js';
import { configureTaxiSocketServer } from './modules/taxi/socket/index.js';
import { restoreScheduledDispatches } from './modules/taxi/services/dispatchService.js';
import weddingRoutes from './modules/wedding/routes/weddingRoutes.js';
import notificationRoutes from './modules/notification/routes/notificationRoutes.js';
import cmsRoutes from './modules/cms/routes/cmsRoutes.js';

// Global Process Handlers
process.on('unhandledRejection', (reason) => {
  console.error('❌ Unhandled Rejection:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
});

// Express Init
const app = express();

// Behind nginx, req.ip is the proxy's address unless this is set -- every
// client would share one rate-limit bucket and one user could lock out
// everybody. '1' trusts exactly one hop, which is the local reverse proxy.
app.set('trust proxy', 1);
const server = createServer(app);
const PORT = process.env.PORT || 5000;

// Initialize Firebase with try/catch
try {
  initializeFirebase();
  console.log('✅ Firebase initialized');
} catch (error) {
  console.error('❌ Firebase init failed:', error.message);
}

// A second Socket.IO server ran here on the default /socket.io path with no
// authentication at all. Its two handlers let any anonymous client join any
// room by name (join_tracking) and broadcast into any room (update_location),
// so a caller could both watch someone else's live location and inject a fake
// one. Nothing emitted or listened to those events -- the app connects only to
// the taxi server below, on /taxi/socket.io, which authenticates every socket
// and checks ride participation before joining a room.

// Taxi Socket Server Configuration
configureTaxiSocketServer(server);

// Middleware
app.use(morgan('dev'));
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] Incoming Request: ${req.method} ${req.url}`);
  next();
});
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
// Neutralise NoSQL operator injection ($ne, $gt, dotted paths) in the body
// and params before any handler runs. Must sit AFTER the parsers.
app.use(sanitizeMongo);

// The uploads directory is multer's scratch space before a file is pushed to
// Cloudinary, not a public asset store -- nothing builds a /uploads URL. Serving
// it exposed every temp file that outlived its upload (KYC documents among them)
// to anyone with the URL, and let an .html uploaded under an image mime type be
// served as HTML from the API origin. Cloudinary URLs are what the app uses.
// app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Robust CORS Middleware
app.use(cors({
  origin: function (origin, callback) {
    // No Origin header at all: native apps, curl, server-to-server.
    if (!origin) return callback(null, true);

    // An opaque origin arrives as the literal string 'null' -- this is what the
    // Flutter WebView sends when the document has no usable origin (local or
    // data: content, and after some redirects). It is truthy, so it used to
    // fall through to the allow-list, get rejected, and throw -- which the
    // error handler turned into a 500 on the CORS preflight. Every API call
    // from the app then failed before it was sent, which looked like the
    // session had died. Requests here carry a bearer token, not cookies, so
    // this is the same trust level as the no-Origin case above.
    if (origin === 'null' || origin === 'file://') return callback(null, true);

    const allowedOrigins = [
      'http://localhost:5173',
      'http://127.0.0.1:5173',
      'http://localhost:5174',
      'http://127.0.0.1:5174',
      'http://localhost:5175',
      'http://127.0.0.1:5175',
      'https://rukkoo.in',
      'https://www.rukkoo.in',
      'https://rukkoo-project.vercel.app',
      'https://rukooin-ijcelh2vj-appzetos-projects-73814664.vercel.app',
      'https://my-destination-nu.vercel.app',
      'https://mydestination.in',
      'https://www.mydestination.in'
    ];

    if (process.env.FRONTEND_URL) {
      allowedOrigins.push(process.env.FRONTEND_URL);
    }

    const isAllowed = allowedOrigins.includes(origin) ||
      origin.endsWith('.vercel.app') ||
      origin.endsWith('.onrender.com') ||
      origin.startsWith('http://192.168.') ||
      origin.startsWith('http://10.') ||
      origin.startsWith('http://172.') ||
      origin.includes('localhost') ||
      origin.includes('127.0.0.1');

    if (isAllowed) {
      callback(null, true);
    } else {
      console.log('Blocked by CORS:', origin);
      // Report it as 'not allowed' rather than throwing: an error here becomes
      // a 500 on the preflight, which reads as the API being broken instead of
      // the origin being refused. The browser still blocks the request.
      callback(null, false);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin']
}));

// Routes
app.get('/', (req, res) => {
  res.send({ message: 'Rukkoin API is running successfully' });
});

// Direct Health Check (Must be before infoRoutes)
app.get('/api/info/platform/status', (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'Server running successfully',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development'
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/offers', offerRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/info', infoRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/properties', propertyRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/availability', availabilityRoutes);
app.use('/api/hotels', hotelRoutes);
app.use('/api/hotel-ui', hotelUIRoutes);
app.use('/api/referrals', referralRoutes);
app.use('/api/faqs', faqRoutes);
app.use('/api/partners', partnerRoutes);
app.use('/api/blogs', blogRoutes);
app.use('/api/articles', articleRoutes);
app.use('/api/vendor', vendorRoutes);
app.use('/api/taxi', taxiRouter);
app.use('/api/v1', taxiRouter);
app.use('/api/wedding', weddingRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/cms', cmsRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('❌ Global Error Handler Catch-All:');
  console.error(`Error Message: ${err.message}`);
  console.error(`Stack Trace:\n${err.stack || 'No stack trace available'}`);
  if (err.details) {
    console.error('Details:', JSON.stringify(err.details, null, 2));
  }

  const statusCode = Number(err?.statusCode || err?.status || 500);
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
    details: err.details || undefined,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// MongoDB Connection Options
const mongoOptions = {
  serverSelectionTimeoutMS: 10000,
  socketTimeoutMS: 45000,
  family: 4,
  maxPoolSize: 10,
  minPoolSize: 2,
  retryWrites: true,
  retryReads: true,
};

// Database Connection and Server Listen
const connectWithRetry = async (retries = 5, delay = 5000) => {
  for (let i = 0; i < retries; i++) {
    try {
      const maskedUri = process.env.MONGODB_URL?.replace(/:([^@]+)@/, ':****@');
      console.log(`🔄 Attempting MongoDB connection... (Attempt ${i + 1}/${retries})`);
      console.log(`📍 Connecting to: ${maskedUri}`);

      await mongoose.connect(process.env.MONGODB_URL, mongoOptions);
      console.log('✅ MongoDB connected successfully');

      // Start server only after successful DB connection
      server.listen(PORT, () => {
        console.log(`🚀 Server is running on port ${PORT}`);
      });

      await restoreScheduledDispatches();
      return;
    } catch (err) {
      console.error(`❌ MongoDB connection attempt ${i + 1} failed:`, err.message);

      if (i < retries - 1) {
        console.log(`⏳ Retrying in ${delay / 1000} seconds...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        console.error('❌ All MongoDB connection attempts failed. Please check your setup.');
        process.exit(1);
      }
    }
  }
};

mongoose.connection.on('disconnected', () => {
  console.warn('⚠️ MongoDB disconnected. Attempting to reconnect...');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB connection error:', err.message);
});

mongoose.connection.on('reconnected', () => {
  console.log('✅ MongoDB reconnected successfully');
});

// Execute Connection
connectWithRetry();
