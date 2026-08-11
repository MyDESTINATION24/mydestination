import { Server } from 'socket.io';
import { env } from '../../../config/env.js';
import { normalizePoint, toPoint } from '../../../utils/geo.js';
import { Driver } from '../driver/models/Driver.js';
import {
  broadcastSupportMessage,
  createSupportMessage,
  getSupportParticipantRoom,
  getSupportRoom,
  getSupportRoleRoom,
  markSupportMessagesAsRead,
  parseSupportConversationKey,
  setSupportChatServer,
} from '../chat/services/supportChatService.js';
import {
  addSocketSubscriptions,
  joinRideRoom,
  markDriverRejectedFromDispatch,
  notifyLateAvailableDriver,
  notifyRideAccepted,
  notifyRideBidUpdated,
  setSocketServer,
  startDispatchFlow,
} from '../services/dispatchService.js';
import { findZoneByPickup } from '../services/matchingService.js';
import { acceptRideAssignment, createRideRecord, getRideRoom, submitRideBid } from '../services/rideService.js';
import { SOCKET_EVENTS } from './events.js';
import { registerRideSocketHandlers } from './handlers/rideSocketHandler.js';
import { authorizeRideRoomAccess } from './middleware/rideRoomAuth.js';
import { attachSocketAuth } from './middleware/socketAuth.js';
import { clearDriverRoute } from './services/driverRouteService.js';

const onAsync = (socket, handler) => async (payload = {}) => {
  try {
    await handler(payload);
  } catch (error) {
    socket.emit('errorMessage', {
      message: error.message || 'Socket operation failed',
    });
  }
};

export const configureTaxiSocketServer = (httpServer) => {
  const io = new Server(httpServer, {
    path: '/taxi/socket.io',
    // A backgrounded Android WebView throttles JS timers, so the client stops
    // answering pings and the default 20s pingTimeout drops a driver who is
    // simply waiting with the screen off. A long timeout with a slower ping
    // rides that out.
    pingInterval: 20000,
    pingTimeout: 60000,
    // The real fix for a socket that dies mid-search: on reconnect within the
    // window, Socket.IO restores the session's rooms AND replays the events
    // missed while it was gone -- so a ride request emitted during a two
    // minute dropout still lands instead of vanishing.
    connectionStateRecovery: {
      maxDisconnectionDuration: 2 * 60 * 1000,
      skipMiddlewares: false,
    },
    cors: {
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        const allowedOrigins = [
          'http://localhost:5173',
          'http://127.0.0.1:5173',
          'http://localhost:5174',
          'http://127.0.0.1:5174',
          'http://localhost:5175',
          'http://127.0.0.1:5175',
          'https://rukkoo.in',
          'https://www.rukkoo.in',
          'https://mydestination.in',
          'https://www.mydestination.in'
        ];
        if (env.corsOrigin && env.corsOrigin !== '*') {
          env.corsOrigin.split(',').forEach((o) => {
            const trimmed = o.trim();
            if (trimmed && !allowedOrigins.includes(trimmed)) {
              allowedOrigins.push(trimmed);
            }
          });
        }
        const isAllowed =
          env.corsOrigin === '*' ||
          allowedOrigins.includes(origin) ||
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
          callback(new Error('Not allowed by CORS'));
        }
      },
      credentials: true,
    },
  });

  attachSocketAuth(io);
  setSocketServer(io);
  setSupportChatServer(io);

  io.on('connection', async (socket) => {
    const identity = socket.auth;

    // Registered before the awaits below: this handler exists purely to prove
    // the transport is alive, so it must not be missable during connection
    // setup. Events that arrive before their listener is attached are dropped.
    socket.on('client:health', (ack) => {
      if (typeof ack === 'function') {
        ack({ ok: true, at: Date.now() });
      }
    });

    addSocketSubscriptions(socket, { role: identity.role, entityId: identity.sub });

    socket.join(getSupportParticipantRoom(identity.role, identity.sub));
    socket.join(getSupportRoleRoom(identity.role));

    if (identity.role === 'driver') {
      await Driver.findByIdAndUpdate(identity.sub, { socketId: socket.id });
      notifyLateAvailableDriver(identity.sub).catch((error) => {
        console.error('Failed to notify late-available driver on socket connect', error);
      });
    }

    socket.on('chat:join', ({ conversationKey }) => {
      if (conversationKey) {
        const parsed = parseSupportConversationKey(conversationKey);

        if (parsed) {
          for (const key of parsed.keys) {
            socket.join(getSupportRoom(key));
          }
          return;
        }

        socket.join(getSupportRoom(conversationKey));
      }
    });

    socket.on(
      'chat:send',
      onAsync(socket, async ({ message, receiverRole, receiverId, conversationKey }) => {
        let nextReceiverRole = receiverRole;
        let nextReceiverId = receiverId;

        if (identity.role === 'admin' && (!nextReceiverRole || !nextReceiverId) && conversationKey) {
          const parsed = parseSupportConversationKey(conversationKey);
          nextReceiverRole = parsed?.peerRole;
          nextReceiverId = parsed?.peerId;
        }

        const savedMessage = await createSupportMessage({
          senderRole: identity.role,
          senderId: identity.sub,
          receiverRole: nextReceiverRole,
          receiverId: nextReceiverId,
          conversationKey,
          message,
        });

        broadcastSupportMessage(savedMessage);
      }),
    );

    socket.on(
      'chat:read',
      onAsync(socket, async ({ conversationKey }) => {
        if (!conversationKey) {
          return;
        }

        await markSupportMessagesAsRead({
          role: identity.role,
          id: identity.sub,
          conversationKey,
        });
      }),
    );

    socket.on(
      'joinRide',
      onAsync(socket, async ({ rideId }) => {
        if (!rideId) {
          return;
        }

        await authorizeRideRoomAccess({ socket, rideId });
        joinRideRoom(socket, rideId);
      }),
    );

    registerRideSocketHandlers({ io, socket, onAsync });

    socket.on(
      'locationUpdate',
      onAsync(socket, async ({ coordinates }) => {
        if (identity.role !== 'driver') {
          return;
        }

        // Drivers push fresh GPS coordinates every few seconds so matching stays accurate.
        const normalizedCoords = normalizePoint(coordinates, 'coordinates');
        const zone = await findZoneByPickup(normalizedCoords);

        await Driver.findByIdAndUpdate(identity.sub, {
          socketId: socket.id,
          location: toPoint(normalizedCoords, 'coordinates'),
          zoneId: zone?._id || null,
        });
        notifyLateAvailableDriver(identity.sub).catch((error) => {
          console.error('Failed to notify late-available driver on location update', error);
        });
      }),
    );

    socket.on(
      'requestRide',
      onAsync(socket, async ({ pickup, drop, fare, estimatedDistanceMeters, estimatedDurationMinutes, vehicleTypeId, vehicleIconType, paymentMethod, serviceType, intercity }) => {
        if (identity.role !== 'user') {
          return;
        }

        // Ride creation and dispatch share the same service path as the REST controller.
        const ride = await createRideRecord({
          userId: identity.sub,
          pickupCoords: normalizePoint(pickup, 'pickup'),
          dropCoords: normalizePoint(drop, 'drop'),
          fare: Number(fare || 0),
          estimatedDistanceMeters: Number(estimatedDistanceMeters || 0),
          estimatedDurationMinutes: Number(estimatedDurationMinutes || 0),
          vehicleTypeId,
          vehicleIconType,
          paymentMethod,
          serviceType,
          intercity,
        });

        joinRideRoom(socket, ride._id);
        await startDispatchFlow(ride);

        socket.emit('rideCreated', {
          rideId: String(ride._id),
          room: getRideRoom(ride._id),
          status: ride.status,
        });

        socket.emit(SOCKET_EVENTS.RIDE_JOINED, {
          rideId: String(ride._id),
          room: getRideRoom(ride._id),
        });
      }),
    );

    socket.on(
      'acceptRide',
      onAsync(socket, async ({ rideId }) => {
        if (identity.role !== 'driver' || !rideId) {
          return;
        }

        // First successful transaction wins; later accepts are rejected by the service layer.
        const ride = await acceptRideAssignment({ rideId, driverId: identity.sub });
        joinRideRoom(socket, ride._id);
        await notifyRideAccepted(ride);

        const acceptedPayload = {
          rideId: String(ride._id),
          room: getRideRoom(ride._id),
          status: ride.status,
          liveStatus: ride.liveStatus,
          acceptedAt: ride.acceptedAt,
        };

        socket.emit('rideAccepted', acceptedPayload);
        socket.emit(SOCKET_EVENTS.RIDE_STATE, acceptedPayload);
        socket.emit(SOCKET_EVENTS.RIDE_JOINED, {
          rideId: String(ride._id),
          room: getRideRoom(ride._id),
        });
      }),
    );

    socket.on(
      'submitRideBid',
      onAsync(socket, async ({ rideId, bidFare }) => {
        if (identity.role !== 'driver' || !rideId) {
          return;
        }

        const result = await submitRideBid({
          rideId,
          driverId: identity.sub,
          bidFare,
        });

        socket.emit('rideBidSubmitted', {
          rideId: String(rideId),
          bid: result.bid,
        });

        await notifyRideBidUpdated(result);
      }),
    );

    socket.on('rejectRide', ({ rideId }) => {
      if (identity.role !== 'driver' || !rideId) {
        return;
      }

      markDriverRejectedFromDispatch(rideId, identity.sub);
      socket.to(getRideRoom(rideId)).emit('driverRejectedRide', {
        rideId,
        driverId: identity.sub,
      });
    });

    socket.on('disconnect', async () => {
      if (identity.role === 'driver') {
        clearDriverRoute(identity.sub);
        await Driver.findByIdAndUpdate(identity.sub, { socketId: null });
      }
    });
  });

  return io;
};
