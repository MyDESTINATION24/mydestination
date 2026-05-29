import { StandardCheckoutClient, Env } from '@phonepe-pg/pg-sdk-node';

const initializePhonePeClient = () => {
  const clientId = process.env.WH_PHONEPE_CLIENT_ID || 'your_client_id';
  const clientSecret = process.env.WH_PHONEPE_CLIENT_SECRET || 'your_client_secret';
  const clientVersion = Number(process.env.WH_PHONEPE_CLIENT_VERSION) || 1;
  const envString = process.env.WH_PHONEPE_ENV || 'SANDBOX';
  
  const env = envString === 'PRODUCTION' ? Env.PRODUCTION : Env.SANDBOX;

  try {
    return StandardCheckoutClient.getInstance(
      clientId,
      clientSecret,
      clientVersion,
      env
    );
  } catch (error) {
    console.error('Failed to initialize PhonePe client:', error);
    // Returning null if initialization fails, so the app doesn't crash on startup if env vars are missing
    return null;
  }
};

export const phonepeClient = initializePhonePeClient();
